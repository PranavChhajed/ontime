-- OnTime: Checkpoint 2 schema.
-- Rules enforced here, not only in screens (see docs/planning/C3_Implementation_Plan.md C3.4):
--   one record per employee per day; never leave + arrival; closed months locked;
--   append-only change log; only approved-email Admins can read or write.

-- ───────────────────────── helpers ─────────────────────────

create or replace function public.ist_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Kolkata')::date $$;

-- ───────────────────────── access ─────────────────────────

create table public.approved_emails (
  email    text primary key check (email = lower(email) and position('@' in email) > 1),
  added_by uuid references auth.users (id) on delete set null,
  added_at timestamptz not null default now()
);

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null check (email = lower(email)),
  created_at timestamptz not null default now()
);

-- An Admin is a signed-in user whose email is STILL on the approved list,
-- so removing an email ends access at once.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.admins a
    join public.approved_emails e on e.email = a.email
    where a.user_id = auth.uid()
  );
$$;

-- Only approved emails may create an account.
create or replace function public.guard_signup() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.approved_emails where email = lower(new.email)) then
    raise exception 'This email has not been given access.';
  end if;
  return new;
end $$;

create or replace function public.handle_new_admin() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.admins (user_id, email) values (new.id, lower(new.email))
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger guard_signup before insert on auth.users
  for each row execute function public.guard_signup();
create trigger handle_new_admin after insert on auth.users
  for each row execute function public.handle_new_admin();

-- ───────────────────────── data ─────────────────────────

create table public.employees (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (length(btrim(name)) > 0),
  -- First day the app scores this person (not the day they joined the factory).
  counted_from      date not null default public.ist_today(),
  last_working_date date,
  created_at        timestamptz not null default now(),
  check (last_working_date is null or last_working_date >= counted_from)
);

-- Usual weekly off, dated so changing it never rewrites past months.
create table public.employee_weekly_offs (
  id          uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees (id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),  -- 0 = Sunday
  from_date   date not null,
  to_date     date,
  check (to_date is null or to_date >= from_date),
  unique (employee_id, weekday, from_date)
);

-- One-date change to the usual weekly off.
create table public.day_overrides (
  employee_id uuid not null references public.employees (id) on delete cascade,
  day         date not null,
  kind        text not null check (kind in ('off', 'working')),
  primary key (employee_id, day)
);

-- Company-wide.
create table public.holidays (
  day  date primary key,
  name text
);

-- One record per employee per day. Absent row = nothing recorded.
create table public.day_records (
  employee_id    uuid not null references public.employees (id) on delete cascade,
  day            date not null,
  leave          boolean not null default false,
  arrival_minute smallint check (arrival_minute between 0 and 1439),
  notice_minute  smallint check (notice_minute between 0 and 1439),
  updated_at     timestamptz not null default now(),
  updated_by     uuid references auth.users (id) on delete set null,
  primary key (employee_id, day),
  -- B1.17 #1: a day is "arrived" or "leave", never both.
  check (not (leave and arrival_minute is not null))
);
create index day_records_day_idx on public.day_records (day);

-- Single row of Admin-editable values (B2.16). Band edges are code, not data.
create table public.point_values (
  id            boolean primary key default true check (id),
  base          numeric(6, 2) not null default 5    check (base > 0),
  on_time       numeric(6, 2) not null default 6    check (on_time >= 0),
  band_931_934  numeric(6, 2) not null default 4.5  check (band_931_934 >= 0),
  band_935_940  numeric(6, 2) not null default 2    check (band_935_940 >= 0),
  after_940     numeric(6, 2) not null default 0    check (after_940 >= 0),
  leave         numeric(6, 2) not null default 0    check (leave >= 0),
  notice_by_930 numeric(6, 2) not null default 1.5  check (notice_by_930 >= 0),
  notice_late   numeric(6, 2) not null default 1    check (notice_late >= 0),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null
);
insert into public.point_values default values;

-- A month exists once it is closed (open = no row). Filled in Checkpoint 3.
create table public.months (
  month               date primary key check (month = date_trunc('month', month)::date),
  status              text not null default 'open' check (status in ('open', 'closed')),
  closed_at           timestamptz,
  closed_by           uuid references auth.users (id) on delete set null,
  saved_point_values  jsonb,
  saved_results       jsonb
);

-- Append-only history: what changed, from what, to what, when, and who.
create table public.change_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  by_user     uuid,
  by_email    text,
  entity      text not null,
  entity_key  text,
  employee_id uuid,
  day         date,
  field       text not null,
  old_value   text,
  new_value   text
);
create index change_log_emp_day_idx on public.change_log (employee_id, day);
create index change_log_at_idx on public.change_log (at desc);

-- ───────────────────────── triggers ─────────────────────────

