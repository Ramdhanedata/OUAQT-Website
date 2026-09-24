-- A configuration answered on a phone in test mode stays a test one on the
-- computer that opens its code.
--
-- Test mode lives in a cookie the admin area sets on one browser. The shop is
-- made on another one, the computer, which usually has no such cookie, so the
-- one-trial-per-machine rule would refuse staff trying the software on their
-- own computer again. The phone's test mode is written on the draft when the
-- code is issued, by the server only, and the shop made from the code
-- honours it.

alter table builder_drafts
  add column if not exists made_in_test_mode boolean not null default false;

create or replace function builder_drafts_server_columns() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.code := null;
      new.phone := null;
      new.created_at := now();
      new.last_accessed_at := null;
      new.status := 'active';
      new.logo_path := null;
      new.logo_mono_path := null;
      new.made_in_test_mode := false;
    else
      new.code := old.code;
      new.phone := old.phone;
      new.created_at := old.created_at;
      new.last_accessed_at := old.last_accessed_at;
      new.status := old.status;
      new.logo_path := old.logo_path;
      new.logo_mono_path := old.logo_mono_path;
      new.made_in_test_mode := old.made_in_test_mode;
    end if;
  end if;
  return new;
end;
$$;
