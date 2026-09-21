-- One free trial per shop, and a kind way to be wrong about it.
--
-- Decided 2026-09-21. A trial is claimed once. The claim records the marks
-- that identify it: a machine fingerprint the app sends as salted hashes, the
-- owner's login phone, and the business itself. A second trial that matches
-- any of them is refused, with an apology and a WhatsApp button, never an
-- accusation.
--
-- The fingerprint arrives in three parts, never as raw serial numbers. Two
-- parts agreeing is enough to call it the same machine, so a repaired PC with
-- a new disk is still recognised and a genuinely different PC is not.
--
-- Softer signals (the same logo, the same product list, a shop name or
-- address that looks like an earlier one) never refuse anything. They are
-- written down and shown in the admin area, because a person should decide.
--
-- Anyone we refuse wrongly, and there will be some, is given a trial by hand
-- from the admin area. That is an override row and an audit event.

create table trial_claims (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses (id) on delete cascade,
  -- Salted hashes. The app never sends the values these were made from.
  fingerprint_board   text,
  fingerprint_disk    text,
  fingerprint_machine text,
  phone           text,
  -- For the softer signals, all computed here and never sent to us by the app.
  logo_hash       text,
  products_hash   text,
  name            text not null default '',
  address         text,
  -- Reason codes from builder/licence/trial.ts. Empty means nothing noticed.
  signals         jsonb not null default '[]'::jsonb,
  granted_by      uuid references auth.users (id),  -- set when given by hand
  created_at      timestamptz not null default now()
);
alter table trial_claims enable row level security;
-- No policy at all: only the service role reads or writes this.
create index trial_claims_business_idx on trial_claims (business_id);
create index trial_claims_phone_idx on trial_claims (phone);
create index trial_claims_board_idx on trial_claims (fingerprint_board);
create index trial_claims_disk_idx on trial_claims (fingerprint_disk);
create index trial_claims_machine_idx on trial_claims (fingerprint_machine);

-- A trial granted by hand to someone the rules refused. Consumed once.
create table trial_overrides (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  reason      text not null,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  used_at     timestamptz
);
alter table trial_overrides enable row level security;
create index trial_overrides_business_idx on trial_overrides (business_id)
  where used_at is null;

insert into settings (key, value, description) values
  ('trial_one_per_fingerprint',        'true', 'Refuse a second trial on a machine that already had one'),
  ('trial_one_per_phone',              'true', 'Refuse a second trial on a phone number that already had one'),
  ('trial_require_fingerprint',        'true', 'Refuse a trial when the app sends no machine fingerprint'),
  ('trial_fingerprint_parts_to_match', '2',    'How many of the three fingerprint parts must agree to call it the same machine'),
  ('trial_similarity_percent',         '80',   'How alike two shop names or addresses must look before the admin area flags a repeat')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();
