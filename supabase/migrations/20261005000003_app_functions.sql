-- Server time, so "Now" never depends on the phone's clock (C3.8 #6).
create or replace function public.server_time() returns timestamptz
language sql stable set search_path = '' as $$ select now() $$;
revoke execute on function public.server_time() from public, anon;
grant  execute on function public.server_time() to authenticated;

-- Add or edit an employee and their usual weekly off in one step.
-- Runs as the caller, so access rules and history triggers all apply.
create or replace function public.save_employee(
  p_id uuid,
  p_name text,
  p_counted_from date,
  p_last_working date,
  p_weekdays smallint[],
  p_from date
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := p_id;
  v_days smallint[] := coalesce(p_weekdays, '{}');
  wd smallint;
begin
  if v_id is null then
    insert into public.employees (name, counted_from, last_working_date)
    values (btrim(p_name), p_counted_from, p_last_working)
    returning id into v_id;
    foreach wd in array v_days loop
      insert into public.employee_weekly_offs (employee_id, weekday, from_date)
      values (v_id, wd, p_counted_from);
    end loop;
  else
    update public.employees
       set name = btrim(p_name), counted_from = p_counted_from, last_working_date = p_last_working
     where id = v_id;
    -- Offs no longer wanted: drop if they never took effect, else end them the day before.
    delete from public.employee_weekly_offs
     where employee_id = v_id and to_date is null and from_date >= p_from
       and not (weekday = any (v_days));
    update public.employee_weekly_offs set to_date = p_from - 1
     where employee_id = v_id and to_date is null and from_date < p_from
       and not (weekday = any (v_days));
    foreach wd in array v_days loop
      if not exists (
        select 1 from public.employee_weekly_offs
         where employee_id = v_id and weekday = wd and to_date is null
      ) then
        insert into public.employee_weekly_offs (employee_id, weekday, from_date)
        values (v_id, wd, p_from);
      end if;
    end loop;
  end if;
  return v_id;
end $$;
revoke execute on function public.save_employee(uuid, text, date, date, smallint[], date) from public, anon;
grant  execute on function public.save_employee(uuid, text, date, date, smallint[], date) to authenticated;

-- An employee with any records can only be removed by setting a last working
-- date, never deleted (their past scores must stay explainable).
create or replace function public.trg_guard_employee_delete() returns trigger
language plpgsql set search_path = '' as $$
begin
  if exists (select 1 from public.day_records where employee_id = old.id) then
    raise exception 'This employee has records, so they cannot be deleted. Set a last working date instead.';
  end if;
  return old;
end $$;
create trigger guard_employee_delete before delete on public.employees
  for each row execute function public.trg_guard_employee_delete();
