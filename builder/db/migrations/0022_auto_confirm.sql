-- A payment that checks out is confirmed at once, and a person looks after.
--
-- Decided 2026-09-25: when the screenshot is read and everything on it
-- matches (a transfer, at least the price, a date inside the window, a
-- transaction number not used before, and our number as the recipient), the
-- licence opens straight away and the owner's software opens with it. Such a
-- payment still reaches the admin area, under "confirmed automatically", to
-- be checked by eye and undone if the screenshot was not what it seemed.
--
-- On the free AI tier nothing is read, so nothing is confirmed alone: a
-- person confirms, and the software opens as soon as they do.

alter table payments
  add column if not exists auto_confirmed boolean not null default false,
  -- The licence as it was before, so an automatic confirmation can be undone
  -- exactly: { id, existed, plan, status, starts_at, ends_at }.
  add column if not exists licence_before jsonb,
  -- When a person looked at an automatic confirmation and kept it.
  add column if not exists reviewed_at timestamptz;

create index if not exists payments_to_review_idx
  on payments (created_at) where auto_confirmed and reviewed_at is null;

-- The switch, in case screenshots that are not what they seem start to
-- arrive: false sends every payment to a person again.
insert into settings (key, value, description) values
  ('payment_auto_confirm', 'true', 'Confirm at once a payment whose screenshot was read and matches. False sends every payment to a person')
on conflict (key) do nothing;
