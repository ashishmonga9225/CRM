import { Lead, FollowUp, SiteVisit, Project, LeadStatus, Temperature, Channel } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const TODAY_ISO = new Date().toISOString();
const YESTERDAY_ISO = new Date(Date.now() - 86400000).toISOString();
const TOMORROW_ISO = new Date(Date.now() + 86400000).toISOString();
const NEXT_WEEK_ISO = new Date(Date.now() + 7 * 86400000).toISOString();

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Godrej Palm Retreat',
    builder: 'Godrej Properties',
    location: 'Sector 150, Noida',
    property_type: 'high_rise',
    price_min: 11000000,
    price_max: 24000000,
    notes: '2BHK, 3BHK Luxury Resort Homes',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'proj-2',
    name: 'DLF Cybercity Floors',
    builder: 'DLF',
    location: 'DLF Phase 2, Gurgaon',
    property_type: 'villa',
    price_min: 35000000,
    price_max: 55000000,
    notes: '4BHK Independent Builder Floors',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'proj-3',
    name: 'Prestige City Highline',
    builder: 'Prestige Group',
    location: 'Sarjapur, Bangalore',
    property_type: 'high_rise',
    price_min: 7500000,
    price_max: 16000000,
    notes: '1BHK, 2BHK, 3BHK Premium Highrise',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Rahul Sharma',
    phone: '9876543210',
    email: 'rahul.sharma@example.com',
    source: 'MagicBricks',
    source_detail: 'Campaign: 3BHK Expressway',
    budget_min: 12000000,
    budget_max: 15000000,
    budget_text: '₹1.2 Cr - ₹1.5 Cr',
    requirement: '3 BHK corner unit with park view',
    project_id: 'proj-1',
    status: 'contacted',
    temperature: 'hot',
    next_follow_up_at: TODAY_ISO,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_follow_up: {
      id: 'fu-1',
      lead_id: 'lead-1',
      contacted_at: new Date().toISOString(),
      channel: 'call',
      note: 'Spoke for 15 mins. Wants to visit project with family this Sunday morning.',
      outcome: 'Connected - Site visit promised',
      next_follow_up_at: TODAY_ISO,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'lead-2',
    name: 'Ananya Deshmukh',
    phone: '9820011223',
    email: 'ananya.d@example.com',
    source: 'Meta Ads',
    source_detail: 'Lead Form #402',
    budget_min: 8000000,
    budget_max: 10000000,
    budget_text: '₹80 L - ₹1 Cr',
    requirement: '2 BHK ready to move or near possession',
    project_id: 'proj-3',
    status: 'new',
    temperature: 'warm',
    next_follow_up_at: YESTERDAY_ISO,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    last_follow_up: {
      id: 'fu-2',
      lead_id: 'lead-2',
      contacted_at: new Date(Date.now() - 86400000).toISOString(),
      channel: 'whatsapp',
      note: 'Shared digital brochure and payment plans. No reply yet.',
      outcome: 'Brochure sent',
      next_follow_up_at: YESTERDAY_ISO,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  },
  {
    id: 'lead-3',
    name: 'Vikramjit Singh',
    phone: '9988776655',
    email: 'v.singh@example.com',
    source: 'Referral',
    source_detail: 'Dr. Kohli reference',
    budget_min: 35000000,
    budget_max: 45000000,
    budget_text: '₹3.5 Cr - ₹4.5 Cr',
    requirement: '4 BHK Luxury Floor with private terrace',
    project_id: 'proj-2',
    status: 'visit_done',
    temperature: 'hot',
    next_follow_up_at: TODAY_ISO,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    last_follow_up: {
      id: 'fu-3',
      lead_id: 'lead-3',
      contacted_at: new Date().toISOString(),
      channel: 'meeting',
      note: 'Completed site visit yesterday. Loved 2nd floor unit. Call today to negotiate final pricing.',
      outcome: 'Negotiation stage',
      next_follow_up_at: TODAY_ISO,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: 'lead-4',
    name: 'Pooja Iyer',
    phone: '9711223344',
    source: '99acres',
    budget_text: '₹90 Lacs',
    requirement: '2 BHK investment property with good rental yield',
    project_id: 'proj-3',
    status: 'contacted',
    temperature: 'cold',
    next_follow_up_at: TOMORROW_ISO,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_VISITS: SiteVisit[] = [
  {
    id: 'visit-1',
    lead_id: 'lead-3',
    project_id: 'proj-2',
    visit_at: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled',
    outcome: 'Re-visit with structural architect and spouse.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'visit-2',
    lead_id: 'lead-1',
    project_id: 'proj-1',
    visit_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    status: 'scheduled',
    outcome: 'Pickup arranged from Metro Station at 11 AM.',
    created_at: new Date().toISOString(),
  },
];

const INITIAL_FOLLOWUPS: FollowUp[] = [
  {
    id: 'fu-1a',
    lead_id: 'lead-1',
    contacted_at: new Date(Date.now() - 3600000).toISOString(),
    channel: 'call',
    outcome: 'Site visit promised',
    note: 'Spoke for 15 mins. Wants to visit project with family this Sunday morning.',
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'fu-1b',
    lead_id: 'lead-1',
    contacted_at: new Date(Date.now() - 86400000).toISOString(),
    channel: 'whatsapp',
    outcome: 'WhatsApp message sent',
    note: 'Hi Rahul, Ashish this side. We have received your query regarding 3 BHK corner unit. Are you looking for investment or self-use?',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'fu-2a',
    lead_id: 'lead-2',
    contacted_at: new Date(Date.now() - 86400000).toISOString(),
    channel: 'whatsapp',
    outcome: 'Brochure sent',
    note: 'Shared digital brochure and payment plans. No reply yet.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'fu-3a',
    lead_id: 'lead-3',
    contacted_at: new Date().toISOString(),
    channel: 'meeting',
    outcome: 'Negotiation stage',
    note: 'Completed site visit yesterday. Loved 2nd floor unit. Call today to negotiate final pricing.',
    created_at: new Date().toISOString(),
  },
  {
    id: 'fu-3b',
    lead_id: 'lead-3',
    contacted_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    channel: 'call',
    outcome: 'Visit scheduled',
    note: 'Initial inquiry via Dr. Kohli reference. Scheduled site visit with architect.',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

const LOCAL_STORAGE_KEY_LEADS = 'crm_leads_v2';
const LOCAL_STORAGE_KEY_PROJECTS = 'crm_projects_v2';
const LOCAL_STORAGE_KEY_FOLLOWUPS = 'crm_followups_v2';
const LOCAL_STORAGE_KEY_VISITS = 'crm_visits_v2';

function getLocal<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocal<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Local storage write failed', e);
  }
}

export async function fetchProjects(): Promise<Project[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('projects').select('*').order('name');
    if (!error && data) return data;
  }
  const local = getLocal<Project[]>(LOCAL_STORAGE_KEY_PROJECTS, INITIAL_PROJECTS);
  setLocal(LOCAL_STORAGE_KEY_PROJECTS, local);
  return local;
}

export async function createProject(project: Partial<Project>): Promise<Project> {
  if (isSupabaseConfigured && supabase) {
    const payload = {
      name: project.name || 'Untitled Project',
      builder: project.builder || null,
      location: project.location || null,
      property_type: project.property_type || 'other',
      price_min: project.price_min || null,
      price_max: project.price_max || null,
      notes: project.notes || null,
      is_active: true,
    };
    const { data, error } = await supabase.from('projects').insert(payload).select().single();
    if (!error && data) return data;
  }

  const newProj: Project = {
    id: 'proj-' + Date.now(),
    name: project.name || 'Untitled Project',
    builder: project.builder,
    location: project.location,
    property_type: project.property_type || 'other',
    price_min: project.price_min,
    price_max: project.price_max,
    notes: project.notes,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const list = await fetchProjects();
  const updated = [newProj, ...list];
  setLocal(LOCAL_STORAGE_KEY_PROJECTS, updated);
  return newProj;
}

export async function fetchLeads(): Promise<Lead[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('leads')
      .select('*, project:projects(*), follow_ups(id, note, outcome, next_follow_up_at, channel, contacted_at, created_at)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      return data.map((l: any) => {
        const sortedFu = l.follow_ups?.sort((a: any, b: any) =>
          new Date(b.contacted_at || b.created_at).getTime() - new Date(a.contacted_at || a.created_at).getTime()
        );
        return {
          ...l,
          follow_ups: sortedFu || [],
          last_follow_up: sortedFu && sortedFu.length > 0 ? sortedFu[0] : undefined,
        };
      });
    }
  }

  const local = getLocal<Lead[]>(LOCAL_STORAGE_KEY_LEADS, INITIAL_LEADS);
  const projects = await fetchProjects();
  const allFollowUps = getLocal<FollowUp[]>(LOCAL_STORAGE_KEY_FOLLOWUPS, INITIAL_FOLLOWUPS);
  return local.map(lead => {
    const leadFus = allFollowUps
      .filter(f => f.lead_id === lead.id)
      .sort(
        (a, b) =>
          new Date(b.contacted_at || b.created_at).getTime() -
          new Date(a.contacted_at || a.created_at).getTime()
      );
    return {
      ...lead,
      project: projects.find(p => p.id === lead.project_id),
      follow_ups:
        leadFus.length > 0 ? leadFus : lead.last_follow_up ? [lead.last_follow_up] : [],
      last_follow_up: leadFus[0] || lead.last_follow_up,
    };
  });
}

