-- A phone as one of a shop's devices.
--
-- Decided 2026-11-03. The shop's software also runs on an Android phone or
-- an iPhone, installed from the website into the phone's browser (/app),
-- with no store app. It activates with the shop's serial like a second
-- computer and counts against the same device limit. Its fingerprint has
-- only the "machine" part, a random id the phone keeps, hashed the way a
-- computer's parts are; board and disk are null.

alter table devices drop constraint if exists devices_platform_check;
alter table devices add constraint devices_platform_check
  check (platform in ('windows', 'mac', 'phone'));
