-- =====================================================================
-- Remodel Studio — initial schema
-- Auth: Supabase Auth (auth.users)
-- All tables guarded by RLS; helper fns at the top.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ---------- enums -----------------------------------------------------
create type user_role as enum ('admin','sales','designer','estimator','project_manager','client');
create type project_type as enum ('kitchen','bathroom','full_home','multi_room','commercial');
create type project_status as enum (
  'new_lead','consultation_scheduled','discovery_completed',
  'estimate_pending','estimate_sent','negotiation',
  'approved','in_progress','completed','lost'
);
create type comm_method as enum ('email','phone','sms','any');
create type media_kind as enum ('photo','video','voice_note','pdf','floorplan','inspiration');
create type media_category as enum ('existing_condition','inspiration','utility','damage','measurement','other');
create type estimate_status as enum ('draft','sent','accepted','rejected','revised');
create type activity_kind as enum (
  'created','status_changed','note_added','file_uploaded','form_section_completed',
  'estimate_sent','estimate_signed','consultation_logged','assigned'
);

-- ---------- helpers ---------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles --------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  role user_role not null default 'client',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.profiles (role);
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.has_role(target_role user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.role = target_role and p.is_active);
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.is_active
      and p.role in ('admin','sales','designer','estimator','project_manager')
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_role('admin');
$$;

-- auto-create profile when an auth user is inserted
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'client')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- clients (homeowners) -------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null, -- if they have a login
  full_name text not null,
  email text,
  phone text,
  address_street text,
  address_city text,
  address_state text,
  address_zip text,
  preferred_comm comm_method default 'email',
  best_time_to_contact text,
  referral_source text,
  primary_residence boolean,
  occupancy_status text,
  years_in_home int,
  planning_to_sell boolean,
  remodeled_before boolean,
  decision_makers text,
  owner_id uuid references public.profiles(id) on delete set null, -- assigned staff
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.clients (owner_id);
create index on public.clients (profile_id);
create trigger trg_clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

-- ---------- projects --------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  type project_type not null,
  status project_status not null default 'new_lead',
  rooms text[] default '{}',
  desired_completion date,
  start_flexibility text,
  motivation text,
  pain_points text,
  must_stay_unchanged text,
  top_priorities text,
  function_vs_aesthetic int check (function_vs_aesthetic between 0 and 100),
  luxury_level int check (luxury_level between 0 and 100),
  budget_flexibility int check (budget_flexibility between 0 and 100),
  timeline_urgency int check (timeline_urgency between 0 and 100),
  design_boldness int check (design_boldness between 0 and 100),
  accessibility_needs boolean default false,
  aging_in_place boolean default false,
  child_pet_considerations text,
  budget_min numeric(12,2),
  budget_ideal numeric(12,2),
  budget_max numeric(12,2),
  budget_financing boolean default false,
  willing_to_splurge text,
  willing_to_save text,
  phase_remodel_ok boolean default false,
  hard_deadline date,
  vacation_schedule text,
  temporary_relocation boolean default false,
  hoa_restrictions text,
  permit_concerns text,
  expected_value numeric(12,2),
  pipeline_position int default 0,
  consultant_id uuid references public.profiles(id) on delete set null,
  designer_id uuid references public.profiles(id) on delete set null,
  estimator_id uuid references public.profiles(id) on delete set null,
  pm_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects (client_id);
create index on public.projects (status);
create index on public.projects (type);
create index on public.projects (consultant_id);
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------- rooms (per-project room data) ----------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  kind text not null, -- e.g. 'kitchen', 'primary_bath', 'guest_bath', 'living_room'
  label text,
  length_in numeric(8,2),
  width_in numeric(8,2),
  ceiling_in numeric(8,2),
  layout_type text,
  notes text,
  data jsonb not null default '{}'::jsonb, -- room-specific freeform answers
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.rooms (project_id);
create trigger trg_rooms_updated before update on public.rooms
  for each row execute function public.set_updated_at();

-- ---------- form templates / question library ------------------------
create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, -- 'kitchen_v1', 'bathroom_v1', 'full_home_v1'
  name text not null,
  description text,
  applies_to project_type[] default '{}',
  schema jsonb not null, -- full form definition (sections, questions, conditions)
  version int not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_question_sets_updated before update on public.question_sets
  for each row execute function public.set_updated_at();

