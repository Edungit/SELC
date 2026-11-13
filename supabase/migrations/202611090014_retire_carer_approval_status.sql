-- Ensure legacy Carer accounts are not blocked by the retired approval workflow.
update public.staff_profiles
set account_status='active'
where application_track='carer'
  and account_status::text in ('pending_review','rejected');

-- Retire old application decision queue data without deleting applicant records.
comment on table public.staff_profiles is
'Carer self-service records are available to Super Administrators. New Carer accounts are active after email verification; no manual approval queue is used.';
