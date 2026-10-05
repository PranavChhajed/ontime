-- Employee enrollment number: typed in by hand for now; a biometric device may fill it later.
-- Optional. When given it must be unique among employees (ignoring case and spaces at the ends).
alter table public.employees add column enrollment_no text;
alter table public.employees
  add constraint employees_enrollment_no_nonblank check (enrollment_no is null or length(btrim(enrollment_no)) > 0);
create unique index employees_enrollment_no_key on public.employees (lower(btrim(enrollment_no)))
  where enrollment_no is not null;

-- save_employee gains one optional last argument. Same behaviour otherwise.
drop function public.save_employee(uuid, text, date, date, smallint[], date);
create or replace function public.save_employee(
  p_id uuid,
  p_name text,
  p_counted_from date,
  p_last_working date,
  p_weekdays smallint[],
  p_from date,
  p_enrollment text default null
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid := p_id;
  v_days smallint[] := coalesce(p_weekdays, '{}');
  v_enrol text := nullif(btrim(coalesce(p_enrollment, '')), '');
  wd smallint;
begin
  if v_enrol is not null and exists (
    select 1 from public.employees
     where lower(btrim(enrollment_no)) = lower(v_enrol) and id is distinct from v_id
  ) then
    raise exception 'Another employee already has enrollment number %.', v_enrol;
  end if;

  if v_id is null then
    insert into public.employees (name, counted_from, last_working_date, enrollment_no)
    values (btrim(p_name), p_counted_from, p_last_working, v_enrol)
    returning id into v_id;
    foreach wd in array v_days loop
      insert into public.employee_weekly_offs (employee_id, weekday, from_date)
      values (v_id, wd, p_counted_from);
    end loop;
  else
    update public.employees
       set name = btrim(p_name), counted_from = p_counted_from, last_working_date = p_last_working,
           enrollment_no = v_enrol
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
revoke execute on function public.save_employee(uuid, text, date, date, smallint[], date, text) from public, anon;
grant  execute on function public.save_employee(uuid, text, date, date, smallint[], date, text) to authenticated;
