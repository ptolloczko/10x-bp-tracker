-- Migration: Create interpretation_logs table
-- Purpose: Audit log for measurement interpretations and classifications
-- Tables affected: interpretation_logs (new table)
-- Dependencies: auth.users table, measurements table, bp_level enum type

-- create interpretation_logs table for audit trail of measurement classifications
create table interpretation_logs (
  id uuid primary key default gen_random_uuid(),
  measurement_id uuid not null references measurements(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sys smallint not null,
  dia smallint not null,
  pulse smallint not null,
  level bp_level not null,
  notes text,
  created_at timestamptz not null default now()
);

-- add table comment
comment on table interpretation_logs is 'Audit log for measurement interpretations and classifications';

-- add column comments for clarity
comment on column interpretation_logs.id is 'Unique log entry identifier';
comment on column interpretation_logs.measurement_id is 'Reference to the source measurement';
comment on column interpretation_logs.user_id is 'Redundant user reference for RLS and indexing optimization';
comment on column interpretation_logs.sys is 'Copied systolic value from measurement';
comment on column interpretation_logs.dia is 'Copied diastolic value from measurement';
comment on column interpretation_logs.pulse is 'Copied pulse value from measurement';
comment on column interpretation_logs.level is 'Resulting blood pressure classification';
comment on column interpretation_logs.notes is 'Copied notes from measurement';
comment on column interpretation_logs.created_at is 'When this log entry was created';

-- create index for measurement lookups
create index idx_logs_measurement on interpretation_logs(measurement_id);

-- create index for user-based queries ordered by creation time (most recent first)
create index idx_logs_user_created_desc on interpretation_logs(user_id, created_at desc);

-- enable row level security
alter table interpretation_logs enable row level security;

-- create rls policy for select operations for authenticated users
create policy logs_select_authenticated on interpretation_logs
  for select 
  to authenticated
  using (user_id = auth.uid());

-- create rls policy for select operations for anonymous users (no access)
create policy logs_select_anon on interpretation_logs
  for select 
  to anon
  using (false);

-- create rls policy for insert operations for authenticated users
create policy logs_insert_authenticated on interpretation_logs
  for insert 
  to authenticated
  with check (user_id = auth.uid());

-- create rls policy for insert operations for anonymous users (no access)
create policy logs_insert_anon on interpretation_logs
  for insert 
  to anon
  with check (false);

-- create rls policy for update operations for authenticated users
create policy logs_update_authenticated on interpretation_logs
  for update 
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- create rls policy for update operations for anonymous users (no access)
create policy logs_update_anon on interpretation_logs
  for update 
  to anon
  using (false)
  with check (false);

-- create rls policy for delete operations for authenticated users
create policy logs_delete_authenticated on interpretation_logs
  for delete 
  to authenticated
  using (user_id = auth.uid());

-- create rls policy for delete operations for anonymous users (no access)
create policy logs_delete_anon on interpretation_logs
  for delete 
  to anon
  using (false);