-- per-project answers (denormalized; canonical fields above on projects/rooms; this catches custom)
create table public.answers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  question_set_slug text not null,
  question_id text not null, -- field id within the schema
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, room_id, question_set_slug, question_id)
);
create index on public.answers (project_id);
create index on public.answers (room_id);
create trigger trg_answers_updated before update on public.answers
  for each row execute function public.set_updated_at();

-- ---------- measurements / annotated images -------------------------
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  label text not null, -- 'window 1', 'sink wall'
  kind text, -- 'window','door','appliance','wall','outlet','plumbing'
  value_in numeric(8,2),
  width_in numeric(8,2),
  height_in numeric(8,2),
  depth_in numeric(8,2),
  notes text,
  annotation jsonb, -- {imageUrl, points, polygons}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.measurements (project_id);
create trigger trg_measurements_updated before update on public.measurements
  for each row execute function public.set_updated_at();

-- ---------- media uploads --------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  kind media_kind not null,
  category media_category not null default 'other',
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  duration_ms int,
  caption text,
  tags text[] default '{}',
  ai_labels jsonb, -- materials/colors/style classifications
  created_at timestamptz not null default now()
);
create index on public.media (project_id);
create index on public.media (category);

-- ---------- inspiration board ----------------------------------------
create table public.inspiration_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  source_url text,
  media_id uuid references public.media(id) on delete set null,
  style_tags text[] default '{}',
  color_palette text[] default '{}',
  material_tags text[] default '{}',
  notes text,
  created_at timestamptz not null default now()
);
create index on public.inspiration_items (project_id);

-- ---------- estimates / scope items ----------------------------------
create table public.estimates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  status estimate_status not null default 'draft',
  subtotal numeric(12,2) default 0,
  tax_rate numeric(5,4) default 0,
  total numeric(12,2) default 0,
  notes text,
  sent_at timestamptz,
  accepted_at timestamptz,
  pdf_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_estimates_updated before update on public.estimates
  for each row execute function public.set_updated_at();

create table public.scope_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates(id) on delete cascade,
  category text not null, -- 'cabinets','countertops','plumbing','appliances','flooring','labor','design','permits','other'
  description text not null,
  qty numeric(10,2) default 1,
  unit text default 'ea',
  unit_price numeric(12,2) default 0,
  is_optional boolean default false,
  position int default 0,
  total numeric(12,2) generated always as (qty * unit_price) stored,
  created_at timestamptz not null default now()
);
create index on public.scope_items (estimate_id);

-- ---------- notes / consultation logs / signatures -------------------
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  voice_media_id uuid references public.media(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on public.notes (project_id);

create table public.signatures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  estimate_id uuid references public.estimates(id) on delete cascade,
  signer_name text not null,
  signer_email text,
  signed_at timestamptz not null default now(),
  signature_svg text not null, -- inline SVG
  ip_address text,
  user_agent text
);

-- ---------- appointments ---------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  kind text default 'consultation', -- 'consultation','design','site_visit','final_walk'
  notes text,
  created_at timestamptz not null default now()
);
create index on public.appointments (starts_at);
create index on public.appointments (project_id);

-- ---------- activity log ---------------------------------------------
create table public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  client_id uuid references public.clients(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind activity_kind not null,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.activities (project_id);
create index on public.activities (created_at desc);

-- ---------- audit log (immutable) ------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  table_name text not null,
  row_id text,
  action text not null, -- insert/update/delete
  diff jsonb
);

-- ---------- materials catalog & vendors ------------------------------
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  contact_name text,
  contact_email text,
  contact_phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid references public.vendors(id) on delete set null,
  category text not null, -- cabinet,countertop,tile,appliance,flooring,fixture,paint,other
  sku text,
  name text not null,
  description text,
  unit text default 'ea',
  unit_cost numeric(12,2),
  image_url text,
  attributes jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.materials (category);

-- ---------- change orders & daily logs -------------------------------
create table public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  amount_delta numeric(12,2) default 0,
  schedule_delta_days int default 0,
  status text default 'pending', -- pending/approved/rejected
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  log_date date not null,
  weather text,
  crew_count int,
  hours numeric(6,2),
  work_completed text,
  blockers text,
  author_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, log_date)
);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles           enable row level security;
alter table public.clients            enable row level security;
alter table public.projects           enable row level security;
alter table public.rooms              enable row level security;
alter table public.question_sets      enable row level security;
alter table public.answers            enable row level security;
alter table public.measurements       enable row level security;
alter table public.media              enable row level security;
alter table public.inspiration_items  enable row level security;
alter table public.estimates          enable row level security;
alter table public.scope_items        enable row level security;
alter table public.notes              enable row level security;
alter table public.signatures         enable row level security;
alter table public.appointments       enable row level security;
alter table public.activities         enable row level security;
alter table public.audit_log          enable row level security;
alter table public.vendors            enable row level security;
alter table public.materials          enable row level security;
alter table public.change_orders      enable row level security;
alter table public.daily_logs         enable row level security;

