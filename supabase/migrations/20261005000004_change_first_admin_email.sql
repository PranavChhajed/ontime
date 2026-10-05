-- The owner changed the first Admin email.
insert into public.approved_emails (email) values ('pranavc8482@gmail.com') on conflict do nothing;
delete from public.approved_emails where email = 'pranavc@gmail.com';
-- Remove the old, never-confirmed, never-used sign-up so it cannot linger.
delete from auth.users
 where email = 'pranavc@gmail.com' and email_confirmed_at is null and last_sign_in_at is null;
