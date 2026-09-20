-- A computer has to be able to prove it is itself.
--
-- Activation is authorised by the serial, which the owner types once. After
-- that the app refreshes its licence on its own, and a business id plus a
-- device id would be enough for anyone who had seen either. So activation
-- hands back a token, kept here only as a hash, and refresh presents it.
--
-- Releasing a device clears the token: the computer that was freed cannot go
-- on refreshing a licence it no longer holds.
alter table devices
  add column if not exists token_hash text;

create index if not exists devices_token_idx on devices (token_hash);

-- Which device a trial has already been used on, so the same machine cannot
-- start a second fourteen days under a new account.
create index if not exists devices_device_id_idx on devices (device_id);