-- Profiles: read your own; staff/admin read all; only admin writes role
create policy "profile_self_read" on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy "profile_self_update" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
create policy "profile_admin_all" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- Clients: staff sees all; clients see only their linked record
create policy "clients_staff_all" on public.clients for all
  using (public.is_staff()) with check (public.is_staff());
create policy "clients_self_read" on public.clients for select
  using (profile_id = auth.uid());

-- Projects: staff full; client read-only on linked projects
create policy "projects_staff_all" on public.projects for all
  using (public.is_staff()) with check (public.is_staff());
create policy "projects_client_read" on public.projects for select
  using (exists (
    select 1 from public.clients c
    where c.id = projects.client_id and c.profile_id = auth.uid()
  ));

-- Helper: project-scoped read predicate for child tables
create or replace function public.can_read_project(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists(
    select 1 from public.projects pr
    join public.clients c on c.id = pr.client_id
    where pr.id = p_id and c.profile_id = auth.uid()
  );
$$;
create or replace function public.can_write_project(p_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff();
$$;

-- Generic project-child policies
do $$
declare t text;
begin
  for t in select unnest(array[
    'rooms','answers','measurements','media','inspiration_items',
    'estimates','notes','signatures','appointments','activities','change_orders','daily_logs'
  ]) loop
    execute format($f$
      create policy "%1$s_read" on public.%1$s for select
        using (public.can_read_project(project_id));
      create policy "%1$s_write" on public.%1$s for all
        using (public.can_write_project(project_id))
        with check (public.can_write_project(project_id));
    $f$, t);
  end loop;
end $$;

-- scope_items: derive project via estimate
create policy "scope_items_read" on public.scope_items for select using (
  exists(select 1 from public.estimates e where e.id = scope_items.estimate_id and public.can_read_project(e.project_id))
);
create policy "scope_items_write" on public.scope_items for all using (
  exists(select 1 from public.estimates e where e.id = scope_items.estimate_id and public.can_write_project(e.project_id))
) with check (
  exists(select 1 from public.estimates e where e.id = scope_items.estimate_id and public.can_write_project(e.project_id))
);

-- Question sets: read by anyone authenticated; write by admin
create policy "question_sets_read" on public.question_sets for select using (auth.uid() is not null);
create policy "question_sets_admin" on public.question_sets for all using (public.is_admin()) with check (public.is_admin());

-- Vendors / materials: staff read+write
create policy "vendors_staff" on public.vendors for all using (public.is_staff()) with check (public.is_staff());
create policy "materials_staff" on public.materials for all using (public.is_staff()) with check (public.is_staff());

-- Audit log: admin only
create policy "audit_admin" on public.audit_log for select using (public.is_admin());

-- =====================================================================
-- Storage buckets
-- =====================================================================
insert into storage.buckets (id, name, public) values
  ('project-media','project-media', false),
  ('estimates','estimates', false),
  ('avatars','avatars', true)
on conflict (id) do nothing;

-- Storage RLS
create policy "media_read" on storage.objects for select using (
  bucket_id = 'project-media' and (
    public.is_staff() or exists(
      select 1 from public.media m
      join public.projects pr on pr.id = m.project_id
      join public.clients c on c.id = pr.client_id
      where m.storage_path = name and c.profile_id = auth.uid()
    )
  )
);
create policy "media_write" on storage.objects for insert with check (
  bucket_id = 'project-media' and public.is_staff()
);
create policy "media_update" on storage.objects for update using (
  bucket_id = 'project-media' and public.is_staff()
);
create policy "media_delete" on storage.objects for delete using (
  bucket_id = 'project-media' and public.is_staff()
);

create policy "estimates_read" on storage.objects for select using (
  bucket_id = 'estimates' and public.is_staff()
);
create policy "estimates_write" on storage.objects for insert with check (
  bucket_id = 'estimates' and public.is_staff()
);

create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars_self_write" on storage.objects for insert with check (
  bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
