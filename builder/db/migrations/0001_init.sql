-- OUAQT builder: initial schema.
--
-- Rule that shapes this file: the server holds what the builder and licensing
-- need, and nothing about the owner's trade. No sales, no stock movements, no
-- customer credit, no cash close, no backups. Those live only on the owner's
-- own computers. builder/db/no-business-data.test.ts enforces it.
--
-- Every table has row level security on. Owners reach their own rows only.
-- Staff reach everything through server code with the service role, never
-- from a browser.

create extension if not exists pgcrypto;

-- ─── Settings ──────────────────────────────────────────────────────────────
-- Prices, the trial length, device limits: everything that changes without a
-- deploy. Read through one typed function, edited from the admin area.
create table settings (
  key         text primary key,
  value       jsonb not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id)
);
alter table settings enable row level security;
-- Read-only to anyone signed in: the builder needs prices and limits.
create policy settings_read on settings for select using (auth.role() = 'authenticated');

-- ─── Businesses and the builder ────────────────────────────────────────────
create table businesses (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users (id) on delete cascade,
  name_latin      text not null,
  name_arabic     text,
  pack            text not null,
  app_language    text not null default 'fr',
  receipt_phone   text,
  receipt_address text,
  created_at      timestamptz not null default now()
);
alter table businesses enable row level security;
create policy businesses_own on businesses for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index businesses_owner_idx on businesses (owner_id);

-- Answers in progress. Written before an account exists, under the anonymous
-- session, then claimed by the account created at step 4.
create table builder_drafts (
  id            uuid primary key default gen_random_uuid(),
  session_owner uuid not null references auth.users (id) on delete cascade,
  business_id   uuid references businesses (id) on delete cascade,
  pack          text,
  locale        text not null default 'fr',
  step          smallint not null default 0,
  answers       jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now()
);
alter table builder_drafts enable row level security;
create policy drafts_own on builder_drafts for all
  using (session_owner = auth.uid()) with check (session_owner = auth.uid());

-- The configuration the desktop app runs on. Versioned: editing answers later
-- writes a new row rather than overwriting what a running shop uses.
create table configurations (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses (id) on delete cascade,
  version        integer not null,
  schema_version text not null,
  config         jsonb not null,
  created_by     text not null default 'builder',
  created_at     timestamptz not null default now(),
  unique (business_id, version)
);
alter table configurations enable row level security;
create policy configurations_own on configurations for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

-- The starting product list and staff names from step 3. These are a setup
-- list, not trade records: no quantities sold, no movements, no balances.
create table products_initial (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  row_number  integer not null,
  data        jsonb not null,
  created_at  timestamptz not null default now()
);
alter table products_initial enable row level security;
create policy products_initial_own on products_initial for all
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create table staff_initial (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name        text not null,
  role        text not null check (role in ('manager', 'cashier')),
  created_at  timestamptz not null default now()
);
alter table staff_initial enable row level security;
create policy staff_initial_own on staff_initial for all
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create table logos (
  business_id   uuid primary key references businesses (id) on delete cascade,
  colour_path   text not null,
  mono_path     text not null,
  created_at    timestamptz not null default now()
);
alter table logos enable row level security;
create policy logos_own on logos for all
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()))
  with check (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

-- ─── Serials, licences, devices ────────────────────────────────────────────
-- The serial is stored twice: hashed so activation can look it up without
-- holding the secret, and encrypted so the owner can be shown his own.
create table serials (
  business_id  uuid primary key references businesses (id) on delete cascade,
  serial_hash  text not null unique,
  serial_cipher text not null,
  created_at   timestamptz not null default now()
);
alter table serials enable row level security;
create policy serials_own on serials for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create table licences (
  id             uuid primary key default gen_random_uuid(),
  business_id    uuid not null references businesses (id) on delete cascade,
  plan           text not null check (plan in ('trial', 'annual', 'perpetual', 'extra_device')),
  status         text not null check (status in ('trial', 'active', 'expired_trial', 'renewal_due', 'expired', 'suspended')),
  starts_at      timestamptz,
  ends_at        timestamptz,
  updates_until  timestamptz,
  renewal_secret text not null,
  created_at     timestamptz not null default now()
);
alter table licences enable row level security;
create policy licences_own on licences for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create table devices (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  device_id   text not null,
  name        text,
  platform    text check (platform in ('windows', 'mac')),
  role        text not null check (role in ('main', 'secondary')),
  status      text not null default 'active' check (status in ('active', 'released')),
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  unique (business_id, device_id)
);
alter table devices enable row level security;
create policy devices_own on devices for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create table device_releases (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  device_id   text not null,
  released_by uuid references auth.users (id),
  released_at timestamptz not null default now()
);
alter table device_releases enable row level security;
create policy device_releases_own on device_releases for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

-- ─── Payments ──────────────────────────────────────────────────────────────
create table payments (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references businesses (id) on delete cascade,
  plan            text not null,
  expected_amount numeric(12, 2) not null,
  screenshot_path text not null,
  image_hash      text not null unique,
  extracted       jsonb,
  reference       text unique,
  status          text not null default 'submitted'
    check (status in ('submitted', 'rejected_auto', 'pending_confirmation', 'confirmed', 'rejected_manual')),
  reviewer_id     uuid references auth.users (id),
  reason          text,
  created_at      timestamptz not null default now()
);
alter table payments enable row level security;
create policy payments_own on payments for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));
create policy payments_insert_own on payments for insert
  with check (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create table renewal_codes (
  id           uuid primary key default gen_random_uuid(),
  licence_id   uuid not null references licences (id) on delete cascade,
  device_code  text not null,
  new_ends_at  timestamptz not null,
  generated_by uuid references auth.users (id),
  created_at   timestamptz not null default now()
);
alter table renewal_codes enable row level security;

-- ─── Requests, leads, measurement ──────────────────────────────────────────
create table feature_requests (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid references businesses (id) on delete set null,
  phone       text,
  pack        text,
  question_id text,
  text        text not null,
  status      text not null default 'new' check (status in ('new', 'reading', 'planned', 'declined', 'done')),
  created_at  timestamptz not null default now()
);
alter table feature_requests enable row level security;
create policy feature_requests_own on feature_requests for select
  using (business_id is not null
         and exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

create table leads_other_business (
  id            uuid primary key default gen_random_uuid(),
  business_type text not null,
  phone         text not null,
  created_at    timestamptz not null default now()
);
alter table leads_other_business enable row level security;

-- Which step owners reach, and where they stop. No personal detail.
create table builder_events (
  id           bigserial primary key,
  session_hash text not null,
  pack         text,
  step         smallint,
  event        text not null,
  device_class text check (device_class in ('phone', 'desktop')),
  created_at   timestamptz not null default now()
);
alter table builder_events enable row level security;

create table ai_calls (
  id          bigserial primary key,
  purpose     text not null,
  tokens_in   integer not null default 0,
  tokens_out  integer not null default 0,
  outcome     text not null,
  latency_ms  integer,
  created_at  timestamptz not null default now()
);
alter table ai_calls enable row level security;

-- ─── Staff and the trail ───────────────────────────────────────────────────
create table admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text,
  created_at timestamptz not null default now()
);
alter table admin_users enable row level security;

create table audit_events (
  id         bigserial primary key,
  actor_id   uuid references auth.users (id),
  subject    text not null,
  subject_id text,
  action     text not null,
  detail     jsonb,
  created_at timestamptz not null default now()
);
alter table audit_events enable row level security;
