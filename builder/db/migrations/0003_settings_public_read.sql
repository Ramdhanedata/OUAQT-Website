-- The marketing pages read a few settings before anyone signs in: how long the
-- free trial lasts, which packs are open, the help number, the prices once they
-- are set. 0001 only let signed-in users read the table, which would have meant
-- the home page holding the service role key to render a sentence.
--
-- So: a second read policy for visitors, over a named list of keys. Anything
-- not on the list stays invisible until the visitor is signed in. Adding a
-- setting does not make it public by accident; someone has to add it here.
create policy settings_public_read on settings
  for select
  to anon
  using (
    key in (
      'trial_days',
      'max_devices',
      'enabled_packs',
      'support_whatsapp',
      'price_annual_mru',
      'price_perpetual_mru',
      'price_extra_device_mru',
      'tutorial_video_windows_url',
      'tutorial_video_mac_url'
    )
  );

-- Deliberately not public: bankily_number, payment_max_age_days,
-- device_releases_per_year, clock_grace_days. They are rules the desktop app
-- and the payment page enforce for people who are already signed in.
