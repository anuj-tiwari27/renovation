-- Adds editable-estimate fields. Safe to re-run.

alter table public.estimates
  add column if not exists discount_percent numeric(5,2) default 0,
  add column if not exists terms text,
  add column if not exists bill_to_name text,
  add column if not exists bill_to_email text,
  add column if not exists bill_to_phone text,
  add column if not exists bill_to_address text;

-- Make the total column recompute through subtotal/tax/discount via app code;
-- keep scope_items.total generated.
