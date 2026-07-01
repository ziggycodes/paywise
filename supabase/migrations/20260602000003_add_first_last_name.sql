-- Add first_name / last_name to public.users (keep full_name for compatibility)

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Backfill from full_name (best-effort split on first whitespace)
update public.users
set
  first_name = case
    when first_name is not null then first_name
    when full_name is null then null
    when position(' ' in btrim(full_name)) = 0 then btrim(full_name)
    else split_part(btrim(full_name), ' ', 1)
  end,
  last_name = case
    when last_name is not null then last_name
    when full_name is null then null
    when position(' ' in btrim(full_name)) = 0 then null
    else ltrim(substr(btrim(full_name), position(' ' in btrim(full_name)) + 1))
  end
where first_name is null or last_name is null;

-- Populate first/last from auth metadata at signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  fn text;
  ln text;
  computed_full text;
begin
  fn := nullif(btrim(new.raw_user_meta_data->>'first_name'), '');
  ln := nullif(btrim(new.raw_user_meta_data->>'last_name'), '');
  computed_full := nullif(btrim(coalesce(fn, '') || ' ' || coalesce(ln, '')), '');

  insert into public.users (id, email, first_name, last_name, full_name, account_status)
  values (
    new.id,
    new.email,
    fn,
    ln,
    coalesce(
      nullif(btrim(new.raw_user_meta_data->>'full_name'), ''),
      computed_full,
      nullif(btrim(new.raw_user_meta_data->>'name'), '')
    ),
    'pending_verification'
  );
  return new;
end;
$$ language plpgsql security definer;

