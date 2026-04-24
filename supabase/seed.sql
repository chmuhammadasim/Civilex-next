-- Civilex Demo Seed Data
-- Run this in the Supabase SQL Editor AFTER schema.sql and all migrations are applied.
-- This script is idempotent — safe to run multiple times.
--
-- Demo credentials (all passwords: demo123456):
--   client1@civilex.pk      → Client      (Ahmad Khan / plaintiff)
--   client2@civilex.pk      → Client      (Fatima Bibi / defendant)
--   lawyer1@civilex.pk      → Lawyer      (Barrister Ali Raza)
--   lawyer2@civilex.pk      → Lawyer      (Advocate Ayesha Malik)
--   admin@civilex.pk        → Admin Court (Registrar Mahmood Ahmed)
--   magistrate@civilex.pk   → Magistrate  (Magistrate Hassan Ali)
--   judge@civilex.pk        → Trial Judge (Justice Saeed Akhtar)
--   steno@civilex.pk        → Steno       (Muhammad Usman)

-- ============================================================
-- STEP 1: Create Auth Users
-- Inserts into auth.users which triggers handle_new_user()
-- to auto-create public.profiles rows.
-- ============================================================

DO $$
DECLARE
  pwd TEXT := crypt('demo123456', gen_salt('bf'));
BEGIN

  -- client1: Ahmad Khan
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    '71e6fed4-9b07-43c8-a94d-e1adfc2989a4'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client1@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"client","full_name":"Ahmad Khan"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '71e6fed4-9b07-43c8-a94d-e1adfc2989a4');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
    'client1@civilex.pk', 'email',
    '{"sub":"71e6fed4-9b07-43c8-a94d-e1adfc2989a4","email":"client1@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'client1@civilex.pk' AND provider = 'email');

  -- client2: Fatima Bibi
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'a2b3c4d5-e6f7-4890-abcd-ef1234567891'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client2@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"client","full_name":"Fatima Bibi"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'a2b3c4d5-e6f7-4890-abcd-ef1234567891');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
    'client2@civilex.pk', 'email',
    '{"sub":"a2b3c4d5-e6f7-4890-abcd-ef1234567891","email":"client2@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'client2@civilex.pk' AND provider = 'email');

  -- lawyer1: Barrister Ali Raza
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    '3586008a-7dd7-414a-87f2-88479132461c'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'lawyer1@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"lawyer","full_name":"Barrister Ali Raza"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '3586008a-7dd7-414a-87f2-88479132461c');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), '3586008a-7dd7-414a-87f2-88479132461c',
    'lawyer1@civilex.pk', 'email',
    '{"sub":"3586008a-7dd7-414a-87f2-88479132461c","email":"lawyer1@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'lawyer1@civilex.pk' AND provider = 'email');

  -- lawyer2: Advocate Ayesha Malik
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    '1e1e6011-e4ab-446c-8592-a4dbb4168810'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'lawyer2@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"lawyer","full_name":"Advocate Ayesha Malik"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '1e1e6011-e4ab-446c-8592-a4dbb4168810');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), '1e1e6011-e4ab-446c-8592-a4dbb4168810',
    'lawyer2@civilex.pk', 'email',
    '{"sub":"1e1e6011-e4ab-446c-8592-a4dbb4168810","email":"lawyer2@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'lawyer2@civilex.pk' AND provider = 'email');

  -- admin: Registrar Mahmood Ahmed
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    '475b9f5e-d054-41e7-843e-544afb0b3803'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin_court","full_name":"Registrar Mahmood Ahmed"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '475b9f5e-d054-41e7-843e-544afb0b3803');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), '475b9f5e-d054-41e7-843e-544afb0b3803',
    'admin@civilex.pk', 'email',
    '{"sub":"475b9f5e-d054-41e7-843e-544afb0b3803","email":"admin@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'admin@civilex.pk' AND provider = 'email');

  -- magistrate: Magistrate Hassan Ali
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    '922321fd-8d39-4d06-b707-d011307f9a97'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'magistrate@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"magistrate","full_name":"Magistrate Hassan Ali"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '922321fd-8d39-4d06-b707-d011307f9a97');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), '922321fd-8d39-4d06-b707-d011307f9a97',
    'magistrate@civilex.pk', 'email',
    '{"sub":"922321fd-8d39-4d06-b707-d011307f9a97","email":"magistrate@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'magistrate@civilex.pk' AND provider = 'email');

  -- judge: Justice Saeed Akhtar
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'c613a1dd-419c-4436-975c-734cfad37b0d'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'judge@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"trial_judge","full_name":"Justice Saeed Akhtar"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'c613a1dd-419c-4436-975c-734cfad37b0d');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'c613a1dd-419c-4436-975c-734cfad37b0d',
    'judge@civilex.pk', 'email',
    '{"sub":"c613a1dd-419c-4436-975c-734cfad37b0d","email":"judge@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'judge@civilex.pk' AND provider = 'email');

  -- steno: Muhammad Usman
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    '51fd1e7a-86a8-4e5e-9445-18fd947e64b7'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'steno@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"stenographer","full_name":"Muhammad Usman"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = '51fd1e7a-86a8-4e5e-9445-18fd947e64b7');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
    'steno@civilex.pk', 'email',
    '{"sub":"51fd1e7a-86a8-4e5e-9445-18fd947e64b7","email":"steno@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'steno@civilex.pk' AND provider = 'email');

