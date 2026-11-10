-- SELC structured training, pathway compliance requirements and reminder audit log.
create table if not exists public.staff_training_records (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 application_track text not null check(application_track in ('carer','nurse')),
 course_name text not null check(char_length(course_name) between 2 and 160),
 completed_on date not null,
 expiry_date date,
 certificate_document_id uuid references public.staff_document_records(id) on delete set null,
 verification_status text not null default 'pending' check(verification_status in ('pending','verified','rejected')),
 review_note text,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint training_expiry_after_completion check(expiry_date is null or expiry_date >= completed_on)
);
create index if not exists staff_training_user_idx on public.staff_training_records(user_id,completed_on desc);
create index if not exists staff_training_expiry_idx on public.staff_training_records(expiry_date,verification_status) where expiry_date is not null;

alter table public.staff_training_records enable row level security;
create policy "Staff read own training records"
on public.staff_training_records for select to authenticated
using(user_id=(select auth.uid()) or public.current_user_can_review_compliance());
create policy "Staff add own pending training records"
on public.staff_training_records for insert to authenticated
with check(user_id=(select auth.uid()) and verification_status='pending' and reviewed_by is null and reviewed_at is null);
create policy "Staff update own pending training records"
on public.staff_training_records for update to authenticated
using(user_id=(select auth.uid()) and verification_status='pending')
with check(user_id=(select auth.uid()) and verification_status='pending' and reviewed_by is null and reviewed_at is null);
create policy "Compliance roles review training records"
on public.staff_training_records for update to authenticated
using(public.current_user_can_review_compliance())
with check(public.current_user_can_review_compliance());
create policy "Staff delete own pending training records"
on public.staff_training_records for delete to authenticated
using(user_id=(select auth.uid()) and verification_status='pending');
grant select,insert,delete on public.staff_training_records to authenticated;
grant update(course_name,completed_on,expiry_date,certificate_document_id) on public.staff_training_records to authenticated;
grant update(verification_status,review_note,reviewed_by,reviewed_at) on public.staff_training_records to authenticated;

create table if not exists public.staff_compliance_requirements (
 id uuid primary key default gen_random_uuid(),
 application_track text not null check(application_track in ('carer','nurse')),
 requirement_code text not null,
 requirement_type text not null check(requirement_type in ('document','referees')),
 label text not null,
 document_type text,
 mandatory boolean not null default true,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 unique(application_track,requirement_code),
 constraint requirement_document_type_check check(
  (requirement_type='document' and document_type is not null)
  or (requirement_type='referees' and document_type is null)
 )
);
alter table public.staff_compliance_requirements enable row level security;
revoke all on public.staff_compliance_requirements from anon,authenticated;

insert into public.staff_compliance_requirements(application_track,requirement_code,requirement_type,label,document_type,mandatory)
values
 ('carer','cv','document','Curriculum vitae','CV',true),
 ('carer','ni_proof','document','Proof of National Insurance Number','Proof of National Insurance Number',true),
 ('carer','right_to_work','document','Right to Work / Passport / ID','Right to Work / Passport / ID',true),
 ('carer','dbs','document','DBS Disclosure','DBS Disclosure',true),
 ('carer','training_certificates','document','Training Certificates','Training Certificates',true),
 ('carer','passport_photographs','document','Two Passport Photographs','Two Passport Photographs',true),
 ('carer','professional_references','referees','Two Professional References',null,true),
 ('carer','driving_licence','document','Driving Licence (if applicable)','Driving Licence (if applicable)',false),
 ('nurse','cv','document','Curriculum vitae','CV',true),
 ('nurse','ni_proof','document','Proof of National Insurance Number','Proof of National Insurance Number',true),
 ('nurse','right_to_work','document','Right to Work / Passport / ID','Right to Work / Passport / ID',true),
 ('nurse','dbs','document','DBS Disclosure (less than one year old)','DBS Disclosure (less than one year old)',true),
 ('nurse','registration_evidence','document','NMC / HCPC Registration Evidence','NMC / HCPC Registration Evidence',true),
 ('nurse','training_qualifications','document','Training Qualifications','Training Qualifications',true),
 ('nurse','mandatory_training','document','Mandatory Training Certificates','Mandatory Training Certificates',true),
 ('nurse','immunisation','document','Immunisation Evidence','Immunisation Evidence',true),
 ('nurse','professional_references','referees','Two Professional Reference Forms',null,true),
 ('nurse','indemnity','document','Indemnity Insurance Evidence','Indemnity Insurance Evidence',true),
 ('nurse','passport_photographs','document','Two Passport Photographs','Two Passport Photographs',true)
on conflict(application_track,requirement_code) do update set
 requirement_type=excluded.requirement_type,label=excluded.label,document_type=excluded.document_type,mandatory=excluded.mandatory,active=true;

create table if not exists public.staff_compliance_alerts (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 source_type text not null check(source_type in ('document','nurse_registration','nurse_indemnity','training','missing_requirement')),
 source_id uuid not null,
 alert_stage text not null,
 due_date date,
 staff_email_status text not null default 'pending' check(staff_email_status in ('pending','sent','failed','skipped')),
 hr_email_status text not null default 'pending' check(hr_email_status in ('pending','sent','failed','skipped')),
 staff_email text,
 failure_reason text,
 staff_sent_at timestamptz,
 hr_sent_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(user_id,source_type,source_id,alert_stage)
);
create index if not exists staff_compliance_alerts_created_idx on public.staff_compliance_alerts(created_at desc);
create index if not exists staff_compliance_alerts_status_idx on public.staff_compliance_alerts(staff_email_status,hr_email_status);
alter table public.staff_compliance_alerts enable row level security;
revoke all on public.staff_compliance_alerts from anon,authenticated;

comment on table public.staff_training_records is 'Structured training completion and expiry evidence for Carers and Nurses.';
comment on table public.staff_compliance_requirements is 'Pathway-specific evidence requirements used by the compliance dashboard.';
comment on table public.staff_compliance_alerts is 'Server-only idempotency and delivery log for automated compliance reminders.';
