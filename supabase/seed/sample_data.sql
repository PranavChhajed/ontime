-- Four sample employees with about five weeks of attendance. Safe to run twice.
do $$
declare
  today   date := public.ist_today();
  start_d date := (date_trunc('month', public.ist_today()) - interval '1 month')::date;
begin
  if exists (select 1 from public.employees where name like 'Sample %') then
    raise notice 'sample data already present';
    return;
  end if;

  create temp table tmp_emp (id uuid, name text, leave_pct int, on_pct int, b2_pct int, b3_pct int) on commit drop;

  with p(name, leave_pct, on_pct, b2_pct, b3_pct) as (
    values ('Sample Raja', 0, 85, 5, 5),
           ('Sample Meena', 8, 70, 8, 7),
           ('Sample Suresh', 4, 45, 12, 20),
           ('Sample Anil', 3, 88, 5, 2)
  ),
  ins as (
    insert into public.employees (name, counted_from)
    select name, start_d from p
    returning id, name
  )
  insert into tmp_emp
  select ins.id, ins.name, p.leave_pct, p.on_pct, p.b2_pct, p.b3_pct from ins join p using (name);

  insert into public.employee_weekly_offs (employee_id, weekday, from_date)
  select id, 0, start_d from tmp_emp;

  insert into public.holidays (day, name) values (start_d + 16, 'Sample holiday');

  insert into public.day_records (employee_id, day, leave, arrival_minute, notice_minute)
  select id, d, cat = 'lv',
         case when cat = 'lv' then null else arr end,
         case when cat in ('lv', 'on', 'b2') then null
              when r3 < 35 then null
              when r3 < 70 then greatest(571, arr - 2 - (r2 % 6))
              else 520 + (r3 % 50) end
  from (
    select id, d, cat, r2, r3,
           case cat when 'on' then 540 + r2 % 30
                    when 'b2' then 571 + r2 % 4
                    when 'b3' then 575 + r2 % 6
                    else 581 + r2 % 40 end as arr
    from (
      select t.id, g.d, r.r2, r.r3,
             case when r.r1 < t.leave_pct then 'lv'
                  when r.r1 < t.leave_pct + t.on_pct then 'on'
                  when r.r1 < t.leave_pct + t.on_pct + t.b2_pct then 'b2'
                  when r.r1 < t.leave_pct + t.on_pct + t.b2_pct + t.b3_pct then 'b3'
                  else 'af' end as cat
      from tmp_emp t
      cross join lateral (select gs::date as d from generate_series(start_d::timestamp, (today - 1)::timestamp, interval '1 day') gs) g
      cross join lateral (
        select (('x' || substr(md5(t.name || g.d::text || '1'), 1, 6))::bit(24)::int % 100) as r1,
               (('x' || substr(md5(t.name || g.d::text || '2'), 1, 6))::bit(24)::int % 100) as r2,
               (('x' || substr(md5(t.name || g.d::text || '3'), 1, 6))::bit(24)::int % 100) as r3
      ) r
      where extract(dow from g.d) <> 0
        and g.d <> start_d + 16
        and not (t.name = 'Sample Anil' and g.d >= today - 3)
    ) a
  ) b;

  -- Today: a few recorded so the Today screen has something in every state.
  if extract(dow from today) <> 0 then
    insert into public.day_records (employee_id, day, leave, arrival_minute, notice_minute)
    select id, today, false, 552, null from tmp_emp where name = 'Sample Raja';
    insert into public.day_records (employee_id, day, leave, arrival_minute, notice_minute)
    select id, today, false, null, 562 from tmp_emp where name = 'Sample Anil';
    insert into public.day_records (employee_id, day, leave, arrival_minute, notice_minute)
    select id, today, true, null, null from tmp_emp where name = 'Sample Meena';
  end if;
end $$;
