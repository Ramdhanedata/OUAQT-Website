-- Two things Supabase's security check found, decided 2026-10-01 when the
-- production project was set up.
--
-- schema_migrations is the list scripts/db-push.mjs keeps of the files it ran.
-- It had no row level security, so anyone holding the site's public key could
-- read it and write to it through the API. It gets row level security and no
-- policy at all: the script connects as the database owner, which is not held
-- back by it, and nobody else has any reason to touch it.
alter table schema_migrations enable row level security;

-- The trigger that keeps a browser away from a draft's server-only columns
-- runs with whatever search path the caller set. It names everything it uses
-- in full, so a fixed path changes nothing it does and closes the door on a
-- caller who would put their own now() in front of it.
alter function public.builder_drafts_server_columns() set search_path = public, pg_temp;
