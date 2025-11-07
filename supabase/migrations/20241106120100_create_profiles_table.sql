-- Migration: Create profiles table
-- Purpose: Store user profile information including personal details and preferences
-- Tables affected: profiles (new table)
-- Dependencies: Supabase auth.users table

-- create profiles table with one-to-one relationship to auth.users
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  dob date,
  sex text check (sex in ('male', 'female', 'other')),
  weight numeric(5,1) check (weight > 0),
  phone text,
  timezone text not null default 'UTC',
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- add table comment
comment on table profiles is 'User profile information and preferences';

-- add column comments for clarity
comment on column profiles.user_id is 'One-to-one link to auth.users table';
comment on column profiles.first_name is 'Optional given name';
comment on column profiles.last_name is 'Optional family name';
comment on column profiles.dob is 'Date of birth';
comment on column profiles.sex is 'Biological sex or self-identification';
comment on column profiles.weight is 'Weight in kilograms';
comment on column profiles.phone is 'E.164 formatted phone number';
comment on column profiles.timezone is 'IANA timezone identifier';
comment on column profiles.reminder_enabled is 'Email reminder preference';

-- create index for last name lookups
create index idx_profiles_last_name on profiles(last_name);

-- enable row level security
alter table profiles enable row level security;

-- create rls policy for select operations for authenticated users
create policy profiles_select_authenticated on profiles
  for select 
  to authenticated
  using (user_id = auth.uid());

-- create rls policy for select operations for anonymous users (no access)
create policy profiles_select_anon on profiles
  for select 
  to anon
  using (false);

-- create rls policy for insert operations for authenticated users
create policy profiles_insert_authenticated on profiles
  for insert 
  to authenticated
  with check (user_id = auth.uid());

-- create rls policy for insert operations for anonymous users (no access)
create policy profiles_insert_anon on profiles
  for insert 
  to anon
  with check (false);

-- create rls policy for update operations for authenticated users
create policy profiles_update_authenticated on profiles
  for update 
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- create rls policy for update operations for anonymous users (no access)
create policy profiles_update_anon on profiles
  for update 
  to anon
  using (false)
  with check (false);

-- create rls policy for delete operations for authenticated users
create policy profiles_delete_authenticated on profiles
  for delete 
  to authenticated
  using (user_id = auth.uid());

-- create rls policy for delete operations for anonymous users (no access)
create policy profiles_delete_anon on profiles
  for delete 
  to anon
  using (false);
