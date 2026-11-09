-- SELC open applicant registration with mandatory administrative approval.
-- Existing accounts and role assignments are preserved.

create type public.account_status_v2 as enum (
  'pending_review', 'invited', 'active', 'rejected', 'suspended', 'deactivated'
);

alter table public.staff_profiles alter column account_status drop default;
alter table public.staff_profiles
  alter column account_status type public.account_status_v2
  using (
    case account_status::text
      when 'active' then 'active'
      when 'invited' then 'invited'
      when 'suspended' then 'suspended'
      when 'deactivated' then 'deactivated'
      else 'pending_review'
    end
  )::public.account_status_v2;

drop type public.account_status;
alter type public.account_status_v2 rename to account_status;
alter table public.staff_profiles alter column account_status set default 'pending_review';

alter table public.staff_profiles
  add column if not exists application_submitted_at timestamptz,
  add column if not exists admin_notification_sent_at timestamptz;

-- Every public sign-up gets a minimal profile and the ordinary Staff Member
-- role only. The applicant cannot choose or assign privileged roles.
create or replace function public.handle_new_selc_applicant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.staff_profiles (
    user_id, first_name, last_name, work_email,
    account_status, application_submitted_at
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    lower(new.email),
    'pending_review',
    now()
  )
  on conflict (user_id) do nothing;

  insert into public.user_role_assignments (user_id, role)
  values (new.id, 'staff_member')
  on conflict (user_id, role, department_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_selc_applicant on auth.users;
create trigger on_auth_user_created_selc_applicant
after insert on auth.users
for each row execute function public.handle_new_selc_applicant();

comment on column public.staff_profiles.account_status is
'Applicants remain pending_review until an authorised SELC administrator approves them.';
comment on column public.staff_profiles.admin_notification_sent_at is
'Timestamp recording the one-time administrative application notification.';
