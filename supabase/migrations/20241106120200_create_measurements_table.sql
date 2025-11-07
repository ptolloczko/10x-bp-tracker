-- Migration: Create measurements table
-- Purpose: Store blood pressure measurements with classification and metadata
-- Tables affected: measurements (new table)
-- Dependencies: auth.users table, bp_level enum type

-- create measurements table for storing blood pressure readings
create table measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sys smallint not null,
  dia smallint not null,
  pulse smallint not null,
  measured_at timestamptz not null,
  level bp_level not null,
  notes text,
  deleted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- ensure unique measurement per user per timestamp to prevent duplicates
  constraint unique_user_measurement_time unique (user_id, measured_at)
);

-- add table comment
comment on table measurements is 'Blood pressure measurements with classification and metadata';

-- add column comments for clarity
comment on column measurements.id is 'Unique measurement identifier';
comment on column measurements.user_id is 'Owner of the measurement';
comment on column measurements.sys is 'Systolic blood pressure in mmHg';
comment on column measurements.dia is 'Diastolic blood pressure in mmHg';
comment on column measurements.pulse is 'Pulse rate in beats per minute';
comment on column measurements.measured_at is 'When the measurement was taken (UTC)';
comment on column measurements.level is 'Blood pressure classification per ESC/ESH 2023';
comment on column measurements.notes is 'Optional user notes (max 255 chars validated app-side)';
comment on column measurements.deleted is 'Logical delete flag for audit trail';

-- create unique index for user and measurement time (already covered by constraint but explicit)
create unique index idx_measurements_user_time on measurements(user_id, measured_at);

-- create optimized index for user queries with included columns, excluding deleted records
create index idx_measurements_user_time_desc on measurements(user_id, measured_at desc) 
  include(level, sys, dia, pulse) 
  where deleted = false;

-- enable row level security
alter table measurements enable row level security;

-- create rls policy for select operations for authenticated users (exclude deleted records)
create policy measurements_select_authenticated on measurements
  for select 
  to authenticated
  using (user_id = auth.uid() and deleted = false);

-- create rls policy for select operations for anonymous users (no access)
create policy measurements_select_anon on measurements
  for select 
  to anon
  using (false);

-- create rls policy for insert operations for authenticated users
create policy measurements_insert_authenticated on measurements
  for insert 
  to authenticated
  with check (user_id = auth.uid());

-- create rls policy for insert operations for anonymous users (no access)
create policy measurements_insert_anon on measurements
  for insert 
  to anon
  with check (false);

-- create rls policy for update operations for authenticated users
create policy measurements_update_authenticated on measurements
  for update 
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- create rls policy for update operations for anonymous users (no access)
create policy measurements_update_anon on measurements
  for update 
  to anon
  using (false)
  with check (false);

-- create rls policy for delete operations for authenticated users
create policy measurements_delete_authenticated on measurements
  for delete 
  to authenticated
  using (user_id = auth.uid());

-- create rls policy for delete operations for anonymous users (no access)
create policy measurements_delete_anon on measurements
  for delete 
  to anon
  using (false);
