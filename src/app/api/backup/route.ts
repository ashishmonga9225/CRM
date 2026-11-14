import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    let leads: any[] = [];

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        leads = data;
      }
    }

    const headers = [
      'Name',
      'Phone',
      'Email',
      'Status',
      'Priority',
      'Source',
      'Budget',
      'Requirement',
      'Next Follow-Up Date',
      'Notes',
      'Created At',
    ];

    const rows = leads.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.email || '').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.priority || '').replace(/"/g, '""')}"`,
      `"${(l.source || '').replace(/"/g, '""')}"`,
      `"${(l.budget || '').replace(/"/g, '""')}"`,
      `"${(l.requirement || '').replace(/"/g, '""')}"`,
      `"${(l.next_follow_up_date || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
      `"${(l.created_at || '').replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="CRM_Weekly_Backup_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
