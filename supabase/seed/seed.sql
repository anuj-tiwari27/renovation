-- Seed data for development.
-- Run AFTER 0001_init.sql.
-- Assumes you've created at least one auth user via Supabase dashboard.

-- ---------- Promote a user to admin ---------------------------------
-- Replace this email before running.
-- update public.profiles set role = 'admin' where email = 'you@example.com';

-- ---------- Vendors --------------------------------------------------
insert into public.vendors (name, category, contact_name, contact_email) values
  ('Crystal Cabinetry', 'cabinet', 'Sales', 'sales@crystalcabinets.com'),
  ('Caesarstone', 'countertop', 'Wholesale', 'wholesale@caesarstone.com'),
  ('Sub-Zero / Wolf', 'appliance', 'Pro Channel', 'pro@subzero-wolf.com'),
  ('Daltile', 'tile', null, null),
  ('Kohler', 'fixture', null, null)
on conflict do nothing;

-- ---------- Materials ----------------------------------------------
insert into public.materials (category, name, unit, unit_cost, attributes) values
  ('countertop','Quartz — Calacatta Nuvo','sqft', 95.00,'{"finish":"polished","thickness_cm":3}'),
  ('countertop','Quartzite — Taj Mahal','sqft', 140.00,'{"finish":"leathered","thickness_cm":3}'),
  ('cabinet','Shaker — Inset, Painted','lf', 750.00,'{"door":"shaker","construction":"inset","finish":"painted"}'),
  ('cabinet','Slab — Walnut Veneer','lf', 980.00,'{"door":"slab","wood":"walnut"}'),
  ('appliance','36" Induction Range','ea', 4800.00,'{"brand":"Wolf","fuel":"induction"}'),
  ('flooring','7" White Oak Engineered','sqft', 14.00,'{"species":"white_oak","width_in":7}')
on conflict do nothing;

-- ---------- Question sets (form schema) ------------------------------
-- See src/lib/intake/schemas.ts for the canonical schema. We mirror only
-- the slug/version metadata here so admins can disable a set per project type.

insert into public.question_sets (slug, name, description, applies_to, schema, version) values
  ('client_info_v1','Client information','Homeowner contact + decision context', '{kitchen,bathroom,full_home,multi_room,commercial}'::project_type[], '{"sections":[]}'::jsonb, 1),
  ('project_overview_v1','Project overview','Goals, motivations, priorities', '{kitchen,bathroom,full_home,multi_room,commercial}'::project_type[], '{"sections":[]}'::jsonb, 1),
  ('kitchen_v1','Kitchen remodel discovery','Detailed kitchen requirements', '{kitchen,multi_room,full_home}'::project_type[], '{"sections":[]}'::jsonb, 1),
  ('bathroom_v1','Bathroom remodel discovery','Detailed bathroom requirements', '{bathroom,multi_room,full_home}'::project_type[], '{"sections":[]}'::jsonb, 1),
  ('full_home_v1','Full-home remodel discovery','Whole-home program & systems', '{full_home}'::project_type[], '{"sections":[]}'::jsonb, 1),
  ('budget_v1','Budget & financing','Range, splurge/save, phasing', '{kitchen,bathroom,full_home,multi_room,commercial}'::project_type[], '{"sections":[]}'::jsonb, 1),
  ('timeline_v1','Timeline & logistics','Deadlines, relocation, HOA, permits', '{kitchen,bathroom,full_home,multi_room,commercial}'::project_type[], '{"sections":[]}'::jsonb, 1)
on conflict (slug) do nothing;

-- ---------- Demo client + project (only if a staff profile exists) ---
do $$
declare staff_id uuid;
declare cli_id uuid;
declare prj_id uuid;
begin
  select id into staff_id from public.profiles
    where role in ('admin','sales') and is_active limit 1;
  if staff_id is null then return; end if;

  insert into public.clients (
    full_name,email,phone,address_street,address_city,address_state,address_zip,
    preferred_comm,primary_residence,years_in_home,remodeled_before,owner_id
  ) values (
    'Avery & Sam Patel','avery.patel@example.com','555-0142',
    '124 Linden Ave','Palo Alto','CA','94301',
    'email', true, 9, true, staff_id
  ) returning id into cli_id;

  insert into public.projects (
    client_id,title,type,status,rooms,desired_completion,motivation,top_priorities,
    luxury_level,budget_flexibility,timeline_urgency,design_boldness,
    budget_min,budget_ideal,budget_max,consultant_id,created_by,expected_value
  ) values (
    cli_id,'Patel — Kitchen + Primary Bath','multi_room','consultation_scheduled',
    array['kitchen','primary_bath'], (now() + interval '5 months')::date,
    'Open up the kitchen to family room; spa-like primary bath',
    'Storage, workflow, spa feel, durable finishes',
    72, 60, 55, 65,
    180000, 240000, 320000, staff_id, staff_id, 240000
  ) returning id into prj_id;

  insert into public.activities (project_id,client_id,actor_id,kind,payload)
  values (prj_id,cli_id,staff_id,'created','{}'::jsonb);
end $$;