create or replace function public.log_change(
  p_entity text, p_key text, p_emp uuid, p_day date,
  p_field text, p_old text, p_new text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_old is not distinct from p_new then return; end if;
  insert into public.change_log (by_user, by_email, entity, entity_key, employee_id, day, field, old_value, new_value)
  values (auth.uid(), nullif(auth.jwt() ->> 'email', ''), p_entity, p_key, p_emp, p_day, p_field, p_old, p_new);
end $$;
revoke execute on function public.log_change(text, text, uuid, date, text, text, text) from public, anon, authenticated;

-- Generic field-by-field history for every data table.
create or replace function public.trg_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o   jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  n   jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  k   text;
  emp uuid;
  d   date;
  key text;
begin
  emp := coalesce(n ->> 'employee_id', o ->> 'employee_id')::uuid;
  if tg_table_name = 'employees' then
    emp := coalesce(n ->> 'id', o ->> 'id')::uuid;
  end if;
  d   := coalesce(n ->> 'day', o ->> 'day')::date;
  key := coalesce(n ->> 'email', o ->> 'email');
  for k in select jsonb_object_keys(o || n) loop
    continue when k in ('updated_at', 'updated_by', 'created_at', 'added_at', 'added_by',
                        'saved_results', 'saved_point_values');
    perform public.log_change(tg_table_name, key, emp, d, k, o ->> k, n ->> k);
  end loop;
  return coalesce(new, old);
end $$;

create trigger log_employees          after insert or update or delete on public.employees           for each row execute function public.trg_log();
create trigger log_weekly_offs        after insert or update or delete on public.employee_weekly_offs for each row execute function public.trg_log();
create trigger log_overrides          after insert or update or delete on public.day_overrides       for each row execute function public.trg_log();
create trigger log_holidays           after insert or update or delete on public.holidays            for each row execute function public.trg_log();
create trigger log_day_records        after insert or update or delete on public.day_records         for each row execute function public.trg_log();
create trigger log_point_values       after update                     on public.point_values        for each row execute function public.trg_log();
create trigger log_months             after insert or update or delete on public.months              for each row execute function public.trg_log();
create trigger log_approved_emails    after insert or delete           on public.approved_emails     for each row execute function public.trg_log();

-- The log can never be edited or deleted.
create or replace function public.block_log_mutation() returns trigger
language plpgsql as $$ begin raise exception 'The change log is append-only.'; end $$;
create trigger change_log_append_only before update or delete on public.change_log
  for each row execute function public.block_log_mutation();

-- Stamp who last touched a row.
create or replace function public.trg_stamp() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
create trigger stamp_day_records  before insert or update on public.day_records  for each row execute function public.trg_stamp();
create trigger stamp_point_values before update          on public.point_values for each row execute function public.trg_stamp();

-- A closed month refuses edits to its days, holidays and overrides.
create or replace function public.month_is_closed(d date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.months
    where month = date_trunc('month', d)::date and status = 'closed'
  );
$$;

create or replace function public.trg_guard_closed() returns trigger
language plpgsql as $$
begin
  if tg_op in ('INSERT', 'UPDATE') and public.month_is_closed(new.day) then
    raise exception 'That month is closed. Reopen it to make changes.';
  end if;
  if tg_op in ('UPDATE', 'DELETE') and public.month_is_closed(old.day) then
    raise exception 'That month is closed. Reopen it to make changes.';
  end if;
  return coalesce(new, old);
end $$;
create trigger guard_closed_day_records before insert or update or delete on public.day_records  for each row execute function public.trg_guard_closed();
create trigger guard_closed_holidays    before insert or update or delete on public.holidays     for each row execute function public.trg_guard_closed();
create trigger guard_closed_overrides   before insert or update or delete on public.day_overrides for each row execute function public.trg_guard_closed();

-- No arrival for a future date; notice must be given on the same day (B3.6 #5).
create or replace function public.trg_guard_future() returns trigger
language plpgsql as $$
begin
  if new.day > public.ist_today() then
    if new.arrival_minute is not null then
      raise exception 'Arrival cannot be recorded for a future date.';
    end if;
    if new.notice_minute is not null then
      raise exception 'Notice must be given on the same day.';
    end if;
  end if;
  return new;
end $$;
create trigger guard_future before insert or update on public.day_records
  for each row execute function public.trg_guard_future();

-- ───────────────────────── access rules ─────────────────────────

alter table public.approved_emails      enable row level security;
alter table public.admins               enable row level security;
alter table public.employees            enable row level security;
alter table public.employee_weekly_offs enable row level security;
alter table public.day_overrides        enable row level security;
alter table public.holidays             enable row level security;
alter table public.day_records          enable row level security;
alter table public.point_values         enable row level security;
alter table public.months               enable row level security;
alter table public.change_log           enable row level security;

do $$
declare t text;
begin
  foreach t in array array['approved_emails','employees','employee_weekly_offs','day_overrides',
                           'holidays','day_records','point_values','months']
  loop
    execute format(
      'create policy admin_all on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

create policy admin_read on public.admins     for select to authenticated using (public.is_admin());
create policy admin_read on public.change_log for select to authenticated using (public.is_admin());

-- Nothing is open to the public (anon) role.
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon;
-- The log is read-only for signed-in users; rows are written only by triggers.
revoke insert, update, delete on public.change_log from authenticated;
revoke insert, update, delete on public.admins     from authenticated;
-- point_values is a single row: edit only.
revoke insert, delete on public.point_values from authenticated;

-- ───────────────────────── first Admin ─────────────────────────

insert into public.approved_emails (email) values ('pranavc@gmail.com');
