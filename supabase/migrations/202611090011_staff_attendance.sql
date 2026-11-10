-- Attendance records and staff absence notifications.
-- All writes are performed by authenticated server routes using the server-only service role.
create table if not exists public.staff_attendance (
 id uuid primary key default gen_random_uuid(),
 shift_assignment_id uuid not null unique references public.staff_shift_assignments(id) on delete cascade,
 shift_id uuid not null references public.staff_shifts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 department_id uuid not null references public.departments(id),
 clock_in_at timestamptz not null,
 clock_out_at timestamptz,
 late_minutes integer not null default 0 check(late_minutes >= 0),
 attendance_status text not null default 'clocked_in' check(attendance_status in ('clocked_in','awaiting_review','verified','flagged')),
 clock_in_note text,
 clock_out_note text,
 manager_note text,
 verified_by uuid references auth.users(id),
 verified_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint attendance_clock_order check(clock_out_at is null or clock_out_at >= clock_in_at)
);
create index if not exists staff_attendance_user_idx on public.staff_attendance(user_id,clock_in_at desc);
create index if not exists staff_attendance_department_idx on public.staff_attendance(department_id,attendance_status,clock_in_at desc);

create table if not exists public.staff_absence_reports (
 id uuid primary key default gen_random_uuid(),
 shift_assignment_id uuid not null unique references public.staff_shift_assignments(id) on delete cascade,
 shift_id uuid not null references public.staff_shifts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 department_id uuid not null references public.departments(id),
 reason text not null check(char_length(reason) between 2 and 1000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 manager_note text,
 reviewed_by uuid references auth.users(id),
 reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists staff_absence_department_idx on public.staff_absence_reports(department_id,status,created_at desc);
create index if not exists staff_absence_user_idx on public.staff_absence_reports(user_id,created_at desc);

alter table public.staff_attendance enable row level security;
alter table public.staff_absence_reports enable row level security;
revoke all on public.staff_attendance from anon,authenticated;
revoke all on public.staff_absence_reports from anon,authenticated;

comment on table public.staff_attendance is 'Server-managed attendance events linked to an assigned shift. All timestamps are stored as UTC timestamptz; shift schedule times are interpreted in Europe/London.';
comment on table public.staff_absence_reports is 'Staff absence notifications linked to a shift assignment. Avoid collecting detailed medical information.';
