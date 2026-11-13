-- SELC: restore narrowly scoped profile permissions for authenticated Carers.
-- The initial identity migration grants updates to names only. The profile
-- workspace also updates profile_photo_path when a user changes their photo.
-- Do not grant blanket UPDATE on staff_profiles.

grant usage on schema public to authenticated;
grant select on table public.staff_profiles to authenticated;
grant update (first_name, last_name, preferred_name, profile_photo_path)
  on table public.staff_profiles to authenticated;

-- Reassert the own-profile update policy with an explicit WITH CHECK.
drop policy if exists "Staff update own basic profile" on public.staff_profiles;
create policy "Staff update own basic profile"
on public.staff_profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

comment on column public.staff_profiles.profile_photo_path is
'Private storage object path for the users own profile photograph; updateable by that authenticated user.';
