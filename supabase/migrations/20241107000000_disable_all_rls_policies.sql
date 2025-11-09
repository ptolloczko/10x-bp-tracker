-- Migration: Disable RLS for development
-- Purpose: Disable RLS entirely on profiles, measurements, and interpretation_logs tables
-- Tables affected: profiles, measurements, interpretation_logs
-- Note: This is for development only. In production, RLS should be enabled with proper policies.

-- Drop all policies from profiles table
drop policy if exists profiles_select_authenticated on profiles;
drop policy if exists profiles_select_anon on profiles;
drop policy if exists profiles_insert_authenticated on profiles;
drop policy if exists profiles_insert_anon on profiles;
drop policy if exists profiles_update_authenticated on profiles;
drop policy if exists profiles_update_anon on profiles;
drop policy if exists profiles_delete_authenticated on profiles;
drop policy if exists profiles_delete_anon on profiles;

-- Drop all policies from measurements table
drop policy if exists measurements_select_authenticated on measurements;
drop policy if exists measurements_select_anon on measurements;
drop policy if exists measurements_insert_authenticated on measurements;
drop policy if exists measurements_insert_anon on measurements;
drop policy if exists measurements_update_authenticated on measurements;
drop policy if exists measurements_update_anon on measurements;
drop policy if exists measurements_delete_authenticated on measurements;
drop policy if exists measurements_delete_anon on measurements;

-- Drop all policies from interpretation_logs table
drop policy if exists logs_select_authenticated on interpretation_logs;
drop policy if exists logs_select_anon on interpretation_logs;
drop policy if exists logs_insert_authenticated on interpretation_logs;
drop policy if exists logs_insert_anon on interpretation_logs;
drop policy if exists logs_update_authenticated on interpretation_logs;
drop policy if exists logs_update_anon on interpretation_logs;
drop policy if exists logs_delete_authenticated on interpretation_logs;
drop policy if exists logs_delete_anon on interpretation_logs;

-- Disable RLS on all tables (development only)
alter table profiles disable row level security;
alter table measurements disable row level security;
alter table interpretation_logs disable row level security;

