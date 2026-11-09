-- The trades each free trial covered.
--
-- Decided 2026-11-09. A device and a phone number have one free trial for
-- each trade (the shop's pack), not one in all: a computer whose restaurant
-- trial ended may still try the pharmacy software, once.
--
-- Read from the shop's current trade alone, that rule could be walked round:
-- start a pharmacy trial, rebuild the shop as a restaurant, and the device
-- looks as if it never had a pharmacy trial, while it runs a second
-- restaurant month. So each claim keeps the trades its trial covered. It is
-- written when the trial starts, and a trade the shop is rebuilt as during
-- its trial is added to it. A trial rebuilt as a trade its device or phone
-- number already tried elsewhere ends there (builder/licence/trial-claim.ts).
--
-- Every claim made before this gets the trade its shop has now, which is the
-- best that is known about it.

alter table trial_claims add column if not exists packs text[] not null default '{}';

update trial_claims c
   set packs = array[b.pack]
  from businesses b
 where b.id = c.business_id
   and c.packs = '{}';

update settings
   set description = 'Refuse a second trial of the same trade on a machine that already had one',
       updated_at = now()
 where key = 'trial_one_per_fingerprint';

update settings
   set description = 'Refuse a second trial of the same trade on a phone number that already had one',
       updated_at = now()
 where key = 'trial_one_per_phone';
