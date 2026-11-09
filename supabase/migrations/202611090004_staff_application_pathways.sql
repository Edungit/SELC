-- SELC applicant pathways and private compliance document foundation.
-- Apply this migration in Supabase SQL Editor before enabling the new registration form.

alter table public.staff_profiles
  add column if not exists application_track text
  check (application_track in ('carer','nurse'));

create table if not exists public.staff_application_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  application_track text not null check (application_track in ('carer','nurse')),
  previous_names text,
  date_of_birth date,
  address_line_1 text,
  address_line_2 text,
  town_city text,
  postcode text,
  home_telephone text,
  mobile_telephone text,
  national_insurance_number text,
  immigration_status text,
  eu_citizen boolean,
  requires_work_permit boolean,
  has_driving_licence boolean,
  has_vehicle_for_work boolean,
  next_of_kin_name text,
  next_of_kin_relationship text,
  next_of_kin_address text,
  next_of_kin_telephone text,
  earliest_start_date date,
  notice_period text,
  booked_holiday_dates text,
  declaration_accepted boolean not null default false,
  declaration_signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_employment_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  employer_name text not null,
  job_title text,
  employment_start date,
  employment_end date,
  reason_for_leaving text,
  employer_address text,
  employer_contact text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.staff_referees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  referee_name text not null,
  position_or_status text,
  organisation text,
  work_address text,
  postcode text,
  telephone text,
  email text,
  is_current_or_most_recent_employer boolean not null default false,
  verification_status text not null default 'not_requested'
    check (verification_status in ('not_requested','requested','verified','unable_to_verify')),
  created_at timestamptz not null default now()
);

create table if not exists public.nurse_professional_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  professional_body text,
  registration_number text,
  registration_expiry date,
  professional_role text,
  indemnity_insurance boolean,
  indemnity_expiry date,
  dbs_update_service_registered boolean,
  dbs_issue_date date,
  dbs_disclosure_number text,
  uniform_size text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.staff_document_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  application_track text not null check (application_track in ('carer','nurse')),
  document_type text not null,
  storage_path text not null unique,
  original_filename text not null,
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes > 0),
  sensitivity text not null default 'standard'
    check (sensitivity in ('standard','restricted_compliance')),
  review_status text not null default 'pending'
    check (review_status in ('pending','accepted','rejected','expired')),
  expiry_date date,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  uploaded_at timestamptz not null default now()
);

create index if not exists staff_application_track_idx
  on public.staff_application_details(application_track);
create index if not exists staff_employment_user_idx
  on public.staff_employment_history(user_id, display_order);
create index if not exists staff_referees_user_idx
  on public.staff_referees(user_id);
create index if not exists staff_documents_user_idx
  on public.staff_document_records(user_id, uploaded_at desc);
create index if not exists staff_documents_review_idx
  on public.staff_document_records(review_status, sensitivity);

alter table public.staff_application_details enable row level security;
alter table public.staff_employment_history enable row level security;
alter table public.staff_referees enable row level security;
alter table public.nurse_professional_details enable row level security;
alter table public.staff_document_records enable row level security;

-- Compliance information is visible only to the individual and authorised
-- compliance/HR/super-administrator roles. Department managers are excluded.
create or replace function public.current_user_can_review_compliance()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_role_assignments ura
    where ura.user_id = (select auth.uid())
      and ura.role in ('super_administrator','hr_manager','compliance_officer')
  );
$$;

create policy "Applicants manage own application details"
on public.staff_application_details for all to authenticated
using (user_id = (select auth.uid()) or public.current_user_can_review_compliance())
with check (user_id = (select auth.uid()) or public.current_user_can_review_compliance());

create policy "Applicants manage own employment history"
on public.staff_employment_history for all to authenticated
using (user_id = (select auth.uid()) or public.current_user_can_review_compliance())
with check (user_id = (select auth.uid()) or public.current_user_can_review_compliance());

create policy "Applicants manage own referees"
on public.staff_referees for all to authenticated
using (user_id = (select auth.uid()) or public.current_user_can_review_compliance())
with check (user_id = (select auth.uid()) or public.current_user_can_review_compliance());

create policy "Nurses and authorised compliance roles access professional details"
on public.nurse_professional_details for all to authenticated
using (user_id = (select auth.uid()) or public.current_user_can_review_compliance())
with check (user_id = (select auth.uid()) or public.current_user_can_review_compliance());

create policy "Staff read own document records and compliance reviews"
on public.staff_document_records for select to authenticated
using (user_id = (select auth.uid()) or public.current_user_can_review_compliance());

create policy "Staff add own document records"
on public.staff_document_records for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Compliance roles update document review"
on public.staff_document_records for update to authenticated
using (public.current_user_can_review_compliance())
with check (public.current_user_can_review_compliance());

grant select, insert, update, delete on public.staff_application_details to authenticated;
grant select, insert, update, delete on public.staff_employment_history to authenticated;
grant select, insert, update, delete on public.staff_referees to authenticated;
grant select, insert, update, delete on public.nurse_professional_details to authenticated;
grant select, insert on public.staff_document_records to authenticated;
grant update (review_status, expiry_date, reviewed_by, reviewed_at, review_note)
  on public.staff_document_records to authenticated;

-- Private bucket: do not make staff identity, DBS, health or qualification
-- documents publicly accessible. File object paths must begin with auth.uid().
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'selc-staff-documents',
  'selc-staff-documents',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Staff upload into own private folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'selc-staff-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Staff and compliance access private staff files"
on storage.objects for select to authenticated
using (
  bucket_id = 'selc-staff-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.current_user_can_review_compliance()
  )
);

create policy "Staff delete own unreviewed files or compliance manage"
on storage.objects for delete to authenticated
using (
  bucket_id = 'selc-staff-documents'
  and (
    ((storage.foldername(name))[1] = (select auth.uid())::text
      and not exists (
        select 1 from public.staff_document_records d
        where d.storage_path = name and d.review_status in ('accepted','pending')
      ))
    or public.current_user_can_review_compliance()
  )
);

-- Keep registration type on both the profile and application record.
create or replace function public.handle_new_selc_applicant()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  selected_track text;
begin
  selected_track := case
    when new.raw_user_meta_data ->> 'application_track' in ('carer','nurse')
      then new.raw_user_meta_data ->> 'application_track'
    else null
  end;

  insert into public.staff_profiles (
    user_id, first_name, last_name, work_email,
    account_status, application_submitted_at, application_track
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    lower(new.email),
    'pending_review',
    now(),
    selected_track
  )
  on conflict (user_id) do update
    set application_track = coalesce(excluded.application_track, public.staff_profiles.application_track);

  insert into public.user_role_assignments (user_id, role)
  values (new.id, 'staff_member')
  on conflict (user_id, role, department_id) do nothing;

  if selected_track is not null then
    insert into public.staff_application_details(user_id, application_track)
    values (new.id, selected_track)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_selc_applicant on auth.users;
create trigger on_auth_user_created_selc_applicant
after insert on auth.users
for each row execute function public.handle_new_selc_applicant();
