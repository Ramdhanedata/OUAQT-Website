-- 0037: the owner's rows checked once per query, and an index under every
-- foreign key.
--
-- Found by the database's own advisor on 2026-11-06. Each policy below asked
-- for the signed-in user again for every row it looked at; written as
-- (select auth.uid()) it is asked once per query. What each policy lets an
-- owner see is unchanged, word for word otherwise.
--
-- The indexes are the ones the advisor listed: every column that points at
-- another table. The shop's own (business_id) are the ones read on every
-- licence check and every payment; the rest are who did what in the admin
-- area, read rarely, indexed so that removing a person never scans a table.

alter policy drafts_own on builder_drafts
  using (session_owner = (select auth.uid()))
  with check (session_owner = (select auth.uid()));

alter policy businesses_read_own on businesses
  using (owner_id = (select auth.uid()));

alter policy configurations_own on configurations
  using (exists (select 1 from businesses b where b.id = configurations.business_id and b.owner_id = (select auth.uid())));

alter policy device_releases_own on device_releases
  using (exists (select 1 from businesses b where b.id = device_releases.business_id and b.owner_id = (select auth.uid())));

alter policy devices_own on devices
  using (exists (select 1 from businesses b where b.id = devices.business_id and b.owner_id = (select auth.uid())));

alter policy feature_requests_own on feature_requests
  using (business_id is not null and exists (select 1 from businesses b where b.id = feature_requests.business_id and b.owner_id = (select auth.uid())));

alter policy licences_own on licences
  using (exists (select 1 from businesses b where b.id = licences.business_id and b.owner_id = (select auth.uid())));

alter policy logos_read_own on logos
  using (exists (select 1 from businesses b where b.id = logos.business_id and b.owner_id = (select auth.uid())));

alter policy payments_own on payments
  using (exists (select 1 from businesses b where b.id = payments.business_id and b.owner_id = (select auth.uid())));

alter policy products_initial_read_own on products_initial
  using (exists (select 1 from businesses b where b.id = products_initial.business_id and b.owner_id = (select auth.uid())));

alter policy serials_own on serials
  using (exists (select 1 from businesses b where b.id = serials.business_id and b.owner_id = (select auth.uid())));

alter policy staff_initial_read_own on staff_initial
  using (exists (select 1 from businesses b where b.id = staff_initial.business_id and b.owner_id = (select auth.uid())));

-- The shop's own: read on every licence check, payment and setup.
create index if not exists licences_business_idx on licences (business_id, created_at desc);
create index if not exists payments_business_idx on payments (business_id, created_at desc);
create index if not exists builder_drafts_business_idx on builder_drafts (business_id);
create index if not exists builder_drafts_session_owner_idx on builder_drafts (session_owner);
create index if not exists device_releases_business_idx on device_releases (business_id);
create index if not exists feature_requests_business_idx on feature_requests (business_id);
create index if not exists products_initial_business_idx on products_initial (business_id);
create index if not exists staff_initial_business_idx on staff_initial (business_id);
create index if not exists configuration_code_requests_draft_idx on configuration_code_requests (draft_id);
create index if not exists renewal_codes_licence_idx on renewal_codes (licence_id);

-- Who did what in the admin area.
create index if not exists audit_events_actor_idx on audit_events (actor_id);
create index if not exists configuration_code_requests_handled_by_idx on configuration_code_requests (handled_by);
create index if not exists device_releases_released_by_idx on device_releases (released_by);
create index if not exists payments_reviewer_idx on payments (reviewer_id);
create index if not exists renewal_codes_generated_by_idx on renewal_codes (generated_by);
create index if not exists representative_payouts_created_by_idx on representative_payouts (created_by);
create index if not exists representatives_created_by_idx on representatives (created_by);
create index if not exists settings_updated_by_idx on settings (updated_by);
create index if not exists trial_claims_granted_by_idx on trial_claims (granted_by);
create index if not exists trial_overrides_created_by_idx on trial_overrides (created_by);
