-- Which version of the software each device runs.
--
-- Decided 2026-11-11. A Mac never updates itself (the app is not signed), so
-- a shop can run an old build for months and nobody on our side sees it. The
-- app now sends its version number with each activation and each licence
-- check, and it is kept here, on the device's row, so the admin area can show
-- which devices are behind the published release.
--
-- A version number only ("0.1.77"), checked by the routes before it is
-- stored. Null for a device whose app is older than this, which sends none.

alter table devices add column if not exists app_version text;
