-- Which machine each device id was activated on.
--
-- Decided 2026-09-26, from the launch audit. A device is the id the app keeps
-- in the shop's own database, so a data folder copied onto another computer
-- carried a working device with it, and a two-computer licence could run on
-- as many as the folder was copied to. The machine's three hashed parts (the
-- same the trial rule reads) are now kept with the device and signed into
-- the licence. The app compares them with the computer it is on, and a copy
-- on another computer asks to be activated there, which counts as moving
-- the device, against the year's device releases.

alter table devices add column if not exists fingerprint jsonb;
