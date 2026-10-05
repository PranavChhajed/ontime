-- Close a month: freezes its results and the point values used (C1.3 #2-3).
-- Runs as the caller, so only an approved Admin can do it. The month must have ended.
-- A re-close after a reopen keeps the point values saved at the FIRST close.
create or replace function public.close_month(p_month date, p_results jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  m date := date_trunc('month', p_month)::date;
begin
  if public.ist_today() <= (m + interval '1 month' - interval '1 day')::date then
    raise exception 'This month has not ended yet, so it cannot be closed.';
  end if;

  insert into public.months (month, status, closed_at, closed_by, saved_point_values, saved_results)
  values (
    m, 'closed', now(), auth.uid(),
    (select to_jsonb(p) - 'id' - 'updated_at' - 'updated_by' from public.point_values p),
    p_results
  )
  on conflict (month) do update
    set status = 'closed',
        closed_at = now(),
        closed_by = auth.uid(),
        saved_results = excluded.saved_results,
        saved_point_values = coalesce(public.months.saved_point_values, excluded.saved_point_values);
end $$;

-- Reopen a closed month so records can be corrected. It stays frozen on its
-- saved point values; re-closing saves fresh results.
create or replace function public.reopen_month(p_month date) returns void
language plpgsql security invoker set search_path = '' as $$
begin
  update public.months
     set status = 'open', closed_at = null, closed_by = null
   where month = date_trunc('month', p_month)::date and status = 'closed';
  if not found then
    raise exception 'That month is not closed.';
  end if;
end $$;

revoke execute on function public.close_month(date, jsonb) from public, anon;
revoke execute on function public.reopen_month(date) from public, anon;
grant  execute on function public.close_month(date, jsonb) to authenticated;
grant  execute on function public.reopen_month(date) to authenticated;
