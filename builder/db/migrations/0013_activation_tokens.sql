-- One click instead of a serial, for an owner who built on the shop PC.
--
-- Decided 2026-09-22. An owner who built his software on the computer he is
-- about to install it on must never type his serial into it. Step 4 makes one
-- of these, the page opens the installed app through ouaqt://activate, and the
-- app spends it in place of a serial.
--
-- Stored hashed and never in the clear. One device, once, one business, and
-- a lifetime set here rather than in code. The serial remains the licence for
-- everybody: this only saves one owner from copying a code between windows.

create table activation_tokens (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references businesses (id) on delete cascade,
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  -- Set the moment an activation takes it, cleared again if that activation
  -- fails, so a refused attempt does not leave the owner with a dead link.
  used_at      timestamptz,
  used_device  text,
  created_at   timestamptz not null default now()
);
alter table activation_tokens enable row level security;
-- No policy: only the service role reads or writes these.
create index activation_tokens_business_idx on activation_tokens (business_id)
  where used_at is null;

insert into settings (key, value, description) values
  ('activation_token_hours', '24', 'How long the one-click activation link at step 4 stays good')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description,
      updated_at = now();
