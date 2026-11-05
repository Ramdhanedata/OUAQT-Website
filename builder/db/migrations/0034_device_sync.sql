-- A shop's devices seeing each other's work.
--
-- Decided 2026-11-05 by Adel: a sale on the computer appears on the phone, and
-- the other way round. Each device still keeps every record itself and works
-- with no internet. This table is only the post box between them: sealed
-- messages, unreadable as they stand, deleted once delivered, and never kept
-- for long. The only columns are who may fetch a message and who sent it.
--
-- Read and written by the server alone (no policy lets anybody else in).

create table sync_messages (
  id          bigint generated always as identity primary key,
  business_id uuid not null references businesses (id) on delete cascade,
  from_device text not null,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index sync_messages_box_idx on sync_messages (business_id, id);
create index sync_messages_age_idx on sync_messages (created_at);
alter table sync_messages enable row level security;

-- Where each device has read up to, so what all have read can go.
alter table devices add column if not exists sync_cursor bigint not null default 0;
alter table devices add column if not exists sync_seen_at timestamptz;
