create table public.planner_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text check (description is null or char_length(description) <= 2000),
  goal_id uuid,
  due_date date not null,
  start_at timestamptz,
  end_at timestamptz,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planner_tasks_time_range_check check (
    start_at is null or end_at is null or end_at > start_at
  ),
  constraint planner_tasks_goal_owner_fkey
    foreign key (goal_id, user_id)
    references public.goals (id, user_id)
    on delete set null (goal_id)
);

create index planner_tasks_user_date_idx
  on public.planner_tasks (user_id, due_date, start_at, sort_order);

create index planner_tasks_goal_owner_idx
  on public.planner_tasks (goal_id, user_id)
  where goal_id is not null;

alter table public.planner_tasks enable row level security;

revoke all on table public.planner_tasks from anon, authenticated;
grant select, insert, update, delete on public.planner_tasks to authenticated;

create policy planner_tasks_select_own
  on public.planner_tasks for select to authenticated
  using ((select auth.uid()) = user_id);

create policy planner_tasks_insert_own
  on public.planner_tasks for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy planner_tasks_update_own
  on public.planner_tasks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy planner_tasks_delete_own
  on public.planner_tasks for delete to authenticated
  using ((select auth.uid()) = user_id);

create function public.set_planner_task_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_planner_task_updated_at() from public, anon, authenticated;

create trigger set_planner_task_updated_at_before_update
  before update on public.planner_tasks
  for each row execute function public.set_planner_task_updated_at();