END $$;

-- ============================================================
-- STEP 2: Update Profiles (created by the trigger above)
-- ============================================================

UPDATE public.profiles SET
  full_name = 'Ahmad Khan',
  phone     = '03001234567',
  cnic      = '35201-1234567-1',
  address   = '123 Model Town, Lahore',
  city      = 'Lahore'
WHERE id = '71e6fed4-9b07-43c8-a94d-e1adfc2989a4';

UPDATE public.profiles SET
  full_name = 'Fatima Bibi',
  phone     = '03009876543',
  cnic      = '35201-7654321-2',
  address   = '45 Gulberg III, Lahore',
  city      = 'Lahore'
WHERE id = 'a2b3c4d5-e6f7-4890-abcd-ef1234567891';

UPDATE public.profiles SET
  full_name = 'Barrister Ali Raza',
  phone     = '03331112233',
  cnic      = '35201-1111111-1',
  address   = 'Lawyers Chamber, District Courts',
  city      = 'Lahore'
WHERE id = '3586008a-7dd7-414a-87f2-88479132461c';

UPDATE public.profiles SET
  full_name = 'Advocate Ayesha Malik',
  phone     = '03214445566',
  cnic      = '35201-2222222-2',
  address   = 'Supreme Court Bar, Islamabad',
  city      = 'Islamabad'
WHERE id = '1e1e6011-e4ab-446c-8592-a4dbb4168810';

UPDATE public.profiles SET
  full_name = 'Registrar Mahmood Ahmed',
  phone     = '03005551122',
  address   = 'Admin Court Complex, Lahore',
  city      = 'Lahore'
WHERE id = '475b9f5e-d054-41e7-843e-544afb0b3803';

UPDATE public.profiles SET
  full_name = 'Magistrate Hassan Ali',
  phone     = '03005553344',
  address   = 'Magistrate Court, Lahore',
  city      = 'Lahore'
WHERE id = '922321fd-8d39-4d06-b707-d011307f9a97';

UPDATE public.profiles SET
  full_name = 'Justice Saeed Akhtar',
  phone     = '03005557788',
  address   = 'District & Sessions Court, Lahore',
  city      = 'Lahore'
WHERE id = 'c613a1dd-419c-4436-975c-734cfad37b0d';

UPDATE public.profiles SET
  full_name = 'Muhammad Usman (Court Writer)',
  phone     = '03005559900',
  address   = 'Court Complex, Lahore',
  city      = 'Lahore'
WHERE id = '51fd1e7a-86a8-4e5e-9445-18fd947e64b7';

-- ============================================================
-- STEP 3: Lawyer Profiles
-- ============================================================

INSERT INTO public.lawyer_profiles (id, bar_license_number, specialization, experience_years, bio, hourly_rate, rating, total_reviews, is_available, location)
VALUES (
  '3586008a-7dd7-414a-87f2-88479132461c',
  'LHR-2015-4521',
  ARRAY['Civil', 'Property', 'Family'],
  9,
  'Experienced civil lawyer with a strong track record in property and family law matters in Lahore High Court jurisdiction.',
  5000, 4.5, 28, true, 'Lahore'
) ON CONFLICT (id) DO UPDATE SET
  specialization   = EXCLUDED.specialization,
  experience_years = EXCLUDED.experience_years,
  bio              = EXCLUDED.bio;

INSERT INTO public.lawyer_profiles (id, bar_license_number, specialization, experience_years, bio, hourly_rate, rating, total_reviews, is_available, location)
VALUES (
  '1e1e6011-e4ab-446c-8592-a4dbb4168810',
  'ISB-2012-7789',
  ARRAY['Criminal', 'Constitutional', 'Cyber'],
  12,
  'Senior criminal lawyer specializing in constitutional and cyber crime cases. Former additional advocate general.',
  8000, 4.8, 45, true, 'Islamabad'
) ON CONFLICT (id) DO UPDATE SET
  specialization   = EXCLUDED.specialization,
  experience_years = EXCLUDED.experience_years,
  bio              = EXCLUDED.bio;

-- ============================================================
-- STEP 4: Sample Cases
-- ============================================================

