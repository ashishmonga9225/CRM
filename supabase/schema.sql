-- =====================================================================
-- Lead Follow-up CRM: Supabase database setup
-- Run this ONCE in Supabase: SQL Editor -> New query -> paste -> Run.
-- Run it BEFORE you create your own login, so the first user becomes admin.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. USERS (profiles)
-- One row per login. The first person to sign up becomes the active admin.
-- Anyone who signs up later is inactive until an admin activates them,
-- so a stranger who finds the login page cannot see your leads.
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text not null default 'executive' check (role in ('admin', 'executive')),
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  first_user boolean;
begin
  select not exists (select 1 from public.profiles) into first_user;

  insert into public.profiles (id, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    case when first_user then 'admin' else 'executive' end,
    first_user
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper checks used by the security rules below.
create function public.is_crm_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active
  );
$$;

create function public.is_crm_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and is_active and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 2. PROJECTS (your listed developments)
-- ---------------------------------------------------------------------
create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  builder        text,
  location       text,
  property_type  text check (property_type in ('high_rise', 'plot', 'villa', 'commercial', 'other')),
  price_min      numeric(14, 2),
  price_max      numeric(14, 2),
  notes          text,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. LEADS
-- Phone is stored as digits only (optional leading +) and must be unique,
-- which gives the duplicate check.
-- ---------------------------------------------------------------------
create table public.leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  phone               text not null unique check (phone ~ '^\+?[0-9]{7,15}$'),
  alt_phone           text,
  email               text,
  source              text,          -- YouTube, reference, portal, walk-in, ad ...
  source_detail       text,          -- which video, which ad, who referred
  budget_min          numeric(14, 2),
  budget_max          numeric(14, 2),
  requirement         text,          -- 3 BHK high-rise, 200 sq yd plot ...
  preferred_location  text,
  project_id          uuid references public.projects (id) on delete set null,
  status              text not null default 'new' check (status in (
                        'new', 'contacted', 'visit_scheduled', 'visit_done',
                        'negotiation', 'booked', 'lost')),
  temperature         text not null default 'warm' check (temperature in ('hot', 'warm', 'cold')),
  next_follow_up_at   timestamptz,
  lost_reason         text,
  assigned_to         uuid default auth.uid() references public.profiles (id) on delete set null,
  created_by          uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index leads_next_follow_up_idx on public.leads (next_follow_up_at);
create index leads_status_idx         on public.leads (status);
create index leads_assigned_to_idx    on public.leads (assigned_to);
create index leads_project_idx        on public.leads (project_id);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. FOLLOW-UPS (every call, WhatsApp chat or meeting)
-- Saving a follow-up automatically moves the lead's next follow-up date,
-- and a brand-new lead becomes "contacted".
-- ---------------------------------------------------------------------
create table public.follow_ups (
  id                 uuid primary key default gen_random_uuid(),
  lead_id            uuid not null references public.leads (id) on delete cascade,
  contacted_at       timestamptz not null default now(),
  channel            text not null default 'call' check (channel in (
                       'call', 'whatsapp', 'meeting', 'site_visit', 'email', 'other')),
  outcome            text,           -- connected, not answered, call back later ...
  note               text,
  next_follow_up_at  timestamptz,
  created_by         uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now()
);

create index follow_ups_lead_idx on public.follow_ups (lead_id, contacted_at desc);

create function public.apply_follow_up_to_lead()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.leads
  set next_follow_up_at = new.next_follow_up_at,
      status = case when status = 'new' then 'contacted' else status end
  where id = new.lead_id;
  return new;
end;
$$;

create trigger follow_ups_apply_to_lead
  after insert on public.follow_ups
  for each row execute function public.apply_follow_up_to_lead();

-- ---------------------------------------------------------------------
-- 5. SITE VISITS
-- ---------------------------------------------------------------------
create table public.site_visits (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads (id) on delete cascade,
  project_id  uuid references public.projects (id) on delete set null,
  visit_at    timestamptz not null,
  status      text not null default 'scheduled' check (status in (
                'scheduled', 'done', 'cancelled', 'no_show')),
  outcome     text,
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index site_visits_lead_idx  on public.site_visits (lead_id);
create index site_visits_visit_idx on public.site_visits (visit_at);

-- ---------------------------------------------------------------------
-- 6. BOOKINGS (deals and brokerage)
-- A lead with a booking cannot be deleted by accident.
-- ---------------------------------------------------------------------
create table public.bookings (
  id                  uuid primary key default gen_random_uuid(),
  lead_id             uuid not null references public.leads (id) on delete restrict,
  project_id          uuid references public.projects (id) on delete set null,
  unit_details        text,
  deal_value          numeric(14, 2),
  brokerage_amount    numeric(14, 2),
  brokerage_received  numeric(14, 2) not null default 0,
  booking_date        date not null default current_date,
  notes               text,
  created_by          uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now()
);

create index bookings_lead_idx on public.bookings (lead_id);

-- ---------------------------------------------------------------------
-- 7. SECURITY (row-level security)
-- Nothing is readable without a login, and only ACTIVE users get in.
-- ---------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.projects    enable row level security;
alter table public.leads       enable row level security;
alter table public.follow_ups  enable row level security;
alter table public.site_visits enable row level security;
alter table public.bookings    enable row level security;

-- Profiles: you can see your own row; active users can see the team list;
-- only an admin can activate people or change roles.
create policy "profiles: read own or team"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_crm_user());

create policy "profiles: admin can update"
  on public.profiles for update to authenticated
  using (public.is_crm_admin())
  with check (public.is_crm_admin());

-- CRM data: full access for active users.
create policy "projects: active users"
  on public.projects for all to authenticated
  using (public.is_crm_user()) with check (public.is_crm_user());

create policy "leads: active users"
  on public.leads for all to authenticated
  using (public.is_crm_user()) with check (public.is_crm_user());

create policy "follow_ups: active users"
  on public.follow_ups for all to authenticated
  using (public.is_crm_user()) with check (public.is_crm_user());

create policy "site_visits: active users"
  on public.site_visits for all to authenticated
  using (public.is_crm_user()) with check (public.is_crm_user());

create policy "bookings: active users"
  on public.bookings for all to authenticated
  using (public.is_crm_user()) with check (public.is_crm_user());
