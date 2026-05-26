-- One-off repair after failed db push (run before re-pushing migrations)
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user() cascade;
drop table if exists public.users cascade;
drop type if exists public.account_status cascade;
