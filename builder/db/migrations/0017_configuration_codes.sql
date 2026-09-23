-- The code de configuration: a short pointer from a phone's finished
-- questions to the same configuration on a computer.
--
-- The configuration itself stays where it already lives, in builder_drafts.
-- The code, the phone it can be sent again to, when it was made and last
-- opened, and whether it has expired are added to the same row. An expired
-- code is marked, never deleted, so it can be revived for someone who calls.
--
-- These columns are written by the server only. A browser can still save its
-- own answers into its own draft, as before, but not give itself a code, a
-- status or a date: the trigger below keeps what was there.

alter table builder_drafts
  add column if not exists code text unique,
  add column if not exists phone text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists last_accessed_at timestamptz,
  add column if not exists status text not null default 'active' check (status in ('active', 'expired')),
  add column if not exists logo_path text,
  add column if not exists logo_mono_path text;

create index if not exists builder_drafts_phone_idx on builder_drafts (phone) where code is not null;

create or replace function builder_drafts_server_columns() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.code := null;
      new.phone := null;
      new.created_at := now();
      new.last_accessed_at := null;
      new.status := 'active';
      new.logo_path := null;
      new.logo_mono_path := null;
    else
      new.code := old.code;
      new.phone := old.phone;
      new.created_at := old.created_at;
      new.last_accessed_at := old.last_accessed_at;
      new.status := old.status;
      new.logo_path := old.logo_path;
      new.logo_mono_path := old.logo_mono_path;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists builder_drafts_server_columns on builder_drafts;
create trigger builder_drafts_server_columns
  before insert or update on builder_drafts
  for each row execute function builder_drafts_server_columns();

-- Wrong entries, per session and per address, so the input can slow down
-- after five. Keys are hashes; nothing here says who tried.
create table if not exists configuration_code_attempts (
  key              text primary key,
  failures         integer not null default 0,
  last_failure_at  timestamptz,
  locked_until     timestamptz
);
alter table configuration_code_attempts enable row level security;

-- "Vous avez perdu votre code ?", until the WhatsApp send is connected: the
-- request lands here, the admin area shows it, and staff send the code by
-- hand. Once the send works, sent is true and nobody has to.
create table if not exists configuration_code_requests (
  id          uuid primary key default gen_random_uuid(),
  draft_id    uuid references builder_drafts (id) on delete cascade,
  phone       text not null,
  sent        boolean not null default false,
  created_at  timestamptz not null default now(),
  handled_at  timestamptz,
  handled_by  uuid references auth.users (id)
);
alter table configuration_code_requests enable row level security;
create index if not exists configuration_code_requests_open_idx on configuration_code_requests (created_at) where handled_at is null;
