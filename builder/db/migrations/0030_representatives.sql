-- Representatives: people who bring OUAQT to shops, each with a code of
-- their own on a QR code, and a bonus on what the shops they brought pay.
--
-- The code travels in the link (?ref=CODE). The site keeps it in a cookie
-- for 30 days; when that browser is given its serial the draft is credited
-- to the representative, and the shop made from the draft carries it on.
-- Staff can also credit a shop by hand. A representative is deactivated,
-- never deleted, so what they earned stays readable.

create table if not exists representatives (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null check (length(name) between 1 and 80),
  phone              text check (phone is null or length(phone) <= 30),
  -- Six letters and digits, without 0, O, 1 or I: read aloud or typed, never misread.
  code               text not null unique check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  -- The bonus: a share of what their shops pay, and an amount per shop that pays.
  commission_percent numeric(5, 2) not null default 0 check (commission_percent between 0 and 100),
  bonus_per_client   bigint not null default 0 check (bonus_per_client >= 0),
  active             boolean not null default true,
  note               text check (note is null or length(note) <= 500),
  created_by         uuid references auth.users (id) on delete set null,
  created_at         timestamptz not null default now()
);
alter table representatives enable row level security;
-- No policy: only the service role reads or writes these.

-- What has been handed to a representative, so what is still owed is earned minus paid.
create table if not exists representative_payouts (
  id                uuid primary key default gen_random_uuid(),
  representative_id uuid not null references representatives (id) on delete cascade,
  amount            bigint not null check (amount > 0),
  note              text check (note is null or length(note) <= 200),
  paid_at           timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null
);
alter table representative_payouts enable row level security;

alter table builder_drafts add column if not exists representative_id uuid references representatives (id) on delete set null;
alter table businesses add column if not exists representative_id uuid references representatives (id) on delete set null;
-- The code a visit arrived with, kept as text: a visit with an unknown code still counts as a visit.
alter table site_events add column if not exists rep_code text check (rep_code is null or rep_code ~ '^[A-HJ-NP-Z2-9]{6}$');

create index if not exists builder_drafts_representative_idx on builder_drafts (representative_id) where representative_id is not null;
create index if not exists businesses_representative_idx on businesses (representative_id) where representative_id is not null;
create index if not exists site_events_rep_code_idx on site_events (rep_code, created_at desc) where rep_code is not null;
create index if not exists representative_payouts_rep_idx on representative_payouts (representative_id);

-- Who brought a draft is the server's to say. A browser that sends its own
-- representative_id gets it ignored, like every other server column (0019).
create or replace function builder_drafts_server_columns() returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.code := null;
      new.serial_hash := null;
      new.serial_cipher := null;
      new.phone := null;
      new.created_at := now();
      new.last_accessed_at := null;
      new.status := 'active';
      new.logo_path := null;
      new.logo_mono_path := null;
      new.made_in_test_mode := false;
      new.representative_id := null;
    else
      new.code := old.code;
      new.serial_hash := old.serial_hash;
      new.serial_cipher := old.serial_cipher;
      new.phone := old.phone;
      new.created_at := old.created_at;
      new.last_accessed_at := old.last_accessed_at;
      new.status := old.status;
      new.logo_path := old.logo_path;
      new.logo_mono_path := old.logo_mono_path;
      new.made_in_test_mode := old.made_in_test_mode;
      new.representative_id := old.representative_id;
    end if;
  end if;
  return new;
end;
$$;
