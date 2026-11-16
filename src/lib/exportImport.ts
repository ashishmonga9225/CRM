import * as XLSX from 'xlsx';
import { Lead, LeadStatus, Temperature } from './types';
import { saveLead, checkDuplicatePhone, addFollowUp } from './storage';
import type { UserProfile } from './auth';

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
  skipDuplicates = true,
  currentUser?: UserProfile | null
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
        await saveLead(
          {
            id: existing.id,
            name: item.name || existing.name,
            status: item.status || existing.status,
            temperature: item.temperature || existing.temperature,
            requirement: item.requirement || existing.requirement,
            lost_reason: item.status === 'lost' ? item.notes || 'Marked lost during import' : undefined,
          },
          currentUser
        );
        if (item.notes && item.notes.trim()) {
          await addFollowUp(existing.id, {
            channel: 'other',
            outcome: 'Imported Note',
            note: item.notes.trim(),
          });
        }
        updated++;
        continue;
      }
    }

    const created = await saveLead(
      {
        name: item.name,
        phone: item.phone,
        email: item.email,
        status: item.status,
        temperature: item.temperature,
        source: item.source || 'Excel Import',
        requirement: item.requirement,
        lost_reason: item.status === 'lost' ? item.notes || 'Marked lost during import' : undefined,
        next_follow_up_at: todayIso,
        assigned_to: currentUser ? currentUser.id : undefined,
        created_by: currentUser ? currentUser.id : undefined,
      },
      currentUser
    );
    if (created && item.notes && item.notes.trim()) {
      await addFollowUp(created.id, {
        channel: 'other',
        outcome: 'Imported Note',
        note: item.notes.trim(),
      });
    }
    added++;
  }

  return { added, updated, skipped };
}

// Export All Leads to Excel (.xlsx) file
export function exportLeadsToExcel(leads: Lead[], customFilename?: string): void {
  const exportData = leads.map((l, idx) => ({
    'S.No': idx + 1,
    'Name': l.name,
    'Phone': l.phone,
    'Status': l.status.replace('_', ' '),
    'Temperature': l.temperature.toUpperCase(),
    'Source': l.source || 'Direct',
    'Project': l.project?.name || '',
    'Budget Min': l.budget_min || '',
    'Budget Max': l.budget_max || '',
    'Requirement': l.requirement || '',
    'Next Follow-Up': l.next_follow_up_at
      ? new Date(l.next_follow_up_at).toLocaleDateString('en-IN')
      : '',
    'Latest Note': l.last_follow_up?.note || '',
    'Lost Reason': l.lost_reason || '',
    'Created At': new Date(l.created_at).toLocaleDateString('en-IN'),
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 18 },
    { wch: 15 },
    { wch: 16 },
    { wch: 12 },
    { wch: 15 },
    { wch: 22 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
    { wch: 16 },
    { wch: 35 },
    { wch: 20 },
    { wch: 14 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Leads');
  const filename =
    customFilename || `Leads_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// Export Leads to Printable PDF Report
export function exportLeadsToPDF(
  leads: Lead[],
  title: string = 'All Leads Report'
): void {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert(
      'Please allow popups to open the PDF report print preview, or use Excel download.'
    );
    return;
  }

  const rowsHtml = leads
    .map(
      (l, idx) => `
    <tr>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">
        ${idx + 1}. ${l.name}
        <div style="font-size: 10px; color: #64748b; font-weight: normal;">${l.source || 'Direct'}</div>
      </td>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-weight: 600; color: #1e293b;">
        ${l.phone}
      </td>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-transform: uppercase; font-size: 10px; font-weight: bold;">
        <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; ${
          l.temperature === 'hot'
            ? 'background: #fee2e2; color: #991b1b;'
            : l.temperature === 'warm'
            ? 'background: #fef3c7; color: #92400e;'
            : 'background: #dbeafe; color: #1e40af;'
        }">
          ${l.temperature}
        </span>
      </td>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-transform: capitalize; font-weight: 600; color: #334155;">
        ${l.status.replace('_', ' ')}
      </td>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #0f172a; font-weight: 600;">
        ${l.project?.name || 'Any'}
      </td>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #334155;">
        ${l.requirement || '—'}
      </td>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #1d4ed8;">
        ${l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleDateString('en-IN') : '—'}
      </td>
      <td style="padding: 7px 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; color: #475569; max-width: 220px; line-height: 1.35;">
        ${l.last_follow_up?.note ? `"${l.last_follow_up.note}"` : '—'}
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title} - ${new Date().toISOString().split('T')[0]}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 18px;
            color: #0f172a;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 14px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
          }
          .header .sub {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .badge {
            background: #eff6ff;
            color: #1d4ed8;
            font-weight: bold;
            font-size: 12px;
            padding: 5px 12px;
            border-radius: 8px;
            border: 1px solid #bfdbfe;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            text-align: left;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 7px 10px;
            border-bottom: 2px solid #cbd5e1;
            font-weight: 700;
          }
          .footer {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px; background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 13px; font-weight: 600; color: #1e40af;">
            📄 Report ready with ${leads.length} leads. Select "Save as PDF" in the destination dropdown in the print preview dialog.
          </span>
          <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 6px 14px; border-radius: 6px; font-weight: bold; cursor: pointer;">
            Print / Save as PDF
          </button>
        </div>

        <div class="header">
          <div>
            <h1>Lead Follow-up CRM &bull; ${title}</h1>
            <div class="sub">Generated on ${new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })} &bull; Ashish CRM</div>
          </div>
          <div class="badge">
            Total Leads: ${leads.length}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Lead Name</th>
              <th>Phone</th>
              <th>Temp</th>
              <th>Status</th>
              <th>Project</th>
              <th>Requirement</th>
              <th>Next Follow-up</th>
              <th>Latest Note</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>Lead Follow-up CRM &copy; ${new Date().getFullYear()}</span>
          <span>Confidential Client Record</span>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
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