-- Civil Case 1: Property Dispute (advanced — evidence stage)
DELETE FROM public.cases WHERE case_number = 'CIV-2026-0001' AND id != 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, defendant_id, admin_court_id, trial_judge_id, stenographer_id,
  current_phase, sensitivity, filing_date, registration_date
)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'::uuid,
  'CIV-2026-0001', 'civil', 'evidence_stage',
  'Ahmad Khan vs Fatima Bibi - Property Dispute',
  'Dispute regarding ownership of property situated at Plot No. 123, Block A, Model Town, Lahore. The plaintiff claims rightful ownership through registered sale deed dated 15-01-2024, while the defendant contests the validity of said deed.',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'c613a1dd-419c-4436-975c-734cfad37b0d',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'trial_court', 'normal', '2026-01-15', '2026-01-20'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e');

-- Criminal Case 1: Theft (registered)
DELETE FROM public.cases WHERE case_number = 'CRM-2026-0001' AND id != 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, admin_court_id,
  current_phase, sensitivity, filing_date, registration_date
)
SELECT
  'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f'::uuid,
  'CRM-2026-0001', 'criminal', 'registered',
  'State vs Unknown Accused - Theft Case',
  'FIR No. 234/2026 registered at Model Town Police Station, Lahore for theft of valuables worth PKR 5,00,000 from the complainant residence.',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'admin_court', 'normal', '2026-02-01', '2026-02-05'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f');

-- Civil Case 2: Family Matter (draft)
DELETE FROM public.cases WHERE case_number = 'CIV-2026-0002' AND id != 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, current_phase, sensitivity, filing_date
)
SELECT
  'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a'::uuid,
  'CIV-2026-0002', 'civil', 'draft',
  'Maintenance & Custody Application',
  'Application for maintenance allowance and custody rights of minor children under the Guardian and Wards Act 1890 and Family Courts Act 1964.',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  'filing', 'sensitive', '2026-02-20'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'd3e4f5a6-b7c8-4d9e-0f1a-2b3c4d5e6f7a');

-- ============================================================
-- STEP 5: Case Assignment (Lawyer 1 on Civil Case 1)
-- ============================================================

INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  '3586008a-7dd7-414a-87f2-88479132461c',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  'plaintiff',
  'accepted',
  50000,
  '2026-01-22'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id  = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
  AND   lawyer_id = '3586008a-7dd7-414a-87f2-88479132461c'
);

-- ============================================================
-- STEP 6: Sample Notifications
-- ============================================================

INSERT INTO public.notifications (user_id, title, message, type, reference_type, is_read)
SELECT user_id::uuid, title, message, type::public.notification_type, reference_type, is_read
FROM (VALUES
  ('71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'Case Filed Successfully',  'Your case CIV-2026-0001 has been filed successfully.',     'case_status_changed', 'case', true),
  ('71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'Case Registered',           'Your case has been registered by the Admin Court.',         'case_status_changed', 'case', true),
  ('71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'Hearing Scheduled',         'Next hearing for your case is scheduled.',                  'hearing_scheduled',   'case', false),
  ('3586008a-7dd7-414a-87f2-88479132461c', 'New Case Assignment',        'You have been assigned to a new case. Please review.',      'case_assigned',       'case', false),
  ('475b9f5e-d054-41e7-843e-544afb0b3803', 'New Case for Scrutiny',      'A new case has been submitted for scrutiny review.',        'case_status_changed', 'case', false),
  ('c613a1dd-419c-4436-975c-734cfad37b0d', 'Case Transferred to Court',  'A new case has been transferred to your court.',           'case_status_changed', 'case', false)
) AS v(user_id, title, message, type, reference_type, is_read)
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.user_id = v.user_id::uuid AND n.title = v.title
);

-- ============================================================
-- STEP 7: More Cases
-- ============================================================

-- Civil Case 3: Contract Dispute (arguments stage)
DELETE FROM public.cases WHERE case_number = 'CIV-2026-0003' AND id != 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, defendant_id, admin_court_id, trial_judge_id, stenographer_id,
  current_phase, sensitivity, filing_date, registration_date
)
SELECT
  'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b'::uuid,
  'CIV-2026-0003', 'civil', 'arguments',
  'Fatima Bibi vs Ahmad Khan - Breach of Contract',
  'Claim for recovery of PKR 12,00,000 arising from breach of a written construction contract dated 10-03-2025. The defendant failed to complete agreed construction work within stipulated time causing financial losses.',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'c613a1dd-419c-4436-975c-734cfad37b0d',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'trial_court', 'normal', '2025-11-10', '2025-11-18'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b');

-- Civil Case 4: Under scrutiny
DELETE FROM public.cases WHERE case_number = 'CIV-2026-0004' AND id != 'f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, admin_court_id,
  current_phase, sensitivity, filing_date
)
SELECT
  'f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c'::uuid,
  'CIV-2026-0004', 'civil', 'under_scrutiny',
  'Ahmad Khan vs City Municipal Authority - Land Acquisition',
  'Challenge to unlawful acquisition of agricultural land measuring 5 kanals by the Municipal Authority without adequate compensation under the Land Acquisition Act 1894.',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'admin_court', 'sensitive', '2026-03-01'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c');

