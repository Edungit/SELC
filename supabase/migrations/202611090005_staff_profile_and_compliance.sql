-- Additional South East London Care staff profile and compliance features.
-- Run after 202611090004_staff_application_pathways.sql.

alter table public.staff_profiles
  add column if not exists profile_photo_path text;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('selc-profile-photos','selc-profile-photos',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;

create policy "Staff upload own profile photo"
on storage.objects for insert to authenticated
with check (bucket_id='selc-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "Staff and authorised HR read profile photos"
on storage.objects for select to authenticated
using (bucket_id='selc-profile-photos' and ((storage.foldername(name))[1]=(select auth.uid())::text or public.current_user_can_review_compliance()));

create policy "Staff update own profile photo"
on storage.objects for update to authenticated
using (bucket_id='selc-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='selc-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "Staff delete own profile photo"
on storage.objects for delete to authenticated
using (bucket_id='selc-profile-photos' and (storage.foldername(name))[1]=(select auth.uid())::text);

create index if not exists staff_document_expiry_idx
on public.staff_document_records(expiry_date)
where expiry_date is not null;
