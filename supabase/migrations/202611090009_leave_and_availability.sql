-- Staff leave requests and recurring availability declarations.
create table if not exists public.staff_leave_requests (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 department_id uuid references public.departments(id),
 leave_type text not null check (leave_type in ('annual_leave','sickness','compassionate','unpaid','other')),
 start_date date not null,
 end_date date not null,
 reason text,
 status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
 manager_note text,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint leave_date_order check (end_date >= start_date)
);
create index if not exists staff_leave_user_dates_idx on public.staff_leave_requests(user_id,start_date desc);
create index if not exists staff_leave_department_status_idx on public.staff_leave_requests(department_id,status,start_date);
alter table public.staff_leave_requests enable row level security;
create policy "Staff read own leave requests"
on public.staff_leave_requests for select to authenticated using(user_id=(select auth.uid()));
create policy "Staff submit own leave requests"
on public.staff_leave_requests for insert to authenticated with check(user_id=(select auth.uid()) and status='pending' and reviewed_by is null and reviewed_at is null);
create policy "Staff cancel own pending leave requests"
on public.staff_leave_requests for update to authenticated using(user_id=(select auth.uid()) and status='pending') with check(user_id=(select auth.uid()) and status='cancelled' and reviewed_by is null and reviewed_at is null);
create policy "HR and super admins read and review leave requests"
on public.staff_leave_requests for all to authenticated
using(public.current_user_is_privileged())
with check(public.current_user_is_privileged());
create policy "Department managers read and review their department leave"
on public.staff_leave_requests for select to authenticated
using(exists(select 1 from public.user_role_assignments r where r.user_id=(select auth.uid()) and r.role='department_manager' and r.department_id=staff_leave_requests.department_id));
create policy "Department managers update their department leave"
on public.staff_leave_requests for update to authenticated
using(exists(select 1 from public.user_role_assignments r where r.user_id=(select auth.uid()) and r.role='department_manager' and r.department_id=staff_leave_requests.department_id))
with check(exists(select 1 from public.user_role_assignments r where r.user_id=(select auth.uid()) and r.role='department_manager' and r.department_id=staff_leave_requests.department_id));
grant select,insert on public.staff_leave_requests to authenticated;
revoke update on public.staff_leave_requests from authenticated;
grant update (status) on public.staff_leave_requests to authenticated;

create table if not exists public.staff_availability (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 day_of_week smallint not null check(day_of_week between 0 and 6),
 available_from time,
 available_until time,
 unavailable boolean not null default false,
 notes text,
 updated_at timestamptz not null default now(),
 unique(user_id,day_of_week),
 constraint availability_time_order check(unavailable or (available_from is not null and available_until is not null and available_until > available_from))
);
alter table public.staff_availability enable row level security;
create policy "Staff manage own availability"
on public.staff_availability for all to authenticated
using(user_id=(select auth.uid()))
with check(user_id=(select auth.uid()));
create policy "HR and department managers read staff availability"
on public.staff_availability for select to authenticated
using(public.current_user_is_privileged() or exists(select 1 from public.user_role_assignments r join public.staff_profiles p on p.department_id=r.department_id where r.user_id=(select auth.uid()) and r.role='department_manager' and p.user_id=staff_availability.user_id));
grant select,insert,update,delete on public.staff_availability to authenticated;
