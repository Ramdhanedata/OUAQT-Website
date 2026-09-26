-- The software opens its shop by itself on the computer it was downloaded to.
--
-- Decided 2026-09-26. An owner should never have to type his serial into the
-- software he has just installed: pressing the download at step 4 makes the
-- same one-time token as before, and notes where the download came from as
-- a scrambled mark of the connection (an HMAC of the address, IPv6 cut to its
-- network) and which system it was for. The first time the software starts,
-- it asks whether it was downloaded from its own connection; if exactly one
-- shop was, it opens that shop and the trial starts. Anything else, and it
-- asks for the serial as it always has.
--
-- The mark is never the address itself, only lives as long as the token,
-- and is cleared once the token is spent.

alter table activation_tokens add column if not exists place_hash text;
alter table activation_tokens add column if not exists platform text
  check (platform is null or platform in ('windows', 'mac'));

create index if not exists activation_tokens_place_idx on activation_tokens (place_hash)
  where used_at is null and place_hash is not null;

insert into settings (key, value, description) values
  ('activation_nearby_hours', '6', 'How long after a download the software, started on the same connection, opens its shop by itself')
on conflict (key) do update
  set description = excluded.description,
      updated_at = now();
