-- Seed values for the test environment. Empty where the real value is still
-- being decided: the pages that need them say so plainly rather than guessing.
insert into settings (key, value, description) values
  ('trial_days',                '14',              'Free days, counted from the first activation of a device'),
  ('max_devices',               '2',               'Computers one licence may run on'),
  ('device_releases_per_year',  '2',               'How many times an owner may free a computer himself'),
  ('clock_grace_days',          '2',               'Delivered in the licence; used by the desktop app'),
  ('payment_max_age_days',      '7',               'How old a transfer screenshot may be'),
  ('bankily_number',            '""',              'Empty hides the payment page'),
  ('support_whatsapp',          '"22226406568"',   'The number behind every help button'),
  ('price_annual_mru',          'null',            'Under review; the payment page says so until set'),
  ('price_perpetual_mru',       'null',            'Under review'),
  ('price_extra_device_mru',    'null',            'Under review'),
  ('tutorial_video_windows_url','""',              'Hidden while empty'),
  ('tutorial_video_mac_url',    '""',              'Hidden while empty'),
  ('enabled_packs',             '["pharmacy"]',    'Only these appear as choices in the builder')
on conflict (key) do nothing;
