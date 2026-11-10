-- OUAQT's own test devices.
--
-- Decided 2026-11-10. Adel tries the software on his Mac and his iPhone as it
-- is built, installing shop after shop of the same trade. The trial rules
-- (0012, 0039) are right to refuse that from anybody else, and wrong to
-- refuse it from him. A device on this list:
--
--   * gets its free trial in every shop it installs, whatever it installed
--     before, and the claim it writes keeps no marks (no fingerprint, no
--     phone number), so a test never refuses a customer's trial later;
--   * takes none of a shop's device places;
--   * keeps a shop's trial running when the shop is rebuilt as another trade;
--   * is not refused for having run a shop staff banned (the shop itself
--     stays banned).
--
-- A device is known in one of two ways.
--
-- A computer by its marks, the way activation knows any machine: the salted
-- fingerprint the app sends (two of three parts agreeing) or its device id.
--
-- An iPhone has no lasting marks: each shop put on its home screen is a new
-- app with a new random number. So it carries a pass instead. Staff show a QR
-- code in the admin area (a one-time code, valid minutes); the iPhone scans
-- it in Safari, which keeps the pass in a cookie, and every shop added to the
-- home screen afterwards gets a copy of Safari's cookies (iOS 17.2 and
-- later), so its activation brings the pass along. Each install recognised
-- that way is written down as its own row (via), so the trade and device
-- place rules that read a shop's stored devices know it too, and removing the
-- iPhone removes them with it.
--
-- Only hashes are kept: of the fingerprint parts, of the pass, of the code.
-- Staff add and remove devices in the admin area; removing keeps the row,
-- dated.

create table if not exists tester_devices (
  id                  uuid primary key default gen_random_uuid(),
  label               text not null default '',
  device_id           text,
  fingerprint_board   text,
  fingerprint_disk    text,
  fingerprint_machine text,
  -- A phone's pass, and the one-time code that hands it over.
  pass_hash           text unique,
  enrol_hash          text unique,
  enrol_until         timestamptz,
  -- The pass an install was recognised through.
  via                 uuid references tester_devices (id) on delete cascade,
  added_by            uuid references auth.users (id),
  added_at            timestamptz not null default now(),
  removed_at          timestamptz,
  constraint tester_devices_known check (
    device_id is not null
    or fingerprint_board is not null
    or fingerprint_disk is not null
    or fingerprint_machine is not null
    or pass_hash is not null
    or enrol_hash is not null
  )
);
alter table tester_devices enable row level security;
-- No policy at all: only the service role reads or writes this.
create index if not exists tester_devices_added_by_idx on tester_devices (added_by);
create index if not exists tester_devices_via_idx on tester_devices (via);
