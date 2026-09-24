-- What an owner pays, and where his proof of payment lives.

-- ─── Launch clients ────────────────────────────────────────────────────────
-- The launch price is for the first launch_clients_limit businesses, and it
-- is frozen for launch_price_freeze_years. Which side of that line a business
-- falls on is decided once, when it is created, and kept: working it out
-- again later from a count would move an owner's price under him as other
-- people sign up.
alter table businesses
  add column if not exists launch_client boolean not null default false,
  add column if not exists price_frozen_until timestamptz;

-- ─── Screenshots ───────────────────────────────────────────────────────────
-- A private bucket. A transfer receipt has a name and an amount on it, and
-- belongs to the owner who sent it and to whoever confirms it, nobody else.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payments', 'payments', false, 5000000, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- He may put his own receipt in his own folder and look at it again.
create policy payments_write_own on storage.objects for insert
  with check (bucket_id = 'payments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy payments_read_own on storage.objects for select
  using (bucket_id = 'payments' and (storage.foldername(name))[1] = auth.uid()::text);

-- Deliberately no update and no delete. A receipt that has been submitted is
-- evidence in a disagreement about money, and it stays as it arrived. Staff
-- reach every receipt through server code with the service role.

-- ─── The trail ─────────────────────────────────────────────────────────────
-- Every status change on a payment writes one of these. Nobody may read them
-- from a browser, owner or staff: they are read in server code only.
create index if not exists audit_events_subject_idx
  on audit_events (subject, subject_id, created_at desc);

create index if not exists payments_status_idx
  on payments (status, created_at desc);
