-- One number for the owner: the numéro de série.
--
-- The code de configuration (OUAQT-XXXX-XXXX) is gone. When the questions
-- end, the phone is given a numéro de série straight away, reserved on its
-- draft, and the same number downloads the software on the computer and
-- activates it. The shop is made the first time the number is used, so an
-- abandoned configuration never becomes a business.
--
-- The draft keeps the number the way serials does: a hash to look it up by
-- and a cipher to show it again, never the number in the clear.

-- Added beside the old code column rather than renaming it, so a page still
-- running the old code keeps working until the new one is deployed. The old
-- codes were test data; nothing reads that column any more.
alter table builder_drafts
  add column if not exists serial_hash text unique,
  add column if not exists serial_cipher text;

create index if not exists builder_drafts_number_phone_idx on builder_drafts (phone) where serial_hash is not null;

create or replace function builder_drafts_server_columns() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('anon', 'authenticated') then
    if tg_op = 'INSERT' then
      new.code := null;
      new.serial_hash := null;
      new.serial_cipher := null;
      new.phone := null;
      new.created_at := now();
      new.last_accessed_at := null;
      new.status := 'active';
      new.logo_path := null;
      new.logo_mono_path := null;
      new.made_in_test_mode := false;
    else
      new.code := old.code;
      new.serial_hash := old.serial_hash;
      new.serial_cipher := old.serial_cipher;
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
