-- Create a private profile automatically for every newly registered auth user.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();
