-- SELC initial identity and access schema.
-- Apply through the Supabase SQL editor or Supabase CLI after review.
-- Use synthetic data only during development.

create extension if not exists pgcrypto;

create type public.selc_role as enum (
  'super_administrator', 'hr_manager', 'department_manager',
  'compliance_officer', 'staff_member'
);
create type public.account_status as enum ('invited', 'active', 'suspended', 'deactivated');

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  staff_number text unique,
  first_name text,
  last_name text,
  preferred_name text,
  work_email text,
  department_id uuid references public.departments(id),
  account_status public.account_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.selc_role not null,
  department_id uuid references public.departments(id),
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default now(),
  unique (user_id, role, department_id)
);

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  intended_role public.selc_role not null default 'staff_member',
  department_id uuid references public.departments(id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  event_type text not null,
  target_user_id uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index staff_profiles_department_idx on public.staff_profiles(department_id);
create index role_assignments_user_idx on public.user_role_assignments(user_id);
create index invitations_email_idx on public.staff_invitations(lower(email));
create index audit_events_created_idx on public.audit_events(created_at desc);

create or replace function public.current_user_has_role(required_role public.selc_role)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_role_assignments ura
    where ura.user_id = (select auth.uid()) and ura.role = required_role
  );
$$;

create or replace function public.current_user_is_privileged()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_role_assignments ura
    where ura.user_id = (select auth.uid())
      and ura.role in ('super_administrator', 'hr_manager')
  );
$$;

alter table public.departments enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.staff_invitations enable row level security;
alter table public.audit_events enable row level security;

create policy "Authenticated users read active departments"
on public.departments for select to authenticated
using (is_active = true or public.current_user_is_privileged());

create policy "Privileged admins manage departments"
on public.departments for all to authenticated
using (public.current_user_is_privileged())
with check (public.current_user_is_privileged());

create policy "Staff read own profile or privileged read all"
on public.staff_profiles for select to authenticated
using (user_id = (select auth.uid()) or public.current_user_is_privileged());

create policy "Staff update own basic profile"
on public.staff_profiles for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Privileged admins insert profiles"
on public.staff_profiles for insert to authenticated
with check (public.current_user_is_privileged());

create policy "Privileged admins manage role assignments"
on public.user_role_assignments for all to authenticated
using (public.current_user_is_privileged())
with check (public.current_user_is_privileged());

create policy "Users read own role assignments"
on public.user_role_assignments for select to authenticated
using (user_id = (select auth.uid()));

-- Invitations and audit events have no client-facing policies.
-- Trusted server-side operations only; never expose service_role credentials.
revoke all on public.staff_invitations from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;

grant select on public.departments to authenticated;
grant select on public.staff_profiles to authenticated;
revoke update on public.staff_profiles from authenticated;
grant update (first_name, last_name, preferred_name) on public.staff_profiles to authenticated;
grant insert on public.staff_profiles to authenticated;
grant select on public.user_role_assignments to authenticated;

comment on table public.staff_profiles is
'Minimal staff directory profile. Sensitive HR, health, DBS, identity and payroll records belong in separately governed modules.';
comment on table public.staff_invitations is
'Invitation tokens are stored as hashes; access only through trusted server-side operations.';
comment on table public.audit_events is
'Append-only audit foundation; writes are restricted to trusted server-side operations.';