-- Civil Case 5: Judgment delivered
DELETE FROM public.cases WHERE case_number = 'FAM-2025-0001' AND id != 'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, defendant_id, admin_court_id, trial_judge_id, stenographer_id,
  current_phase, sensitivity, filing_date, registration_date
)
SELECT
  'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d'::uuid,
  'FAM-2025-0001', 'civil', 'judgment_delivered',
  'Fatima Bibi vs Ahmad Khan - Dissolution of Marriage',
  'Petition for dissolution of marriage (Khul) under the Family Courts Act 1964. Petitioner seeks dissolution on grounds of incompatibility and cruelty. Ancillary relief including dower and maintenance claimed.',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'c613a1dd-419c-4436-975c-734cfad37b0d',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'concluded', 'sensitive', '2025-04-10', '2025-04-20'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d');

-- Criminal Case 2: Drug possession (preliminary hearing)
DELETE FROM public.cases WHERE case_number = 'CRM-2026-0002' AND id != 'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, admin_court_id,
  current_phase, sensitivity, filing_date, registration_date
)
SELECT
  'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e'::uuid,
  'CRM-2026-0002', 'criminal', 'preliminary_hearing',
  'State vs Accused - Narcotics Possession',
  'FIR No. 456/2026 registered at Cantonment Police Station for possession of 500 grams of heroin in violation of the Control of Narcotic Substances Act 1997.',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '922321fd-8d39-4d06-b707-d011307f9a97',
  'admin_court', 'highly_sensitive', '2026-01-08', '2026-01-12'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e');

-- Civil Case 6: Reserved for judgment
DELETE FROM public.cases WHERE case_number = 'CIV-2025-0099' AND id != 'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f';
INSERT INTO public.cases (
  id, case_number, case_type, status, title, description,
  plaintiff_id, defendant_id, admin_court_id, trial_judge_id, stenographer_id,
  current_phase, sensitivity, filing_date, registration_date
)
SELECT
  'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f'::uuid,
  'CIV-2025-0099', 'civil', 'reserved_for_judgment',
  'Fatima Bibi vs Bank of Punjab - Mortgage Dispute',
  'Dispute regarding enforcement of mortgage over residential property. The plaintiff contests the bank''s right to foreclose on the property alleging procedural irregularities in the notice process and miscalculation of outstanding dues.',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'c613a1dd-419c-4436-975c-734cfad37b0d',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'trial_court', 'sensitive', '2025-06-15', '2025-06-25'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f');

-- ============================================================
-- STEP 8: Criminal Case Details
-- ============================================================

INSERT INTO public.criminal_case_details (
  case_id, fir_number, police_station, offense_section, offense_description,
  io_name, bail_status
)
SELECT
  'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f',
  'FIR-234/2026', 'Model Town Police Station',
  'Sections 379/380 PPC',
  'Theft of gold jewellery, cash and electronics worth PKR 5,00,000 from residential premises.',
  'ASI Khalid Mehmood', 'not_applicable'
WHERE NOT EXISTS (
  SELECT 1 FROM public.criminal_case_details WHERE case_id = 'c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f'
);

INSERT INTO public.criminal_case_details (
  case_id, fir_number, police_station, offense_section, offense_description,
  io_name, bail_status
)
SELECT
  'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e',
  'FIR-456/2026', 'Cantonment Police Station',
  'Section 9(c) CNSA 1997',
  'Possession of 500 grams of heroin. Accused (Imran Gul s/o Abdul Gul, 12-B Gulshan Colony, Lahore Cantonment) apprehended at Cantonment area checkpost during routine search.',
  'SI Muhammad Tariq', 'denied'
WHERE NOT EXISTS (
  SELECT 1 FROM public.criminal_case_details WHERE case_id = 'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e'
);

-- ============================================================
-- STEP 9: Case Assignments
-- ============================================================

-- Lawyer 1 on Arguments case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT
  'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b',
  '3586008a-7dd7-414a-87f2-88479132461c',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  'plaintiff', 'accepted', 75000, '2025-11-20'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b'
  AND lawyer_id = '3586008a-7dd7-414a-87f2-88479132461c'
);

-- Lawyer 2 on Judgment delivered case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT
  'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d',
  '1e1e6011-e4ab-446c-8592-a4dbb4168810',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  'plaintiff', 'accepted', 120000, '2025-04-22'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d'
  AND lawyer_id = '1e1e6011-e4ab-446c-8592-a4dbb4168810'
);

