export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'visit_scheduled'
  | 'visit_done'
  | 'negotiation'
  | 'booked'
  | 'lost';

export type Temperature = 'hot' | 'warm' | 'cold';

export type Channel = 'call' | 'whatsapp' | 'meeting' | 'site_visit' | 'email' | 'other';

export type SiteVisitStatus = 'scheduled' | 'done' | 'cancelled' | 'no_show';

export type UserRole = 'admin' | 'executive';

export interface Profile {
  id: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  builder?: string;
  location?: string;
  property_type?: 'high_rise' | 'plot' | 'villa' | 'commercial' | 'other';
  price_min?: number;
  price_max?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  contacted_at: string;
  channel: Channel;
  outcome?: string | null;
  note?: string | null;
  next_follow_up_at?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  alt_phone?: string | null;
  email?: string | null;
  source?: string | null;
  source_detail?: string | null;
  budget_min?: number | null;
  budget_max?: number | null;
  budget_text?: string | null;
  requirement?: string | null;
  preferred_location?: string | null;
  project_id?: string | null;
  project?: Project | null;
  status: LeadStatus;
  temperature: Temperature;
  next_follow_up_at?: string | null;
  lost_reason?: string | null;
  assigned_to?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  last_follow_up?: FollowUp | null;
}

export interface SiteVisit {
  id: string;
  lead_id: string;
  lead?: Lead | null;
  project_id?: string | null;
  project?: Project | null;
  visit_at: string;
  status: SiteVisitStatus;
  outcome?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  lead_id: string;
  lead?: Lead;
  project_id?: string;
  project?: Project;
  unit_details?: string;
  deal_value: number;
  brokerage_amount?: number;
  brokerage_received: number;
  booking_date: string;
  notes?: string;
  created_by?: string;
  created_at: string;
}
