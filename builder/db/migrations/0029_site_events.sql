-- Visits to the site and presses on a download button, counted for the
-- admin overview. Nothing in a row says who.
--
-- A visit is a page shown in a browser tab: a random number that tab made up
-- (kept in the tab's own storage and gone when it closes), the page's path
-- without its language, the language, and phone or computer. A download is a
-- press on a download button: the system it was for and the trade. No
-- address, no cookie, no account, no shop.

create table if not exists site_events (
  id           bigserial primary key,
  kind         text not null check (kind in ('visit', 'download')),
  session_hash text not null,
  page         text,
  locale       text check (locale is null or locale in ('fr', 'ar', 'en')),
  platform     text check (platform is null or platform in ('windows', 'mac')),
  pack         text,
  device_class text check (device_class is null or device_class in ('phone', 'desktop')),
  created_at   timestamptz not null default now()
);
alter table site_events enable row level security;
-- No policy: only the service role reads or writes these.

create index if not exists site_events_kind_created_idx on site_events (kind, created_at desc);