export async function fetchLeadById(id: string): Promise<Lead | null> {
  const leads = await fetchLeads();
  return leads.find(l => l.id === id) || null;
}

export async function checkDuplicatePhone(phone: string, currentLeadId?: string): Promise<Lead | null> {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length < 7) return null;

  const leads = await fetchLeads();
  return (
    leads.find(l => {
      if (currentLeadId && l.id === currentLeadId) return false;
      const existingClean = l.phone.trim().replace(/\D/g, '');
      return (
        existingClean.endsWith(cleanPhone) ||
        cleanPhone.endsWith(existingClean) ||
        existingClean === cleanPhone
      );
    }) || null
  );
}

export async function saveLead(leadData: Partial<Lead>): Promise<Lead> {
  // Clean phone number to digits only (matches database check)
  const phoneClean = leadData.phone ? leadData.phone.replace(/\D/g, '') : undefined;

  if (leadData.id) {
    // Update existing
    if (isSupabaseConfigured && supabase) {
      const payload: any = { ...leadData };
      if (phoneClean) payload.phone = phoneClean;
      delete payload.project;
      delete payload.last_follow_up;
      delete payload.budget_text;

      const { data, error } = await supabase
        .from('leads')
        .update(payload)
        .eq('id', leadData.id)
        .select()
        .single();
      if (!error && data) return data;
    }

    const leads = await fetchLeads();
    const updated = leads.map(l =>
      l.id === leadData.id
        ? { ...l, ...leadData, updated_at: new Date().toISOString() }
        : l
    );
    setLocal(LOCAL_STORAGE_KEY_LEADS, updated);
    return updated.find(l => l.id === leadData.id)!;
  } else {
    // Insert new
    const payload: any = {
      name: leadData.name || '',
      phone: phoneClean || '',
      email: leadData.email || null,
      source: leadData.source || 'Manual',
      source_detail: leadData.source_detail || null,
      budget_min: leadData.budget_min || null,
      budget_max: leadData.budget_max || null,
      requirement: leadData.requirement || null,
      preferred_location: leadData.preferred_location || null,
      project_id: leadData.project_id || null,
      status: leadData.status || 'new',
      temperature: leadData.temperature || 'warm',
      next_follow_up_at: leadData.next_follow_up_at || new Date().toISOString(),
      lost_reason: leadData.lost_reason || null,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').insert(payload).select().single();
      if (!error && data) return data;
      if (error) console.error('Supabase saveLead error:', error);
    }

    const newLead: Lead = {
      ...payload,
      id: 'lead-' + Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const leads = await fetchLeads();
    const updated = [newLead, ...leads];
    setLocal(LOCAL_STORAGE_KEY_LEADS, updated);
    return newLead;
  }
}

export async function addFollowUp(
  leadId: string,
  data: {
    channel: Channel;
    note: string;
    outcome?: string;
    next_follow_up_at?: string;
  }
): Promise<FollowUp> {
  const followUpPayload = {
    lead_id: leadId,
    channel: data.channel,
    note: data.note,
    outcome: data.outcome || null,
    next_follow_up_at: data.next_follow_up_at || null,
    contacted_at: new Date().toISOString(),
  };

  if (isSupabaseConfigured && supabase) {
    const { data: inserted, error } = await supabase
      .from('follow_ups')
      .insert(followUpPayload)
      .select()
      .single();
    if (!error && inserted) {
      return inserted;
    }
  }

  const followUp: FollowUp = {
    id: 'fu-' + Date.now(),
    ...followUpPayload,
    created_at: new Date().toISOString(),
  };

  const allFollowUps = getLocal<FollowUp[]>(LOCAL_STORAGE_KEY_FOLLOWUPS, INITIAL_FOLLOWUPS);
  setLocal(LOCAL_STORAGE_KEY_FOLLOWUPS, [followUp, ...allFollowUps]);

  // Update lead in local storage
  const leads = await fetchLeads();
  const updatedLeads = leads.map(l => {
    if (l.id === leadId) {
      return {
        ...l,
        next_follow_up_at: data.next_follow_up_at || l.next_follow_up_at,
        status: l.status === 'new' ? ('contacted' as LeadStatus) : l.status,
        last_follow_up: followUp,
        updated_at: new Date().toISOString(),
      };
    }
    return l;
  });
  setLocal(LOCAL_STORAGE_KEY_LEADS, updatedLeads);

  return followUp;
}

export async function addLeadNote(
  leadId: string,
  noteText: string,
  channel: Channel = 'other'
): Promise<FollowUp> {
  return addFollowUp(leadId, {
    channel,
    note: noteText.trim(),
    outcome: 'Note Added',
  });
}

export async function fetchFollowUpsForLead(leadId: string): Promise<FollowUp[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('follow_ups')
      .select('*')
      .eq('lead_id', leadId)
      .order('contacted_at', { ascending: false });
    if (data) return data;
  }

  const all = getLocal<FollowUp[]>(LOCAL_STORAGE_KEY_FOLLOWUPS, []);
  return all
    .filter(f => f.lead_id === leadId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function fetchSiteVisits(): Promise<SiteVisit[]> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase
      .from('site_visits')
      .select('*, lead:leads(*), project:projects(*)')
      .order('visit_at', { ascending: true });
    if (data) return data;
  }

  const visits = getLocal<SiteVisit[]>(LOCAL_STORAGE_KEY_VISITS, INITIAL_VISITS);
  const leads = await fetchLeads();
  const projects = await fetchProjects();

  return visits.map(v => ({
    ...v,
    lead: leads.find(l => l.id === v.lead_id),
    project: projects.find(p => p.id === v.project_id),
  }));
}

