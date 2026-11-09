-- Restrict announcement visibility to the intended professional audience.
drop policy if exists "Active staff read published announcements" on public.staff_announcements;
create policy "Active staff read announcements for their audience"
on public.staff_announcements for select to authenticated
using (
 published = true
 and exists (
  select 1 from public.staff_profiles p
  where p.user_id = (select auth.uid())
    and p.account_status = 'active'
    and (staff_announcements.audience = 'all_staff' or staff_announcements.audience = p.application_track)
 )
);
