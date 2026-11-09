-- Track administrator application-alert delivery and support controlled retries.
alter table public.staff_profiles
  add column if not exists admin_notification_status text not null default 'pending'
    check (admin_notification_status in ('pending','sent','failed')),
  add column if not exists admin_notification_error text;

create index if not exists staff_profiles_pending_notification_idx
  on public.staff_profiles(account_status, admin_notification_status);