-- Lawyer 1 on Reserved for judgment case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT
  'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f',
  '3586008a-7dd7-414a-87f2-88479132461c',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  'plaintiff', 'accepted', 90000, '2025-07-01'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'c8d9e0f1-a2b3-4c4d-5e6f-7a8b9c0d1e2f'
  AND lawyer_id = '3586008a-7dd7-414a-87f2-88479132461c'
);

-- ============================================================
-- STEP 10: Payments
-- ============================================================

-- Court fee for Civil Case 1 (completed)
INSERT INTO public.payments (
  id, case_id, payer_id, receiver_id, amount, payment_type, payment_method,
  status, transaction_id, description, paid_at
)
SELECT
  'aa000001-0000-4000-8000-000000000001'::uuid,
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  5000, 'court_fee', 'jazzcash', 'completed',
  'TXN-2026-CIV-0001', 'Court filing fee for CIV-2026-0001', '2026-01-18 10:30:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'aa000001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee instalment 1 of 2 for Civil Case 1 (completed)
INSERT INTO public.payments (
  id, case_id, payer_id, receiver_id, amount, payment_type, payment_method,
  status, transaction_id, is_installment, installment_number, total_installments,
  description, paid_at
)
SELECT
  'aa000002-0000-4000-8000-000000000001'::uuid,
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '3586008a-7dd7-414a-87f2-88479132461c',
  25000, 'lawyer_fee', 'easypaisa', 'completed',
  'TXN-2026-LAW-0001', true, 1, 2,
  'Lawyer fee instalment 1/2 - Barrister Ali Raza', '2026-01-24 14:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'aa000002-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee instalment 2 of 2 for Civil Case 1 (completed)
INSERT INTO public.payments (
  id, case_id, payer_id, receiver_id, amount, payment_type, payment_method,
  status, transaction_id, is_installment, installment_number, total_installments,
  parent_payment_id, description, paid_at
)
SELECT
  'aa000003-0000-4000-8000-000000000001'::uuid,
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '3586008a-7dd7-414a-87f2-88479132461c',
  25000, 'lawyer_fee', 'jazzcash', 'completed',
  'TXN-2026-LAW-0002', true, 2, 2,
  'aa000002-0000-4000-8000-000000000001'::uuid,
  'Lawyer fee instalment 2/2 - Barrister Ali Raza', '2026-02-24 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'aa000003-0000-4000-8000-000000000001'::uuid);

-- Court fee for Contract case (completed)
INSERT INTO public.payments (
  id, case_id, payer_id, receiver_id, amount, payment_type, payment_method,
  status, transaction_id, description, paid_at
)
SELECT
  'aa000004-0000-4000-8000-000000000001'::uuid,
  'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  12000, 'court_fee', 'bank_transfer', 'completed',
  'TXN-2025-CIV-0003', 'Court filing fee for CIV-2026-0003', '2025-11-15 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'aa000004-0000-4000-8000-000000000001'::uuid);

-- Pending payment for family case
INSERT INTO public.payments (
  id, case_id, payer_id, receiver_id, amount, payment_type, payment_method,
  status, description
)
SELECT
  'aa000005-0000-4000-8000-000000000001'::uuid,
  'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '1e1e6011-e4ab-446c-8592-a4dbb4168810',
  120000, 'lawyer_fee', 'jazzcash', 'pending',
  'Lawyer fee - Advocate Ayesha Malik (FAM-2025-0001)'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'aa000005-0000-4000-8000-000000000001'::uuid);

-- ============================================================
-- STEP 11: Scrutiny Checklists
-- ============================================================

-- Scrutiny for Civil Case 1 (approved)
INSERT INTO public.scrutiny_checklist (
  case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at
)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true,
  'approved',
  'All documents in order. Property sale deed duly registered. Court fee paid. Case admitted for registration.',
  '2026-01-19 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
);

-- Scrutiny for Civil Case 3 (approved)
INSERT INTO public.scrutiny_checklist (
  case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at
)
SELECT
  'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true,
  'approved',
  'Contract dispute documents verified. Written contract submitted. Court fee paid as per claim amount. Case registered.',
  '2025-11-17 10:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b'
);

-- Scrutiny for Civil Case 4 (pending/under review)
INSERT INTO public.scrutiny_checklist (
  case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks
)
SELECT
  'f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, false, false, true,
  'pending',
  'Cause of action and limitation period require further verification. Land acquisition notice copies not provided.'
WHERE NOT EXISTS (
  SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'f5a6b7c8-d9e0-4f1a-2b3c-4d5e6f7a8b9c'
);

-- ============================================================
-- STEP 12: Hearings
-- ============================================================

