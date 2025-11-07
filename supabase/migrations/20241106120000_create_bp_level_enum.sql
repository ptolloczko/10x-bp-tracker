-- Migration: Create bp_level enum type
-- Purpose: Define blood pressure classification levels according to ESC/ESH 2023 guidelines
-- Tables affected: measurements, interpretation_logs
-- Dependencies: None

-- create the bp_level enum type for blood pressure classification
create type bp_level as enum (
  'optimal',
  'normal', 
  'high_normal',
  'grade1',
  'grade2',
  'grade3',
  'hypertensive_crisis'
);

-- add comment to document the enum values and their medical significance
comment on type bp_level is 'Blood pressure classification levels based on ESC/ESH 2023 guidelines';
