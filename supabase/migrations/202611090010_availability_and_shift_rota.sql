-- Expanded weekly availability windows and controlled shift/rota foundations.
alter table public.staff_availability
  add column if not exists slot_number smallint not null default 1,
  add column if not exists ends_next_day boolean not null default false;

alter table public.staff_availability
  drop constraint if exists staff_availability_user_id_day_of_week_key;
alter table public.staff_availability
  drop constraint if exists availability_time_order;

alter table public.staff_availability
  add constraint staff_availability_slot_unique unique(user_id,day_of_week,slot_number);
alter table public.staff_availability
  add constraint staff_availability_slot_number check(slot_number between 1 and 2);
alter table public.staff_availability
  add constraint availability_time_order check (
    unavailable
    or (
      available_from is not null
      and available_until is not null
      and (
        (ends_next_day = false and available_until > available_from)
        or (ends_next_day = true and available_until <= available_from)
      )
    )
  );

create table if not exists public.staff_shifts (
 id uuid primary key default gen_random_uuid(),
 department_id uuid not null references public.departments(id),
 application_track text check(application_track in ('carer','nurse')),
 title text not null check(char_length(title) between 2 and 120),
 shift_date date not null,
 start_time time not null,
 end_time time not null,
 ends_next_day boolean not null default false,
 break_minutes integer not null default 0 check(break_minutes between 0 and 240),
 location text,
 required_staff integer not null default 1 check(required_staff between 1 and 100),
 notes text,
 status text not null default 'draft' check(status in ('draft','published','cancelled')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint shift_time_order check (
   (ends_next_day = false and end_time > start_time)
   or (ends_next_day = true and end_time <= start_time)
 )
);
create index if not exists staff_shifts_department_date_idx on public.staff_shifts(department_id,shift_date,status);
create index if not exists staff_shifts_track_date_idx on public.staff_shifts(application_track,shift_date,status);

create table if not exists public.staff_shift_assignments (
 id uuid primary key default gen_random_uuid(),
 shift_id uuid not null references public.staff_shifts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'assigned' check(status in ('assigned','accepted','declined','completed','no_show','cancelled')),
 assigned_by uuid not null references auth.users(id),
 staff_note text,
 manager_note text,
 assigned_at timestamptz not null default now(),
 responded_at timestamptz,
 updated_at timestamptz not null default now(),
 unique(shift_id,user_id)
);
create index if not exists staff_shift_assignments_user_idx on public.staff_shift_assignments(user_id,status);
create index if not exists staff_shift_assignments_shift_idx on public.staff_shift_assignments(shift_id,status);

alter table public.staff_shifts enable row level security;
alter table public.staff_shift_assignments enable row level security;
revoke all on public.staff_shifts from anon,authenticated;
revoke all on public.staff_shift_assignments from anon,authenticated;
-- Shift creation and assignment are performed by authenticated server routes
-- after explicit role, department and pathway checks. The service-role key
-- must remain server-side and must never be exposed to browser code.