-- Civil Case 1 – Hearing 1 (completed, preliminary)
INSERT INTO public.hearings (
  id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks,
  next_hearing_date, status
)
SELECT
  'bb000001-0000-4000-8000-000000000001'::uuid,
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  1, 'preliminary', '2026-01-25 09:00:00', '2026-01-25 09:45:00',
  '475b9f5e-d054-41e7-843e-544afb0b3803', 'Court Room 3 – Admin Court Complex',
  'Preliminary hearing held. Parties appeared through their respective counsel. Written statement time granted to defendant. Next date fixed for written statement.',
  'Defendant to file written statement within 30 days.',
  '2026-02-25 09:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'bb000001-0000-4000-8000-000000000001'::uuid);

-- Civil Case 1 – Hearing 2 (completed, regular)
INSERT INTO public.hearings (
  id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks,
  next_hearing_date, status
)
SELECT
  'bb000002-0000-4000-8000-000000000001'::uuid,
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  2, 'regular', '2026-02-25 09:00:00', '2026-02-25 10:15:00',
  '475b9f5e-d054-41e7-843e-544afb0b3803', 'Court Room 3 – Admin Court Complex',
  'Written statement filed by defendant. Issues framed: (1) Whether plaintiff is rightful owner of the property? (2) Whether sale deed dated 15-01-2024 is valid? Case transferred to Trial Court.',
  'Issues framed. Case transferred to Trial Court for recording of evidence.',
  '2026-03-20 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'bb000002-0000-4000-8000-000000000001'::uuid);

-- Civil Case 1 – Hearing 3 (completed, evidence stage)
INSERT INTO public.hearings (
  id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks,
  next_hearing_date, status
)
SELECT
  'bb000003-0000-4000-8000-000000000001'::uuid,
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  3, 'regular', '2026-03-20 10:00:00', '2026-03-20 11:30:00',
  'c613a1dd-419c-4436-975c-734cfad37b0d', 'Trial Court Room 1 – District Courts',
  'PW-1 (Ahmad Khan, plaintiff) examined in chief. Original sale deed Exh. P-1 tendered. Photocopies of registry Exh. P-2 produced. Cross-examination deferred to next date.',
  'PW-1 examined in chief. Cross-examination on next date. Parties to ensure presence of witnesses.',
  '2026-04-10 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'bb000003-0000-4000-8000-000000000001'::uuid);

-- Civil Case 1 – Hearing 4 (scheduled, upcoming)
INSERT INTO public.hearings (
  id, case_id, hearing_number, hearing_type, scheduled_date,
  presiding_officer_id, courtroom, status
)
SELECT
  'bb000004-0000-4000-8000-000000000001'::uuid,
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  4, 'regular', '2026-04-10 10:00:00',
  'c613a1dd-419c-4436-975c-734cfad37b0d', 'Trial Court Room 1 – District Courts', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'bb000004-0000-4000-8000-000000000001'::uuid);

-- Contract Dispute – Hearing 1 (completed)
INSERT INTO public.hearings (
  id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks,
  next_hearing_date, status
)
SELECT
  'bb000005-0000-4000-8000-000000000001'::uuid,
  'e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b',
  1, 'arguments', '2026-03-15 11:00:00', '2026-03-15 12:30:00',
  'c613a1dd-419c-4436-975c-734cfad37b0d', 'Trial Court Room 1 – District Courts',
  'Arguments heard from both sides. Plaintiff counsel argued on breach and damages. Defendant counsel raised objection on liquidated damages clause. Further arguments fixed.',
  'Both sides to file written synopses by next date. Arguments to be concluded.',
  '2026-04-20 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'bb000005-0000-4000-8000-000000000001'::uuid);

-- Narcotics case – Hearing 1 (completed, bail)
INSERT INTO public.hearings (
  id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks,
  next_hearing_date, status
)
SELECT
  'bb000006-0000-4000-8000-000000000001'::uuid,
  'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e',
  1, 'bail', '2026-01-20 09:00:00', '2026-01-20 10:00:00',
  '922321fd-8d39-4d06-b707-d011307f9a97', 'Magistrate Court Room 2',
  'Bail application heard. Police opposed bail citing gravity of offence and recovery of narcotics. IO present. Challan submitted. Bail denied.',
  'Bail denied. Case is of heinous nature under Section 9(c). Accused to be kept in judicial custody.',
  '2026-02-05 09:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'bb000006-0000-4000-8000-000000000001'::uuid);

