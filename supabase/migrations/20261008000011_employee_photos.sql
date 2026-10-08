-- Employee profile photos. The file lives in a private storage bucket; the employee row
-- keeps only its path. Only signed-in, still-approved Admins can read or write photos.
alter table public.employees add column photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('employee-photos', 'employee-photos', false, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "employee photos: admins read" on storage.objects for select to authenticated
  using (bucket_id = 'employee-photos' and (select public.is_admin()));
create policy "employee photos: admins add" on storage.objects for insert to authenticated
  with check (bucket_id = 'employee-photos' and (select public.is_admin()));
create policy "employee photos: admins change" on storage.objects for update to authenticated
  using (bucket_id = 'employee-photos' and (select public.is_admin()))
  with check (bucket_id = 'employee-photos' and (select public.is_admin()));
create policy "employee photos: admins remove" on storage.objects for delete to authenticated
  using (bucket_id = 'employee-photos' and (select public.is_admin()));
