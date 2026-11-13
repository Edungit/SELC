-- SELC simplified Carer-only self-service portal.
-- New public registrations are Carers and become active without manual approval.
-- Privileged roles remain assigned only by trusted administrators.

alter table public.staff_profiles alter column account_status set default 'active';

update public.staff_profiles p
set account_status='active'
where p.application_track='carer'
  and p.account_status::text='pending_review';

-- Existing ordinary staff accounts without a pathway are treated as Carers.
update public.staff_profiles p
set application_track='carer'
where p.application_track is null
  and exists (
    select 1 from public.user_role_assignments ura
    where ura.user_id=p.user_id and ura.role='staff_member'
  );

update public.staff_application_details d
set application_track='carer'
where exists (
  select 1 from public.staff_profiles p
  where p.user_id=d.user_id and p.application_track='carer'
);

create or replace function public.handle_new_selc_applicant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.staff_profiles (
    user_id, first_name, last_name, work_email,
    account_status, application_submitted_at, application_track
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    lower(new.email),
    'active',
    now(),
    'carer'
  )
  on conflict (user_id) do update
    set first_name=coalesce(public.staff_profiles.first_name,excluded.first_name),
        last_name=coalesce(public.staff_profiles.last_name,excluded.last_name),
        work_email=coalesce(excluded.work_email,public.staff_profiles.work_email),
        account_status='active',
        application_track='carer';

  insert into public.staff_application_details(user_id,application_track)
  values (new.id,'carer')
  on conflict (user_id) do update set application_track='carer';

  insert into public.user_role_assignments (user_id, role)
  values (new.id, 'staff_member')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_selc_applicant on auth.users;
create trigger on_auth_user_created_selc_applicant
after insert on auth.users
for each row execute function public.handle_new_selc_applicant();

comment on column public.staff_profiles.account_status is
'Carer self-registration is active after Supabase email verification; no manual administrator approval is required.';
comment on column public.staff_profiles.application_track is
'Public self-service portal currently supports Carer registrations only.';