-- ============================================================
-- STEP 13: Order Sheets
-- ============================================================

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  'bb000001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Defendant is directed to file written statement within thirty (30) days. Next hearing fixed for 25-02-2026. Notice to defendant duly served.',
  '475b9f5e-d054-41e7-843e-544afb0b3803'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets
  WHERE case_id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
  AND hearing_id = 'bb000001-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  'bb000002-0000-4000-8000-000000000001'::uuid,
  'transfer',
  'Issues framed as under: (1) Whether plaintiff is rightful owner of Plot No. 123 Block-A, Model Town, Lahore? (2) Whether the registered sale deed dated 15-01-2024 is valid and binding? Both sides to produce evidence. Case transferred to Additional District Judge Court No. 1 for recording of evidence. Next date 20-03-2026.',
  '475b9f5e-d054-41e7-843e-544afb0b3803'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets
  WHERE case_id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
  AND hearing_id = 'bb000002-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT
  'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e',
  'bb000006-0000-4000-8000-000000000001'::uuid,
  'bail',
  'Bail application filed by accused Imran Gul under Section 497 Cr.P.C. is dismissed. The accused is involved in a case under Section 9(c) of the Control of Narcotic Substances Act 1997 which is a heinous offence. Recovery is established. Bail is declined and accused is sent to judicial custody. Next date for framing of charge: 05-02-2026.',
  '922321fd-8d39-4d06-b707-d011307f9a97'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets
  WHERE case_id = 'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e'
  AND hearing_id = 'bb000006-0000-4000-8000-000000000001'::uuid
);

-- ============================================================
-- STEP 14: Witnesses (Civil Case 1)
-- ============================================================

INSERT INTO public.witness_records (
  case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, statement, status, examination_date,
  added_by
)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  'Ahmad Khan', '35201-1234567-1', '03001234567',
  '123 Model Town, Lahore',
  'prosecution', 'Plaintiff / Property Owner',
  'I am the registered owner of Plot No. 123, Block A, Model Town, Lahore. I purchased this property from Mr. Farooq Ahmed vide registered sale deed dated 15-01-2024 duly registered with the Sub-Registrar Lahore. I have been in possession since date of purchase. The defendant is illegally claiming ownership.',
  'examined', '2026-03-20',
  '3586008a-7dd7-414a-87f2-88479132461c'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records
  WHERE case_id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
  AND witness_name = 'Ahmad Khan'
);

INSERT INTO public.witness_records (
  case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, status, added_by
)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  'Abdul Qadir', '35201-9988776-5', '03211234567',
  '45 Shadman Colony, Lahore',
  'prosecution', 'Witness to Sale Deed / Attesting Witness',
  'listed',
  '3586008a-7dd7-414a-87f2-88479132461c'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records
  WHERE case_id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
  AND witness_name = 'Abdul Qadir'
);

INSERT INTO public.witness_records (
  case_id, witness_name, witness_cnic, witness_contact,
  witness_side, relation_to_case, status, added_by
)
SELECT
  'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
  'Sub-Registrar (PW-3)', '35201-3344556-7', '042-99201234',
  'prosecution', 'Sub-Registrar – official witness to registration',
  'summoned',
  '3586008a-7dd7-414a-87f2-88479132461c'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records
  WHERE case_id = 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e'
  AND witness_name = 'Sub-Registrar (PW-3)'
);

-- ============================================================
-- STEP 15: Bail Application (Narcotics case)
-- ============================================================

INSERT INTO public.bail_applications (
  case_id, applicant_id, application_type, grounds, surety_details, surety_amount,
  status, decision_date, decision_remarks, decided_by,
  conditions, hearing_id
)
SELECT
  'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  'post_arrest',
  'The accused is innocent and has been falsely implicated. The recovery is planted. The accused has family dependents and poses no flight risk. The accused is a first-time offender with no prior criminal record.',
  'Muhammad Arif (brother), 14-C Gulshan Colony', 500000,
  'denied', '2026-01-20 10:00:00',
  'Bail denied. Case involves Section 9(c) CNSA which carries a minimum sentence of 7 years. Recovery is established through police witnesses and chemical examiner report.',
  '922321fd-8d39-4d06-b707-d011307f9a97',
  NULL,
  'bb000006-0000-4000-8000-000000000001'::uuid
WHERE NOT EXISTS (
  SELECT 1 FROM public.bail_applications WHERE case_id = 'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e'
);

-- ============================================================
-- STEP 16: Activity Log
-- ============================================================