export async function scheduleSiteVisit(visit: {
  lead_id: string;
  project_id?: string;
  visit_at: string;
  notes?: string;
}): Promise<SiteVisit> {
  const payload = {
    lead_id: visit.lead_id,
    project_id: visit.project_id || null,
    visit_at: visit.visit_at,
    status: 'scheduled' as const,
    outcome: visit.notes || null,
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('site_visits').insert(payload).select().single();
    if (!error && data) {
      await saveLead({ id: visit.lead_id, status: 'visit_scheduled' });
      return data;
    }
  }

  const newVisit: SiteVisit = {
    id: 'visit-' + Date.now(),
    ...payload,
    created_at: new Date().toISOString(),
  };

  const visits = getLocal<SiteVisit[]>(LOCAL_STORAGE_KEY_VISITS, INITIAL_VISITS);
  setLocal(LOCAL_STORAGE_KEY_VISITS, [newVisit, ...visits]);

  await saveLead({ id: visit.lead_id, status: 'visit_scheduled' });
  return newVisit;
}

export async function updateSiteVisitOutcome(id: string, outcome: string, status: SiteVisit['status']): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.from('site_visits').update({ outcome, status }).eq('id', id);
  }
  const visits = getLocal<SiteVisit[]>(LOCAL_STORAGE_KEY_VISITS, INITIAL_VISITS);
  const updated = visits.map(v => (v.id === id ? { ...v, outcome, status } : v));
  setLocal(LOCAL_STORAGE_KEY_VISITS, updated);
}

export async function updateLeadStatus(id: string, status: LeadStatus, lostReason?: string): Promise<void> {
  const payload: Partial<Lead> = {
    id,
    status,
    lost_reason: lostReason || undefined,
  };
  await saveLead(payload);
}
