import * as XLSX from 'xlsx';
import { Lead, LeadStatus, Temperature } from './types';
import { saveLead, checkDuplicatePhone } from './storage';

export interface ParsedLeadRow {
  name: string;
  phone: string;
  email?: string;
  status: LeadStatus;
  temperature: Temperature;
  source: string;
  budget_min?: number;
  budget_max?: number;
  requirement?: string;
  notes?: string;
  isDuplicate?: boolean;
}

// Map user status text (like "interested", "not interested", "lost", "pending") to CRM statuses
export function normalizeStatus(raw: string): { status: LeadStatus; temperature: Temperature } {
  const s = (raw || '').toLowerCase().trim();

  if (s.includes('not interest') || s.includes('uninterested') || s.includes('reject') || s.includes('lost') || s.includes('dropped')) {
    return { status: 'lost', temperature: 'cold' };
  }
  if (s.includes('book') || s.includes('closed') || s.includes('deal done') || s.includes('won')) {
    return { status: 'booked', temperature: 'hot' };
  }
  if (s.includes('negotiat') || s.includes('discuss') || s.includes('offer')) {
    return { status: 'negotiation', temperature: 'hot' };
  }
  if (s.includes('visit done') || s.includes('visited') || s.includes('site done')) {
    return { status: 'visit_done', temperature: 'hot' };
  }
  if (s.includes('visit') || s.includes('scheduled') || s.includes('appointment')) {
    return { status: 'visit_scheduled', temperature: 'hot' };
  }
  if (s.includes('interest') || s.includes('hot') || s.includes('very interested')) {
    return { status: 'contacted', temperature: 'hot' };
  }
  if (s.includes('contact') || s.includes('call') || s.includes('spoke')) {
    return { status: 'contacted', temperature: 'warm' };
  }
  if (s.includes('cold')) {
    return { status: 'new', temperature: 'cold' };
  }
  return { status: 'new', temperature: 'warm' };
}

// Download a formatted sample Excel (.xlsx) file
export function downloadExcelTemplate(): void {
  const templateData = [
    {
      'Name': 'Amit Saxena',
      'Number': '9876543211',
      'Status': 'Interested',
      'Temperature': 'Hot',
      'Requirement': '3 BHK Park Facing',
      'Source': 'MagicBricks',
      'Notes': 'Pre-approved loan ready, wants immediate visit'
    },
    {
      'Name': 'Priya Sharma',
      'Number': '9812345678',
      'Status': 'Not Interested',
      'Temperature': 'Cold',
      'Requirement': '1 BHK near metro',
      'Source': 'Meta Ads',
      'Notes': 'Budget too low for current inventory'
    },
    {
      'Name': 'Rajesh Gupta',
      'Number': '9899112233',
      'Status': 'Visit Scheduled',
      'Temperature': 'Hot',
      'Requirement': '4 BHK Luxury Floor',
      'Source': 'Referral',
      'Notes': 'Visiting project this Sunday 11 AM'
    },
    {
      'Name': 'Sunita Deshmukh',
      'Number': '9722334455',
      'Status': 'New',
      'Temperature': 'Warm',
      'Requirement': '2 BHK Investment',
      'Source': '99acres',
      'Notes': 'Inquired today morning'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  
  ws['!cols'] = [
    { wch: 18 }, // Name
    { wch: 16 }, // Number
    { wch: 20 }, // Status
    { wch: 12 }, // Temperature
    { wch: 25 }, // Requirement
    { wch: 15 }, // Source
    { wch: 35 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads Template');
  XLSX.writeFile(wb, 'LeadCRM_Sample_Upload_Template.xlsx');
}

// Parse Excel (.xlsx / .xls) or CSV File
export async function parseExcelOrCsvFile(file: File): Promise<ParsedLeadRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawData || rawData.length < 2) {
    return [];
  }

  const headers = rawData[0].map(h => String(h || '').toLowerCase().trim());

  const nameIdx = headers.findIndex(h => 
    h.includes('name') || h.includes('client') || h.includes('customer') || h.includes('lead')
  );
  const phoneIdx = headers.findIndex(h => 
    h.includes('number') || h.includes('phone') || h.includes('mobile') || h.includes('contact') || h.includes('cell')
  );
  const statusIdx = headers.findIndex(h => 
    h.includes('status') || h.includes('stage') || h.includes('interest')
  );
  const tempIdx = headers.findIndex(h => 
    h.includes('temp') || h.includes('priority') || h.includes('rating') || h.includes('hot')
  );
  const reqIdx = headers.findIndex(h => 
    h.includes('requirement') || h.includes('req') || h.includes('unit') || h.includes('property') || h.includes('configuration')
  );
  const sourceIdx = headers.findIndex(h => 
    h.includes('source') || h.includes('channel') || h.includes('campaign')
  );
  const notesIdx = headers.findIndex(h => 
    h.includes('note') || h.includes('remark') || h.includes('comment')
  );
  const emailIdx = headers.findIndex(h => 
    h.includes('email') || h.includes('mail')
  );

  const parsedLeads: ParsedLeadRow[] = [];

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || row.length === 0) continue;

    const rawName = String(nameIdx !== -1 ? row[nameIdx] : row[0] || '').trim();
    const rawPhone = String(phoneIdx !== -1 ? row[phoneIdx] : row[1] || '').trim();

    if (!rawName && !rawPhone) continue;

    // Database check constraint requires 7 to 15 digits
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length < 7 || cleanPhone.length > 15) continue;

    const rawStatus = statusIdx !== -1 ? String(row[statusIdx] || '') : '';
    const rawTemp = tempIdx !== -1 ? String(row[tempIdx] || '') : '';

    const { status, temperature } = normalizeStatus(rawStatus || rawTemp);

    const parsedRow: ParsedLeadRow = {
      name: rawName || `Lead ${cleanPhone.slice(-4)}`,
      phone: cleanPhone,
      email: emailIdx !== -1 ? String(row[emailIdx] || '').trim() : undefined,
      status,
      temperature: rawTemp.toLowerCase().includes('hot')
        ? 'hot'
        : rawTemp.toLowerCase().includes('cold')
        ? 'cold'
        : temperature,
      requirement: reqIdx !== -1 ? String(row[reqIdx] || '').trim() : undefined,
      source: sourceIdx !== -1 && row[sourceIdx] ? String(row[sourceIdx]).trim() : 'Excel Import',
      notes: notesIdx !== -1 ? String(row[notesIdx] || '').trim() : undefined,
    };

    parsedLeads.push(parsedRow);
  }

  return parsedLeads;
}

