-- Owners read their own rows from a browser; only the server writes them.
--
-- Decided 2026-09-26, from the launch audit. 0001 let a signed-in owner
-- insert, change and delete his own business, initial products, staff and
-- logo rows, and insert payment rows, straight from a browser with the
-- public key. Nothing on the site writes them that way: every write goes
-- through server code with the service role, after its checks. Left open,
-- an owner could set launch_client and price_frozen_until on his own
-- business and pay the launch price for years, or file a payment row that
-- no check had seen.
--
-- 0001 also let any signed-in session, the anonymous one every visitor to
-- the builder gets included, read every setting, private ones too. Signed-in
-- sessions now read the same public list as visitors.

drop policy if exists settings_read on settings;
alter policy settings_public_read on settings to anon, authenticated;

drop policy if exists businesses_own on businesses;
create policy businesses_read_own on businesses for select
  using (owner_id = auth.uid());

drop policy if exists payments_insert_own on payments;

drop policy if exists products_initial_own on products_initial;
create policy products_initial_read_own on products_initial for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

drop policy if exists staff_initial_own on staff_initial;
create policy staff_initial_read_own on staff_initial for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));

drop policy if exists logos_own on logos;
create policy logos_read_own on logos for select
  using (exists (select 1 from businesses b where b.id = business_id and b.owner_id = auth.uid()));
