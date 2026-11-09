-- South East London Care staff announcements and communication feed.
create table if not exists public.staff_announcements (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 3 and 180),
 body text not null check (char_length(body) between 1 and 12000),
 audience text not null default 'all_staff' check (audience in ('all_staff','carer','nurse')),
 published boolean not null default false,
 email_status text not null default 'not_sent' check (email_status in ('not_sent','sent','partial','failed')),
 email_sent_count integer not null default 0,
 created_by uuid not null references auth.users(id),
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists staff_announcements_feed_idx on public.staff_announcements(published,published_at desc);
alter table public.staff_announcements enable row level security;
create policy "Active staff read published announcements"
on public.staff_announcements for select to authenticated
using (published=true and exists(select 1 from public.staff_profiles p where p.user_id=(select auth.uid()) and p.account_status='active'));
create policy "HR and super administrators manage announcements"
on public.staff_announcements for all to authenticated
using (exists(select 1 from public.user_role_assignments r where r.user_id=(select auth.uid()) and r.role in ('super_administrator','hr_manager')))
with check (exists(select 1 from public.user_role_assignments r where r.user_id=(select auth.uid()) and r.role in ('super_administrator','hr_manager')));
grant select,insert,update,delete on public.staff_announcements to authenticated;
