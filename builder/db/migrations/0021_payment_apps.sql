-- Paying from any of the five apps, and a screenshot that is read.
--
-- An owner chooses the app he pays from: Bankily, Masrvi, BimBank, SEDAD or
-- Click. Each has its own receiving number in settings, and an app whose
-- number is empty is not offered. The four new ones start with the Bankily
-- number, which is the one OUAQT uses on all five (decided 2026-09-25); each
-- can be changed on its own from the admin area.
--
-- The owner no longer types the transaction number. It is read off the
-- screenshot with the amount and the date, or by a person when the AI does
-- not read images.

insert into settings (key, value, description)
select key, coalesce((select value from settings where key = 'bankily_number'), '""'), description
  from (values
    ('masrvi_number',  'The number owners pay to on Masrvi. Empty hides Masrvi'),
    ('bimbank_number', 'The number owners pay to on BimBank. Empty hides BimBank'),
    ('sedad_number',   'The number owners pay to on SEDAD. Empty hides SEDAD'),
    ('click_number',   'The number owners pay to on Click. Empty hides Click')
  ) as apps (key, description)
on conflict (key) do nothing;

update settings
   set description = 'The number owners pay to on Bankily. Empty hides Bankily'
 where key = 'bankily_number';

-- Which app the money came from. The payments filed before this were all
-- Bankily, the only one there was.
alter table payments
  add column if not exists app text not null default 'bankily'
  check (app in ('bankily', 'masrvi', 'bimbank', 'sedad', 'click'));

-- A screenshot or a transaction number may be used once. The check refused
-- a duplicate, then the insert hit the unique column and the owner was told
-- the sending had failed, instead of why. And a screenshot refused on sight
-- (a misread amount, say) could never be sent again. So a refusal on sight
-- is recorded but reserves nothing: the once-only rule holds for every
-- payment still waiting, confirmed or refused by a person.
alter table payments drop constraint if exists payments_image_hash_key;
alter table payments drop constraint if exists payments_reference_key;

create unique index if not exists payments_image_once
  on payments (image_hash) where status <> 'rejected_auto';
create unique index if not exists payments_reference_once
  on payments (reference) where status <> 'rejected_auto' and reference is not null;
