-- Profession-specific recruitment information for both SELC pathways.
-- Apply after 202611090005_staff_profile_and_compliance.sql.

alter table public.nurse_professional_details
  add column if not exists qualification_title text,
  add column if not exists qualification_institution text,
  add column if not exists qualification_year integer,
  add column if not exists registration_status text,
  add column if not exists revalidation_due date,
  add column if not exists clinical_specialties text,
  add column if not exists clinical_competencies text,
  add column if not exists years_experience numeric(4,1),
  add column if not exists preferred_work_settings text;

create table if not exists public.carer_professional_details (
  user_id uuid primary key references auth.users(id) on delete cascade,
  care_qualification text,
  qualification_provider text,
  qualification_year integer,
  years_care_experience numeric(4,1),
  care_settings_experience text,
  care_competencies text,
  training_completed text,
  training_expiry_dates text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carer_professional_details enable row level security;

create policy "Carers and authorised compliance roles access carer professional details"
on public.carer_professional_details for all to authenticated
using (user_id = (select auth.uid()) or public.current_user_can_review_compliance())
with check (user_id = (select auth.uid()) or public.current_user_can_review_compliance());

grant select, insert, update, delete on public.carer_professional_details to authenticated;
