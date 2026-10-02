-- Staff in full control of a shop's software, from the admin's Contrôle page.
--
-- gift        a licence given free by staff (a lifetime one, usually):
--             never counted as money received, and shown as a gift.
-- grace_days  this licence's own days of grace after its end, in place of
--             the setting. 0 for a licence staff cancelled: the software
--             goes read-only at once instead of a month later. It travels
--             in the signed licence (renewalGraceDays), so the software
--             already installed in shops follows it without an update.
-- banned_at   a shop staff banned: suspended, no new computer may activate
--             it, and its computers may not start another shop.

alter table licences add column if not exists gift boolean not null default false;
alter table licences add column if not exists grace_days smallint check (grace_days is null or grace_days between 0 and 365);

alter table businesses add column if not exists banned_at timestamptz;
alter table businesses add column if not exists ban_reason text check (ban_reason is null or length(ban_reason) <= 400);

create index if not exists businesses_banned_idx on businesses (banned_at) where banned_at is not null;
