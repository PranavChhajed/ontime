-- Cover the foreign keys the advisor flagged.
create index if not exists approved_emails_added_by_idx on public.approved_emails (added_by);
create index if not exists day_records_updated_by_idx   on public.day_records (updated_by);
create index if not exists months_closed_by_idx         on public.months (closed_by);
create index if not exists point_values_updated_by_idx  on public.point_values (updated_by);

-- Evaluate the Admin check once per query instead of once per row.
do $$
declare t text;
begin
  foreach t in array array['approved_emails','employees','employee_weekly_offs','day_overrides',
                           'holidays','day_records','point_values','months']
  loop
    execute format(
      'alter policy admin_all on public.%I using ((select public.is_admin())) with check ((select public.is_admin()))', t);
  end loop;
end $$;
alter policy admin_read on public.admins     using ((select public.is_admin()));
alter policy admin_read on public.change_log using ((select public.is_admin()));
