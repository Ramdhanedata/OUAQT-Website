-- Where the owner's logo actually lives.
--
-- The logos table holds paths, not pictures, so there has to be a bucket for
-- the pictures. It is private: a shop's logo is its own, and a public bucket
-- would put every client's mark on a guessable address.
--
-- Each file sits in a folder named after the owner, which is what the policies
-- below check. Only the two prepared images ever arrive here, so the ceiling
-- is the same one the browser enforces.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 1000000, array['image/png', 'image/jpeg'])
on conflict (id) do nothing;

-- An owner reaches his own folder and nobody else's.
create policy logos_read_own on storage.objects for select
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_write_own on storage.objects for insert
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_update_own on storage.objects for update
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy logos_delete_own on storage.objects for delete
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
