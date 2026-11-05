create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  category text check (category is null or char_length(category) <= 60),
  status text not null default 'active' check (status in ('active', 'completed')),
  start_date date,
  due_date date,
  sort_order integer not null default 0,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_due_date_after_start_date
    check (start_date is null or due_date is null or due_date >= start_date)
);

create index goals_user_status_sort_idx
  on public.goals (user_id, status, sort_order, created_at desc);

alter table public.goals enable row level security;

revoke all on table public.goals from anon, authenticated;
grant select, insert, update, delete on public.goals to authenticated;

create policy goals_select_own
  on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);

create policy goals_insert_own
  on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy goals_update_own
  on public.goals for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy goals_delete_own
  on public.goals for delete to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_goal_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    new.completed_at := now();
  elsif new.status = 'active' then
    new.completed_at := null;
  elsif tg_op = 'UPDATE' then
    new.completed_at := old.completed_at;
  end if;

  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.set_goal_timestamps() from public, anon, authenticated;

create trigger set_goal_timestamps_before_write
  before insert or update on public.goals
  for each row execute function public.set_goal_timestamps();
