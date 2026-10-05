-- Trigger-only and internal functions are not callable from the API at all.
revoke execute on function public.guard_signup()      from public, anon, authenticated;
revoke execute on function public.handle_new_admin()  from public, anon, authenticated;
revoke execute on function public.trg_log()           from public, anon, authenticated;

-- Helpers that row-level policies and triggers call as the signed-in user:
-- signed-in only, never anonymous. (The linter still notes these two; that is
-- intended, they only return a yes/no.)
revoke execute on function public.is_admin()          from public, anon;
revoke execute on function public.month_is_closed(date) from public, anon;
grant  execute on function public.is_admin()          to authenticated;
grant  execute on function public.month_is_closed(date) to authenticated;

-- Fixed search path on every function.
alter function public.ist_today()            set search_path = '';
alter function public.trg_stamp()            set search_path = '';
alter function public.trg_guard_closed()     set search_path = '';
alter function public.trg_guard_future()     set search_path = '';
alter function public.block_log_mutation()   set search_path = '';
