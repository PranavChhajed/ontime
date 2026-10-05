-- Checkpoint 4: history lines for a month (close / reopen) now carry the month.
-- History should say what changed, not repeat who/when. Identifier columns are
-- already stored on the log row (employee_id, day, entity_key), and empty or
-- default values on create/delete add nothing. A create or delete that would
-- log nothing is still recorded as "(record) added / removed".
create or replace function public.trg_log() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  o   jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else '{}'::jsonb end;
  n   jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else '{}'::jsonb end;
  k   text;
  emp uuid;
  d   date;
  key text;
  logged int := 0;
begin
  emp := coalesce(n ->> 'employee_id', o ->> 'employee_id')::uuid;
  if tg_table_name = 'employees' then
    emp := coalesce(n ->> 'id', o ->> 'id')::uuid;
  end if;
  -- A month row has no day column: its month is its date, so history can name it.
  d   := coalesce(n ->> 'day', o ->> 'day', n ->> 'month', o ->> 'month')::date;
  key := coalesce(n ->> 'email', o ->> 'email');

  for k in select jsonb_object_keys(o || n) loop
    continue when k in ('id', 'employee_id', 'day', 'email',
                        'updated_at', 'updated_by', 'created_at', 'added_at', 'added_by',
                        'saved_results', 'saved_point_values');
    if tg_op = 'INSERT' and (n ->> k is null or n ->> k = 'false') then continue; end if;
    if tg_op = 'DELETE' and (o ->> k is null or o ->> k = 'false') then continue; end if;
    if o ->> k is distinct from n ->> k then
      perform public.log_change(tg_table_name, key, emp, d, k, o ->> k, n ->> k);
      logged := logged + 1;
    end if;
  end loop;

  if logged = 0 and tg_op = 'INSERT' then
    perform public.log_change(tg_table_name, key, emp, d, '(record)', null, 'added');
  elsif logged = 0 and tg_op = 'DELETE' then
    perform public.log_change(tg_table_name, key, emp, d, '(record)', 'removed', null);
  end if;
  return coalesce(new, old);
end $$;
revoke execute on function public.trg_log() from public, anon, authenticated;
