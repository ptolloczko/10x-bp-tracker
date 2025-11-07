-- Migration: Create updated_at triggers
-- Purpose: Automatically maintain updated_at timestamps on profiles and measurements tables
-- Tables affected: profiles, measurements
-- Dependencies: profiles table, measurements table

-- create a generic function to update the updated_at column
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- add comment to the function
comment on function update_updated_at_column() is 'Generic trigger function to update updated_at timestamp';

-- create trigger for profiles table to automatically update updated_at on row changes
create trigger trigger_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- add comment to the trigger
comment on trigger trigger_profiles_updated_at on profiles is 'Automatically updates updated_at timestamp when profile is modified';

-- create trigger for measurements table to automatically update updated_at on row changes
create trigger trigger_measurements_updated_at
  before update on measurements
  for each row
  execute function update_updated_at_column();

-- add comment to the trigger
comment on trigger trigger_measurements_updated_at on measurements is 'Automatically updates updated_at timestamp when measurement is modified';