// Bulk Save Parsed Leads into CRM
export async function commitBulkLeads(
  leadsToImport: ParsedLeadRow[],
  skipDuplicates = true
): Promise<{ added: number; updated: number; skipped: number }> {
  let added = 0;
  let updated = 0;
  let skipped = 0;

  const todayIso = new Date().toISOString();

  for (const item of leadsToImport) {
    const existing = await checkDuplicatePhone(item.phone);

    if (existing) {
      if (skipDuplicates) {
        skipped++;
        continue;
      } else {
        await saveLead({
          id: existing.id,
          name: item.name || existing.name,
          status: item.status || existing.status,
          temperature: item.temperature || existing.temperature,
          requirement: item.requirement || existing.requirement,
          lost_reason: item.status === 'lost' ? item.notes || 'Marked lost during import' : undefined,
        });
        updated++;
        continue;
      }
    }

    await saveLead({
      name: item.name,
      phone: item.phone,
      email: item.email,
      status: item.status,
      temperature: item.temperature,
      source: item.source || 'Excel Import',
      requirement: item.requirement,
      lost_reason: item.status === 'lost' ? item.notes || 'Marked lost during import' : undefined,
      next_follow_up_at: todayIso,
    });
    added++;
  }

  return { added, updated, skipped };
}

// Export All Leads to Excel (.xlsx) file
export function exportLeadsToExcel(leads: Lead[]): void {
  const exportData = leads.map(l => ({
    'Name': l.name,
    'Number': l.phone,
    'Status': l.status,
    'Temperature': l.temperature,
    'Source': l.source || '',
    'Budget Min': l.budget_min || '',
    'Budget Max': l.budget_max || '',
    'Requirement': l.requirement || '',
    'Project': l.project?.name || '',
    'Next Follow-Up': l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleDateString('en-IN') : '',
    'Lost Reason': l.lost_reason || '',
    'Created At': new Date(l.created_at).toLocaleDateString('en-IN')
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 15 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 22 },
    { wch: 16 },
    { wch: 25 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  XLSX.writeFile(wb, `Leads_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportLeadsToCSV(leads: Lead[]): void {
  exportLeadsToExcel(leads);
}

export async function parseAndImportCSV(fileText: string): Promise<{ success: number; failed: number }> {
  const blob = new Blob([fileText], { type: 'text/csv' });
  const file = new File([blob], 'import.csv');
  const rows = await parseExcelOrCsvFile(file);
  const res = await commitBulkLeads(rows, true);
  return { success: res.added + res.updated, failed: res.skipped };
}