INSERT INTO public.case_activity_log (case_id, actor_id, action, details)
SELECT case_id::uuid, actor_id::uuid, action, details::jsonb
FROM (VALUES
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'case_filed',         '{"new_status":"draft","note":"Case CIV-2026-0001 filed by Ahmad Khan"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'status_changed',     '{"old_status":"draft","new_status":"pending_lawyer_acceptance"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '3586008a-7dd7-414a-87f2-88479132461c', 'case_accepted',      '{"note":"Barrister Ali Raza accepted case","fee_amount":50000}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'status_changed',     '{"old_status":"payment_pending","new_status":"payment_confirmed"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '475b9f5e-d054-41e7-843e-544afb0b3803', 'status_changed',     '{"old_status":"submitted_to_admin","new_status":"under_scrutiny"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '475b9f5e-d054-41e7-843e-544afb0b3803', 'status_changed',     '{"old_status":"under_scrutiny","new_status":"registered"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '475b9f5e-d054-41e7-843e-544afb0b3803', 'status_changed',     '{"old_status":"registered","new_status":"summon_issued"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '475b9f5e-d054-41e7-843e-544afb0b3803', 'status_changed',     '{"old_status":"summon_issued","new_status":"preliminary_hearing"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '475b9f5e-d054-41e7-843e-544afb0b3803', 'status_changed',     '{"old_status":"preliminary_hearing","new_status":"issues_framed"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', '475b9f5e-d054-41e7-843e-544afb0b3803', 'status_changed',     '{"old_status":"issues_framed","new_status":"transferred_to_trial"}'),
  ('b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', 'c613a1dd-419c-4436-975c-734cfad37b0d', 'status_changed',     '{"old_status":"transferred_to_trial","new_status":"evidence_stage"}'),
  ('c2d3e4f5-a6b7-4c8d-9e0f-1a2b3c4d5e6f', '71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'case_filed',         '{"new_status":"draft","note":"Criminal case CRM-2026-0001 filed"}'),
  ('e4f5a6b7-c8d9-4e0f-1a2b-3c4d5e6f7a8b', 'a2b3c4d5-e6f7-4890-abcd-ef1234567891', 'case_filed',         '{"new_status":"draft","note":"Contract dispute CIV-2026-0003 filed"}'),
  ('a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d', 'c613a1dd-419c-4436-975c-734cfad37b0d', 'status_changed',     '{"old_status":"reserved_for_judgment","new_status":"judgment_delivered","note":"Judgment delivered in FAM-2025-0001"}')
) AS v(case_id, actor_id, action, details)
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_activity_log l
  WHERE l.case_id = v.case_id::uuid AND l.action = v.action AND l.details::text = v.details
);

-- ============================================================
-- STEP 17: Additional Notifications
-- ============================================================

INSERT INTO public.notifications (user_id, title, message, type, reference_type, reference_id, is_read)
SELECT user_id::uuid, title, message, type::public.notification_type, reference_type, reference_id::uuid, is_read
FROM (VALUES
  ('71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'Payment Confirmed',           'Your court fee payment of PKR 5,000 has been confirmed.',                         'payment_completed',   'payment', 'aa000001-0000-4000-8000-000000000001', true),
  ('71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'Lawyer Fee Paid',             'Instalment 1 of 2 (PKR 25,000) paid to Barrister Ali Raza.',                    'payment_completed',   'payment', 'aa000002-0000-4000-8000-000000000001', true),
  ('3586008a-7dd7-414a-87f2-88479132461c', 'Fee Received',                'You have received instalment 1/2 of PKR 25,000 for case CIV-2026-0001.',          'payment_completed',   'case',    'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', true),
  ('c613a1dd-419c-4436-975c-734cfad37b0d', 'Hearing Scheduled',           'Hearing No. 4 scheduled for 10-Apr-2026 in case CIV-2026-0001.',                  'hearing_scheduled',   'case',    'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', false),
  ('3586008a-7dd7-414a-87f2-88479132461c', 'Hearing Reminder',            'Reminder: Hearing tomorrow (10-Apr-2026) at 10:00 AM, Trial Court Room 1.',       'hearing_reminder',    'case',    'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', false),
  ('71e6fed4-9b07-43c8-a94d-e1adfc2989a4', 'Hearing Reminder',            'Reminder: Your case hearing is scheduled for tomorrow.',                           'hearing_reminder',    'case',    'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', false),
  ('a2b3c4d5-e6f7-4890-abcd-ef1234567891', 'Judgment Delivered',          'Judgment has been delivered in case FAM-2025-0001. Please review.',               'judgment_delivered',  'case',    'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d', false),
  ('1e1e6011-e4ab-446c-8592-a4dbb4168810', 'Judgment in Your Case',       'Judgment delivered in FAM-2025-0001. Kindly advise your client on next steps.',   'judgment_delivered',  'case',    'a6b7c8d9-e0f1-4a2b-3c4d-5e6f7a8b9c0d', false),
  ('922321fd-8d39-4d06-b707-d011307f9a97', 'New Criminal Case Assigned',  'Criminal case CRM-2026-0002 (Narcotics) has been assigned to your court.',        'case_assigned',       'case',    'b7c8d9e0-f1a2-4b3c-4d5e-6f7a8b9c0d1e', true),
  ('51fd1e7a-86a8-4e5e-9445-18fd947e64b7', 'Hearing Proceedings Pending', 'Please upload proceedings summary for Hearing No. 3 in CIV-2026-0001.',           'hearing_scheduled',   'case',    'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e', false)
) AS v(user_id, title, message, type, reference_type, reference_id, is_read)
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.user_id = v.user_id::uuid AND n.title = v.title
);
