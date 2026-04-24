-- ============================================================
-- Migration: 00036_add_case_status_values.sql
--
-- Adds 6 new values to the case_status enum:
--   withdrawn      — plaintiff/lawyer withdraws the case
--   stayed         — higher court stay order; proceedings paused
--   remanded       — appellate court sends case back for retrial
--   appeal_filed   — party files appeal after closure
--   under_execution — decree enforcement in progress
--   satisfied      — decree fully executed (terminal)
-- ============================================================

ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'withdrawn';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'stayed';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'remanded';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'appeal_filed';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'under_execution';
ALTER TYPE public.case_status ADD VALUE IF NOT EXISTS 'satisfied';
