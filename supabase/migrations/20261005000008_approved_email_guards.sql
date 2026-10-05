-- Checkpoint 4: Admins manage the approved list themselves, so the database must stop
-- the two ways that could lock everyone out: removing your own access, and removing
-- the last approved email. Runs for every delete, whoever or whatever sends it.
create or replace function public.trg_guard_approved_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and old.email = lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'You cannot remove your own access. Ask another Admin to do it.';
  end if;
  if (select count(*) from public.approved_emails) <= 1 then
    raise exception 'At least one approved email must remain.';
  end if;
  return old;
end $$;

create trigger guard_approved_delete before delete on public.approved_emails
  for each row execute function public.trg_guard_approved_delete();

-- The usual rule for a new email: lower case, one @, something either side, no spaces.
alter table public.approved_emails
  add constraint approved_emails_shape check (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
