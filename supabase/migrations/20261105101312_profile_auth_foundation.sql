-- Minimal account profile foundation. User-owned data access is enforced by RLS.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  theme text not null default 'dark' check (theme in ('dark', 'light')),
  locale text not null default 'ru-RU',
  timezone text not null default 'Europe/Moscow',
  week_starts_on smallint not null default 1 check (week_starts_on between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "profiles_insert_own"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- New public tables are not automatically exposed by the Data API on new projects.
-- Grant only the operations required by the client profile flow; RLS still scopes rows.
grant select, insert, update on public.profiles to authenticated;
