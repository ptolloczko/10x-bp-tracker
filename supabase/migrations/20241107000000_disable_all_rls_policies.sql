-- Migration: Disable all RLS policies
-- Purpose: Remove all RLS policies from profiles, measurements, and interpretation_logs tables
-- Tables affected: profiles, measurements, interpretation_logs
-- Note: RLS is still enabled on tables, but all policies are dropped

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

