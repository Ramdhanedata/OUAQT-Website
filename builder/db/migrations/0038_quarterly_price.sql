-- Three months at 3 900 MRU, as Adel set it on 2026-11-06, one price.
--
-- It was 4 500 MRU (0004), more than three single months (3 x 1 300 = 3 900),
-- so nobody had a reason to choose it. Now it costs what three months cost
-- one by one: 1 300 a month, like the month and the two months.
--
-- One price means no launch price: the launch row stays empty, so a launch
-- client pays the same 3 900. In the smallest unit, 1 MRU is 100. Changed
-- from the admin area afterwards like any price.

update settings
   set value = '390000'::jsonb,
       description = 'Per three months. 3 900 MRU since 2026-11-06, one price',
       updated_at = now()
 where key = 'price_quarterly_standard_mru';

update settings
   set value = 'null'::jsonb,
       updated_at = now()
 where key = 'price_quarterly_launch_mru';
