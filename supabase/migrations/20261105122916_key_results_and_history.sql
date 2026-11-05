alter table public.goals
  add constraint goals_id_user_id_unique unique (id, user_id);

create table public.key_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  metric_type text not null check (metric_type in ('numeric', 'boolean')),
  direction text,
  start_value double precision,
  target_value double precision,
  unit text check (unit is null or char_length(unit) <= 30),
  weight double precision not null default 1 check (weight > 0 and weight <= 1000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint key_results_id_user_id_unique unique (id, user_id),
  constraint key_results_goal_owner_fkey
    foreign key (goal_id, user_id) references public.goals (id, user_id) on delete cascade,
  constraint key_results_metric_shape_check check (
    (metric_type = 'numeric'
      and direction in ('increase', 'decrease')
      and start_value is not null
      and target_value is not null
      and start_value <> target_value)
    or
    (metric_type = 'boolean'
      and direction is null
      and start_value is null
      and target_value is null
      and unit is null)
  )
);

create index key_results_user_goal_sort_idx
  on public.key_results (user_id, goal_id, sort_order, created_at);

create table public.key_result_updates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key_result_id uuid not null,
  numeric_value double precision,
  boolean_value boolean,
  note text check (note is null or char_length(note) <= 1000),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint key_result_updates_parent_owner_fkey
    foreign key (key_result_id, user_id) references public.key_results (id, user_id) on delete cascade,
  constraint key_result_updates_one_value_check check (
    (numeric_value is not null and boolean_value is null)
    or (numeric_value is null and boolean_value is not null)
  )
);

create index key_result_updates_history_idx
  on public.key_result_updates (user_id, key_result_id, recorded_at desc, created_at desc);

alter table public.key_results enable row level security;
alter table public.key_result_updates enable row level security;

revoke all on table public.key_results, public.key_result_updates from anon, authenticated;
grant select, insert, update, delete on public.key_results, public.key_result_updates to authenticated;

create policy key_results_select_own on public.key_results
  for select to authenticated using ((select auth.uid()) = user_id);
create policy key_results_insert_own on public.key_results
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy key_results_update_own on public.key_results
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy key_results_delete_own on public.key_results
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy key_result_updates_select_own on public.key_result_updates
  for select to authenticated using ((select auth.uid()) = user_id);
create policy key_result_updates_insert_own on public.key_result_updates
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy key_result_updates_delete_own on public.key_result_updates
  for delete to authenticated using ((select auth.uid()) = user_id);

create function public.validate_key_result_update_value()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  expected_type text;
begin
  select metric_type into expected_type
    from public.key_results
    where id = new.key_result_id and user_id = new.user_id;

  if expected_type = 'numeric' and (new.numeric_value is null or new.boolean_value is not null) then
    raise exception 'A numeric key result requires a numeric value.' using errcode = '23514';
  elsif expected_type = 'boolean' and (new.numeric_value is not null or new.boolean_value is null) then
    raise exception 'A boolean key result requires a boolean value.' using errcode = '23514';
  elsif expected_type is null then
    raise exception 'Key result not found for this user.' using errcode = '23503';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_key_result_update_value() from public, anon, authenticated;

create trigger validate_key_result_update_value_before_write
  before insert or update on public.key_result_updates
  for each row execute function public.validate_key_result_update_value();

create function public.set_key_result_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_key_result_updated_at() from public, anon, authenticated;

create trigger set_key_result_updated_at_before_write
  before update on public.key_results
  for each row execute function public.set_key_result_updated_at();
