-- Which trades owners can choose now lives in one file,
-- builder/packs/opening.ts, one word per trade. The two settings that used to
-- say it, enabled_packs and test_packs, are read by nothing any more, and
-- are removed so there is never a second place that seems to decide it.
--
-- Apply after the code that reads opening.ts is deployed, never before: the
-- code before it requires enabled_packs, and stops reading any setting at
-- all when it is missing. The new code ignores these rows, so leaving them
-- a while does no harm.

delete from settings where key in ('enabled_packs', 'test_packs');
