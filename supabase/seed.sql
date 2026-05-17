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

-- ============================================================
-- BATCH 2: Additional Users, Cases, and Rich Data
-- Passwords for all new accounts: demo123456
--   client3@civilex.pk  → Zara Hussain   (Client)
--   client4@civilex.pk  → Tariq Nawaz    (Client)
--   lawyer3@civilex.pk  → Adv. Imran Siddiqui  (Lawyer – Land/Property)
--   lawyer4@civilex.pk  → Adv. Sana Gul        (Lawyer – Family/Civil)
--   judge2@civilex.pk   → Justice Khalid Bajwa  (Trial Judge)
--   steno2@civilex.pk   → Maryam Naz     (Stenographer)
-- ============================================================

-- ── STEP B1: New Auth Users ──────────────────────────────────────────────────

DO $$
DECLARE
  pwd TEXT := crypt('demo123456', gen_salt('bf'));
BEGIN

  -- client3: Zara Hussain
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'cc100001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client3@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"client","full_name":"Zara Hussain"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'cc100001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'cc100001-0000-4000-8000-000000000001',
    'client3@civilex.pk', 'email',
    '{"sub":"cc100001-0000-4000-8000-000000000001","email":"client3@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'client3@civilex.pk' AND provider = 'email');

  -- client4: Tariq Nawaz
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'cc200001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client4@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"client","full_name":"Tariq Nawaz"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'cc200001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'cc200001-0000-4000-8000-000000000001',
    'client4@civilex.pk', 'email',
    '{"sub":"cc200001-0000-4000-8000-000000000001","email":"client4@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'client4@civilex.pk' AND provider = 'email');

  -- lawyer3: Advocate Imran Siddiqui
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'cc300001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'lawyer3@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"lawyer","full_name":"Advocate Imran Siddiqui"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'cc300001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'cc300001-0000-4000-8000-000000000001',
    'lawyer3@civilex.pk', 'email',
    '{"sub":"cc300001-0000-4000-8000-000000000001","email":"lawyer3@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'lawyer3@civilex.pk' AND provider = 'email');

  -- lawyer4: Advocate Sana Gul
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'cc400001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'lawyer4@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"lawyer","full_name":"Advocate Sana Gul"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'cc400001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'cc400001-0000-4000-8000-000000000001',
    'lawyer4@civilex.pk', 'email',
    '{"sub":"cc400001-0000-4000-8000-000000000001","email":"lawyer4@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'lawyer4@civilex.pk' AND provider = 'email');

  -- judge2: Justice Khalid Bajwa
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'cc500001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'judge2@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"trial_judge","full_name":"Justice Khalid Bajwa"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'cc500001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'cc500001-0000-4000-8000-000000000001',
    'judge2@civilex.pk', 'email',
    '{"sub":"cc500001-0000-4000-8000-000000000001","email":"judge2@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'judge2@civilex.pk' AND provider = 'email');

  -- steno2: Maryam Naz
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'cc600001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'steno2@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"stenographer","full_name":"Maryam Naz"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'cc600001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'cc600001-0000-4000-8000-000000000001',
    'steno2@civilex.pk', 'email',
    '{"sub":"cc600001-0000-4000-8000-000000000001","email":"steno2@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'steno2@civilex.pk' AND provider = 'email');

END $$;

-- ── STEP B2: Update New Profiles ─────────────────────────────────────────────

UPDATE public.profiles SET
  full_name = 'Zara Hussain',
  phone     = '03451234567',
  cnic      = '35202-1122334-5',
  address   = '22-B Johar Town, Lahore',
  city      = 'Lahore'
WHERE id = 'cc100001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Tariq Nawaz',
  phone     = '03001119988',
  cnic      = '35202-9988776-3',
  address   = 'Village Chak 12, Tehsil Sheikhupura, District Sheikhupura',
  city      = 'Sheikhupura'
WHERE id = 'cc200001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Advocate Imran Siddiqui',
  phone     = '03009876001',
  cnic      = '35202-3344556-7',
  address   = 'Revenue Court Building, Lahore',
  city      = 'Lahore'
WHERE id = 'cc300001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Advocate Sana Gul',
  phone     = '03124567890',
  cnic      = '35202-6677889-0',
  address   = 'Family Court Complex, Faisalabad',
  city      = 'Faisalabad'
WHERE id = 'cc400001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Justice Khalid Bajwa',
  phone     = '03005556677',
  address   = 'Revenue Court, Sheikhupura',
  city      = 'Sheikhupura'
WHERE id = 'cc500001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Maryam Naz (Court Writer)',
  phone     = '03214441122',
  address   = 'Revenue Court Complex, Lahore',
  city      = 'Lahore'
WHERE id = 'cc600001-0000-4000-8000-000000000001';

-- ── STEP B3: New Lawyer Profiles ─────────────────────────────────────────────

INSERT INTO public.lawyer_profiles (id, bar_license_number, specialization, experience_years, bio, hourly_rate, rating, total_reviews, is_available, location)
VALUES (
  'cc300001-0000-4000-8000-000000000001',
  'LHR-2010-3312',
  ARRAY['Property', 'Land Revenue', 'Land Transfer', 'Civil'],
  15,
  'Specialist in land revenue, mutation, and property transfer cases. Extensive experience before Revenue Courts and District Courts in Punjab.',
  6000, 4.7, 62, true, 'Lahore'
) ON CONFLICT (id) DO UPDATE SET
  specialization   = EXCLUDED.specialization,
  experience_years = EXCLUDED.experience_years,
  bio              = EXCLUDED.bio;

INSERT INTO public.lawyer_profiles (id, bar_license_number, specialization, experience_years, bio, hourly_rate, rating, total_reviews, is_available, location)
VALUES (
  'cc400001-0000-4000-8000-000000000001',
  'FSD-2018-0091',
  ARRAY['Family', 'Civil', 'Affidavits'],
  7,
  'Dedicated family law practitioner handling divorce, custody, maintenance, and guardianship matters across Punjab Family Courts.',
  4500, 4.4, 33, true, 'Faisalabad'
) ON CONFLICT (id) DO UPDATE SET
  specialization   = EXCLUDED.specialization,
  experience_years = EXCLUDED.experience_years,
  bio              = EXCLUDED.bio;

-- ── STEP B4: New Cases ───────────────────────────────────────────────────────

-- LRV-2026-0001 : Land Mutation dispute (registered stage, Zara Hussain)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd100001-0000-4000-8000-000000000001'::uuid,
  'LRV-2026-0001', 'land_revenue', 'land_mutation', 'registered',
  'Zara Hussain vs Mehmood Iqbal - Mutation Cancellation',
  'Petition for cancellation of fraudulent mutation No. 2341 entered in favour of Mehmood Iqbal (s/o Ghulam Iqbal) in respect of Khasra No. 45/1-2 measuring 4 Kanals in Mauza Chak Jhumra, Tehsil Faisalabad. Petitioner holds genuine title through registered inheritance documents.',
  'cc100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'cc500001-0000-4000-8000-000000000001',
  'cc600001-0000-4000-8000-000000000001',
  'Zara Hussain', '03451234567', '35202-1122334-5', '22-B Johar Town, Lahore',
  'Mehmood Iqbal', '03001112233', '35202-4455667-8', 'Mauza Chak Jhumra, Faisalabad',
  'revenue_court', 'sensitive', '2026-02-10', '2026-02-18',
  'Cancellation of fraudulent mutation No. 2341. Restoration of petitioner''s name in revenue records. Costs of the petition.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd100001-0000-4000-8000-000000000001');

-- LRV-2026-0002 : Land Partition (issues_framed, Tariq Nawaz)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd200001-0000-4000-8000-000000000001'::uuid,
  'LRV-2026-0002', 'land_revenue', 'land_partition', 'issues_framed',
  'Tariq Nawaz vs Naseer Nawaz - Partition of Agricultural Land',
  'Suit for partition and separate possession of ancestral agricultural land measuring 12 Kanals 4 Marlas situated in Mauza Pindi Bhattian, Tehsil Sheikhupura. The defendant (brother of plaintiff) refuses to effect partition despite legal notices.',
  'cc200001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'cc500001-0000-4000-8000-000000000001',
  'cc600001-0000-4000-8000-000000000001',
  'Tariq Nawaz', '03001119988', '35202-9988776-3', 'Village Chak 12, Sheikhupura',
  'Naseer Nawaz', '03009998877', '35202-8877665-4', 'Village Chak 12, Sheikhupura',
  'revenue_court', 'normal', '2026-01-05', '2026-01-12',
  'Partition of 12 Kanals 4 Marlas into equal shares and delivery of separate possession. Appointment of local commission for demarcation. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd200001-0000-4000-8000-000000000001');

-- LRV-2026-0003 : Land Inheritance / Wirasat (evidence_stage, Zara Hussain)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd300001-0000-4000-8000-000000000001'::uuid,
  'LRV-2026-0003', 'land_revenue', 'land_inheritance', 'evidence_stage',
  'Zara Hussain vs Revenue Officer - Inheritance Entry',
  'Petition challenging refusal of Patwari Halqa to enter petitioner''s name in Khewat/Khatoni records as legal heir of deceased Muhammad Hussain (father). Petitioner is entitled to 1/3 share in land measuring 8 Kanals in Mauza Kamalia, Tehsil Kamalia.',
  'cc100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'cc500001-0000-4000-8000-000000000001',
  'cc600001-0000-4000-8000-000000000001',
  'Zara Hussain', '03451234567', '35202-1122334-5', '22-B Johar Town, Lahore',
  'Patwari Halqa / Revenue Officer', '042-99350001', NULL, 'Revenue Offices, Kamalia Tehsil',
  'revenue_court', 'normal', '2025-10-15', '2025-10-22',
  'Direction to Revenue Officer to enter petitioner''s name as legal heir in all relevant revenue records. Issuance of corrected Fard Malkiyat. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd300001-0000-4000-8000-000000000001');

-- LRV-2026-0004 : Land Acquisition Challenge (submitted_to_admin, Ahmad Khan)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_address,
  current_phase, sensitivity, filing_date, relief_sought
)
SELECT
  'dd400001-0000-4000-8000-000000000001'::uuid,
  'LRV-2026-0004', 'land_revenue', 'land_acquisition', 'submitted_to_admin',
  'Ahmad Khan vs Lahore Development Authority - Acquisition Challenge',
  'Challenge to LDA''s compulsory acquisition of 3 Kanals 2 Marlas of residential land in Mauza Bhatta, Raiwind Road, Lahore under the Land Acquisition Act 1894 without adequate compensation and proper notice as required by law.',
  '71e6fed4-9b07-43c8-a94d-e1adfc2989a4',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'Ahmad Khan', '03001234567', '35201-1234567-1', '123 Model Town, Lahore',
  'Lahore Development Authority (LDA)', 'LDA Plaza, Edgerton Road, Lahore',
  'admin_court', 'sensitive', '2026-04-01',
  'Declaration that acquisition proceedings are void for non-compliance with mandatory notices under Section 4 and Section 6 of Land Acquisition Act 1894. Enhanced compensation of PKR 25,000 per Marla. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd400001-0000-4000-8000-000000000001');

-- LTR-2026-0001 : Sale Deed Registration (registered, Tariq Nawaz)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd500001-0000-4000-8000-000000000001'::uuid,
  'LTR-2026-0001', 'land_transfer', 'land_sale_deed', 'registered',
  'Tariq Nawaz vs Shahid Rehman - Sale Deed Cancellation',
  'Suit for cancellation of fraudulently executed sale deed No. 1247/2025 purportedly transferring Khasra No. 88/2 (2 Kanals commercial plot, G.T. Road, Sheikhupura) by impersonation of actual owner Tariq Nawaz. The purported sale deed was registered without the plaintiff''s knowledge or consent.',
  'cc200001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'cc500001-0000-4000-8000-000000000001',
  'cc600001-0000-4000-8000-000000000001',
  'Tariq Nawaz', '03001119988', '35202-9988776-3', 'Village Chak 12, Sheikhupura',
  'Shahid Rehman', '03331234567', '35202-1234560-9', 'G.T. Road, Sheikhupura',
  'revenue_court', 'highly_sensitive', '2026-01-20', '2026-01-28',
  'Declaration that sale deed No. 1247/2025 is void, forged, and of no legal effect. Cancellation of the deed from revenue records. Restoration of plaintiff''s name. FIR for fraud. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd500001-0000-4000-8000-000000000001');

-- LTR-2026-0002 : Gift Deed (preliminary_hearing, Zara Hussain)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd600001-0000-4000-8000-000000000001'::uuid,
  'LTR-2026-0002', 'land_transfer', 'land_gift_deed', 'preliminary_hearing',
  'Zara Hussain vs Siblings - Gift Deed Dispute',
  'Dispute regarding validity of gift deed (Hiba Nama) executed by late Muhammad Hussain (father) in favour of defendant (eldest son) transferring entire residential property at House No. 5, Street 3, Johar Town, Lahore (8 Marla) without the knowledge of other legal heirs including the petitioner.',
  'cc100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'Zara Hussain', '03451234567', '35202-1122334-5', '22-B Johar Town, Lahore',
  'Bilal Hussain (brother)', '03451239876', '35202-1122334-6', '5 Street 3, Johar Town, Lahore',
  'admin_court', 'sensitive', '2026-03-05', '2026-03-12',
  'Declaration that the gift deed is void as it was not a valid Hiba under Islamic law (no delivery of possession). Equal distribution of property among all legal heirs. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd600001-0000-4000-8000-000000000001');

-- FAM-2026-0001 : Family case – Custody (evidence_stage, Zara Hussain)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  marriage_certificate_number,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd700001-0000-4000-8000-000000000001'::uuid,
  'FAM-2026-0001', 'family', 'marriage_divorce', 'evidence_stage',
  'Zara Hussain vs Farhan Malik - Khul and Child Custody',
  'Petition for dissolution of marriage by Khul and custody of two minor children (Ali, 7 years; Sara, 4 years). Petitioner alleges cruelty, abandonment, and failure to provide maintenance for past 18 months.',
  'cc100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'c613a1dd-419c-4436-975c-734cfad37b0d',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'Zara Hussain', '03451234567', '35202-1122334-5', '22-B Johar Town, Lahore',
  'Farhan Malik', '03001998877', '35202-7766554-3', '12 Gulberg II, Lahore',
  'NKC-2018-44512',
  'family_court', 'sensitive', '2026-01-30', '2026-02-06',
  'Dissolution of marriage by Khul. Custody of both minor children. Monthly maintenance of PKR 50,000. Return of dower (PKR 2,00,000). Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd700001-0000-4000-8000-000000000001');

-- CRM-2026-0003 : Criminal assault case (registered, Tariq Nawaz complainant)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd800001-0000-4000-8000-000000000001'::uuid,
  'CRM-2026-0003', 'criminal', 'criminal', 'registered',
  'State vs Arif Khan - Armed Robbery',
  'FIR No. 789/2026 registered at Sheikhupura Sadar Police Station. Complainant Tariq Nawaz was robbed at gunpoint of PKR 3,50,000 cash, mobile phone, and gold jewellery by two armed accused near GT Road, Sheikhupura.',
  'cc200001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'Tariq Nawaz', '03001119988', '35202-9988776-3', 'Village Chak 12, Sheikhupura',
  'Arif Khan and others', '03009988776', 'GT Road Area, Sheikhupura',
  'admin_court', 'highly_sensitive', '2026-03-15', '2026-03-22',
  'Prosecution of accused under Sections 392/34 PPC. Recovery of stolen property. Exemplary sentence.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd800001-0000-4000-8000-000000000001');

-- CIV-2026-0010 : Recovery suit (arguments stage, Fatima Bibi)
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'dd900001-0000-4000-8000-000000000001'::uuid,
  'CIV-2026-0010', 'civil', 'civil', 'arguments',
  'Fatima Bibi vs Saima Enterprises - Recovery of Loan',
  'Suit for recovery of PKR 18,00,000 advanced as loan to defendant company Saima Enterprises (Pvt) Ltd vide promissory note dated 22-06-2024. The defendant has failed to repay despite repeated demands and legal notices. Suit includes claim for profit at 12% per annum.',
  'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'c613a1dd-419c-4436-975c-734cfad37b0d',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'Fatima Bibi', '03009876543', '35201-7654321-2', '45 Gulberg III, Lahore',
  'Saima Enterprises (Pvt) Ltd', '042-35780011', '35202-0011223-4', '77 Main Boulevard, Gulberg, Lahore',
  'trial_court', 'normal', '2025-09-10', '2025-09-18',
  'Recovery of PKR 18,00,000 principal plus profit at 12% p.a. from 22-06-2024 till date of actual payment. Costs of the suit.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'dd900001-0000-4000-8000-000000000001');

-- ── STEP B5: Land Case Details ────────────────────────────────────────────────

-- LRV-2026-0001 – Mutation cancellation (Chak Jhumra, Faisalabad)
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, mutation_number, revenue_officer
)
SELECT
  'dd100001-0000-4000-8000-000000000001',
  '45/1-2', 'KHW-332', 'Faisalabad', 'Faisalabad Sadar', 'Chak Jhumra',
  '4 Kanals', 'agricultural', '2341', 'Patwari Muhammad Yousaf'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'dd100001-0000-4000-8000-000000000001');

-- LRV-2026-0002 – Partition (Pindi Bhattian, Sheikhupura)
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, revenue_officer
)
SELECT
  'dd200001-0000-4000-8000-000000000001',
  '112/3-4', 'KHW-089', 'Sheikhupura', 'Sheikhupura', 'Pindi Bhattian',
  '12 Kanals 4 Marlas', 'agricultural', 'Patwari Abdul Ghafoor'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'dd200001-0000-4000-8000-000000000001');

-- LRV-2026-0003 – Inheritance (Kamalia, Toba Tek Singh)
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, revenue_officer
)
SELECT
  'dd300001-0000-4000-8000-000000000001',
  '77/1', 'KHW-201', 'Toba Tek Singh', 'Kamalia', 'Mauza Kamalia',
  '8 Kanals', 'agricultural', 'Patwari Ghulam Rasool'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'dd300001-0000-4000-8000-000000000001');

-- LRV-2026-0004 – Land Acquisition (Raiwind Road, Lahore)
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, registration_authority
)
SELECT
  'dd400001-0000-4000-8000-000000000001',
  '22/5', 'KHW-451', 'Lahore', 'Raiwind', 'Mauza Bhatta',
  '3 Kanals 2 Marlas', 'residential', 'Lahore Development Authority'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'dd400001-0000-4000-8000-000000000001');

-- LTR-2026-0001 – Sale Deed cancellation (GT Road, Sheikhupura)
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, deed_number, deed_date, registration_authority
)
SELECT
  'dd500001-0000-4000-8000-000000000001',
  '88/2', 'KHW-667', 'Sheikhupura', 'Sheikhupura', 'G.T. Road Mauza',
  '2 Kanals', 'commercial', '1247/2025', '2025-09-10',
  'Sub-Registrar Sheikhupura'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'dd500001-0000-4000-8000-000000000001');

-- LTR-2026-0002 – Gift Deed dispute (Johar Town, Lahore)
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, deed_number, deed_date, registration_authority
)
SELECT
  'dd600001-0000-4000-8000-000000000001',
  '55/8', 'KHW-112', 'Lahore', 'Model Town', 'Johar Town',
  '8 Marlas', 'residential', 'GD-0892/2024', '2024-11-01',
  'Sub-Registrar Model Town, Lahore'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'dd600001-0000-4000-8000-000000000001');

-- ── STEP B6: Criminal Case Details (new cases) ───────────────────────────────

INSERT INTO public.criminal_case_details (
  case_id, fir_number, police_station, offense_section, offense_description,
  io_name, bail_status
)
SELECT
  'dd800001-0000-4000-8000-000000000001',
  'FIR-789/2026', 'Sheikhupura Sadar Police Station',
  'Sections 392/34 PPC',
  'Armed robbery by two accused who intercepted complainant Tariq Nawaz near GT Road, Sheikhupura and robbed him of PKR 3,50,000 cash, one Samsung mobile, and gold chain at gunpoint.',
  'Sub-Inspector Sajid Ali', 'applied'
WHERE NOT EXISTS (
  SELECT 1 FROM public.criminal_case_details WHERE case_id = 'dd800001-0000-4000-8000-000000000001'
);

-- ── STEP B7: Case Assignments (new lawyers on new cases) ─────────────────────

-- Lawyer3 (Imran Siddiqui) on LRV Mutation case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'dd100001-0000-4000-8000-000000000001', 'cc300001-0000-4000-8000-000000000001',
       'cc100001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 65000, '2026-02-20'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'dd100001-0000-4000-8000-000000000001' AND lawyer_id = 'cc300001-0000-4000-8000-000000000001'
);

-- Lawyer3 on LRV Partition case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'dd200001-0000-4000-8000-000000000001', 'cc300001-0000-4000-8000-000000000001',
       'cc200001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 80000, '2026-01-15'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'dd200001-0000-4000-8000-000000000001' AND lawyer_id = 'cc300001-0000-4000-8000-000000000001'
);

-- Lawyer3 on LRV Inheritance case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'dd300001-0000-4000-8000-000000000001', 'cc300001-0000-4000-8000-000000000001',
       'cc100001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 55000, '2025-10-28'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'dd300001-0000-4000-8000-000000000001' AND lawyer_id = 'cc300001-0000-4000-8000-000000000001'
);

-- Lawyer3 on LTR Sale Deed case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'dd500001-0000-4000-8000-000000000001', 'cc300001-0000-4000-8000-000000000001',
       'cc200001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 95000, '2026-01-30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'dd500001-0000-4000-8000-000000000001' AND lawyer_id = 'cc300001-0000-4000-8000-000000000001'
);

-- Lawyer4 (Sana Gul) on Family Khul case (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'dd700001-0000-4000-8000-000000000001', 'cc400001-0000-4000-8000-000000000001',
       'cc100001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 70000, '2026-02-08'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'dd700001-0000-4000-8000-000000000001' AND lawyer_id = 'cc400001-0000-4000-8000-000000000001'
);

-- Lawyer1 on Recovery suit (plaintiff side)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'dd900001-0000-4000-8000-000000000001', '3586008a-7dd7-414a-87f2-88479132461c',
       'a2b3c4d5-e6f7-4890-abcd-ef1234567891', 'plaintiff', 'accepted', 85000, '2025-09-20'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'dd900001-0000-4000-8000-000000000001' AND lawyer_id = '3586008a-7dd7-414a-87f2-88479132461c'
);

-- ── STEP B8: Payments for new cases ──────────────────────────────────────────

-- Court fee LRV-2026-0001 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'bb010001-0000-4000-8000-000000000001'::uuid,
  'dd100001-0000-4000-8000-000000000001', 'cc100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  6500, 'court_fee', 'jazzcash', 'completed', 'TXN-2026-LRV-0001',
  'Court fee for LRV-2026-0001', '2026-02-16 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'bb010001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee LRV-2026-0001 instalment 1/2 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, is_installment, installment_number, total_installments,
  description, paid_at)
SELECT 'bb020001-0000-4000-8000-000000000001'::uuid,
  'dd100001-0000-4000-8000-000000000001', 'cc100001-0000-4000-8000-000000000001',
  'cc300001-0000-4000-8000-000000000001',
  32500, 'lawyer_fee', 'easypaisa', 'completed', 'TXN-2026-LRV-LAW-01',
  true, 1, 2, 'Lawyer fee instalment 1/2 – Adv. Imran Siddiqui', '2026-02-22 14:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'bb020001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee LRV-2026-0001 instalment 2/2 (pending)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, is_installment, installment_number, total_installments,
  parent_payment_id, description)
SELECT 'bb030001-0000-4000-8000-000000000001'::uuid,
  'dd100001-0000-4000-8000-000000000001', 'cc100001-0000-4000-8000-000000000001',
  'cc300001-0000-4000-8000-000000000001',
  32500, 'lawyer_fee', 'jazzcash', 'pending',
  true, 2, 2, 'bb020001-0000-4000-8000-000000000001'::uuid,
  'Lawyer fee instalment 2/2 – Adv. Imran Siddiqui'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'bb030001-0000-4000-8000-000000000001'::uuid);

-- Court fee LTR-2026-0001 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'bb040001-0000-4000-8000-000000000001'::uuid,
  'dd500001-0000-4000-8000-000000000001', 'cc200001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  8000, 'court_fee', 'bank_transfer', 'completed', 'TXN-2026-LTR-0001',
  'Court fee for LTR-2026-0001', '2026-01-26 09:30:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'bb040001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee LTR-2026-0001 (single, completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'bb050001-0000-4000-8000-000000000001'::uuid,
  'dd500001-0000-4000-8000-000000000001', 'cc200001-0000-4000-8000-000000000001',
  'cc300001-0000-4000-8000-000000000001',
  95000, 'lawyer_fee', 'jazzcash', 'completed', 'TXN-2026-LTR-LAW-01',
  'Full lawyer fee – Adv. Imran Siddiqui (LTR-2026-0001)', '2026-02-01 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'bb050001-0000-4000-8000-000000000001'::uuid);

-- Court fee FAM-2026-0001 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'bb060001-0000-4000-8000-000000000001'::uuid,
  'dd700001-0000-4000-8000-000000000001', 'cc100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  4500, 'court_fee', 'easypaisa', 'completed', 'TXN-2026-FAM-0001',
  'Court fee for FAM-2026-0001', '2026-02-04 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'bb060001-0000-4000-8000-000000000001'::uuid);

-- Court fee CIV-2026-0010 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'bb070001-0000-4000-8000-000000000001'::uuid,
  'dd900001-0000-4000-8000-000000000001', 'a2b3c4d5-e6f7-4890-abcd-ef1234567891',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  18000, 'court_fee', 'bank_transfer', 'completed', 'TXN-2025-CIV-0010',
  'Court fee for CIV-2026-0010 (18,00,000 recovery suit)', '2025-09-14 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'bb070001-0000-4000-8000-000000000001'::uuid);

-- ── STEP B9: Hearings for new cases ──────────────────────────────────────────

-- LRV-2026-0001 – Hearing 1: Preliminary (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc010001-0000-4000-8000-000000000001'::uuid,
  'dd100001-0000-4000-8000-000000000001',
  1, 'preliminary', '2026-02-25 10:00:00', '2026-02-25 11:15:00',
  'cc500001-0000-4000-8000-000000000001', 'Revenue Court Room 1, Faisalabad',
  'Preliminary hearing. Both parties appeared. Petitioner produced certified copy of inheritance documents. Respondent denied executing any mutation. Counsel directed to produce revenue record extract (Fard) at next hearing.',
  'Patwari Halqa directed to produce complete record of mutation No. 2341 at next date. Revenue officer summoned.',
  '2026-03-18 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc010001-0000-4000-8000-000000000001'::uuid);

-- LRV-2026-0001 – Hearing 2: Regular (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc020001-0000-4000-8000-000000000001'::uuid,
  'dd100001-0000-4000-8000-000000000001',
  2, 'regular', '2026-03-18 10:00:00', '2026-03-18 12:00:00',
  'cc500001-0000-4000-8000-000000000001', 'Revenue Court Room 1, Faisalabad',
  'Revenue record (Khasra Girdawari and Mutation Register extract) produced. Issues framed: (1) Whether mutation No. 2341 is fraudulent? (2) Whether petitioner is entitled to cancellation? Case admitted for evidence.',
  'Issues framed. Petitioner to produce evidence on next date. Respondent to file reply to petition.',
  '2026-04-15 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc020001-0000-4000-8000-000000000001'::uuid);

-- LRV-2026-0001 – Hearing 3: Scheduled (upcoming)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date,
  presiding_officer_id, courtroom, status)
SELECT 'cc030001-0000-4000-8000-000000000001'::uuid,
  'dd100001-0000-4000-8000-000000000001',
  3, 'regular', '2026-04-15 10:00:00',
  'cc500001-0000-4000-8000-000000000001', 'Revenue Court Room 1, Faisalabad', 'scheduled'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc030001-0000-4000-8000-000000000001'::uuid);

-- LRV-2026-0002 – Hearing 1: Preliminary (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc040001-0000-4000-8000-000000000001'::uuid,
  'dd200001-0000-4000-8000-000000000001',
  1, 'preliminary', '2026-01-20 11:00:00', '2026-01-20 12:00:00',
  'cc500001-0000-4000-8000-000000000001', 'Revenue Court Room 2, Sheikhupura',
  'Preliminary hearing in partition suit. Both co-owners appeared in person. Land area and shares not disputed. Issues framed for extent of each share and mode of partition.',
  'Local commission to be appointed on next date for physical demarcation. Both parties to file proposals.',
  '2026-02-15 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc040001-0000-4000-8000-000000000001'::uuid);

-- LRV-2026-0002 – Hearing 2: Commission report hearing (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc050001-0000-4000-8000-000000000001'::uuid,
  'dd200001-0000-4000-8000-000000000001',
  2, 'regular', '2026-02-15 11:00:00', '2026-02-15 12:30:00',
  'cc500001-0000-4000-8000-000000000001', 'Revenue Court Room 2, Sheikhupura',
  'Local commission (Patwari and Naib-Tehsildar) report presented. Report recommends equal partition along natural boundary. Defendant raised objection on location of access road. Objections noted.',
  'Parties given time to respond to commission report in writing. Next date for arguments on commission report.',
  '2026-03-10 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc050001-0000-4000-8000-000000000001'::uuid);

-- LTR-2026-0001 – Hearing 1: Preliminary (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc060001-0000-4000-8000-000000000001'::uuid,
  'dd500001-0000-4000-8000-000000000001',
  1, 'preliminary', '2026-02-05 09:30:00', '2026-02-05 10:45:00',
  'cc500001-0000-4000-8000-000000000001', 'Revenue Court Room 1, Sheikhupura',
  'Preliminary hearing. Original deed No. 1247/2025 produced. Defendant admitted purchasing property. Plaintiff denied executing deed. Handwriting expert appointed to examine signatures on deed. Fingerprint comparison ordered.',
  'Handwriting expert report to be filed within 45 days. Sub-Registrar directed to produce original registration file.',
  '2026-03-25 09:30:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc060001-0000-4000-8000-000000000001'::uuid);

-- LTR-2026-0001 – Hearing 2: Expert report (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc070001-0000-4000-8000-000000000001'::uuid,
  'dd500001-0000-4000-8000-000000000001',
  2, 'regular', '2026-03-25 09:30:00', '2026-03-25 11:00:00',
  'cc500001-0000-4000-8000-000000000001', 'Revenue Court Room 1, Sheikhupura',
  'Handwriting expert report received. Expert opined that signatures on deed do not match plaintiff''s specimen signatures. Sub-Registrar registration file produced. Issues framed. Evidence stage commenced.',
  'Expert report Exh. P-1 tendered. Sub-Registrar to appear as court witness. Next date for examination of PW-1.',
  '2026-04-20 09:30:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc070001-0000-4000-8000-000000000001'::uuid);

-- FAM-2026-0001 – Hearing 1: Preliminary (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc080001-0000-4000-8000-000000000001'::uuid,
  'dd700001-0000-4000-8000-000000000001',
  1, 'preliminary', '2026-02-12 10:00:00', '2026-02-12 11:00:00',
  'c613a1dd-419c-4436-975c-734cfad37b0d', 'Family Court Room 2, Lahore',
  'First hearing in Khul petition. Conciliation proceedings initiated per Section 10 Family Courts Act. Both parties present. Conciliation failed. Petitioner reiterated claim for Khul and custody. Respondent denied all allegations.',
  'Conciliation failed. Case proceeds for recording of evidence. Interim maintenance of PKR 25,000/month ordered.',
  '2026-03-08 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc080001-0000-4000-8000-000000000001'::uuid);

-- FAM-2026-0001 – Hearing 2: Maintenance order (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc090001-0000-4000-8000-000000000001'::uuid,
  'dd700001-0000-4000-8000-000000000001',
  2, 'regular', '2026-03-08 10:00:00', '2026-03-08 11:30:00',
  'c613a1dd-419c-4436-975c-734cfad37b0d', 'Family Court Room 2, Lahore',
  'PW-1 (Petitioner Zara Hussain) examined in chief. Marriage certificate and NADRA verification produced. Medical certificate regarding cruelty (Exh. P-2) tendered. Photographs of injuries submitted. Cross-examination on next date.',
  'PW-1 examined. Cross-examination on 10-Apr-2026. School fee receipts of minor children to be produced.',
  '2026-04-10 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc090001-0000-4000-8000-000000000001'::uuid);

-- CIV-2026-0010 – Recovery suit – Hearing 1: Arguments (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'cc100001-0000-4000-8000-000000000001'::uuid,
  'dd900001-0000-4000-8000-000000000001',
  1, 'arguments', '2026-03-20 11:00:00', '2026-03-20 12:30:00',
  'c613a1dd-419c-4436-975c-734cfad37b0d', 'Trial Court Room 1, Lahore',
  'Arguments in recovery suit. Plaintiff counsel argued on promissory note validity and defendant''s liability. Defendant counsel raised plea of partial payment and disputed interest rate. Plaintiff produced bank statement and promissory note original.',
  'Both sides to file written synopses within 7 days. Arguments to conclude at next hearing. Judgment to follow.',
  '2026-04-25 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'cc100001-0000-4000-8000-000000000001'::uuid);

-- ── STEP B10: Order Sheets for new hearings ───────────────────────────────────

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'dd100001-0000-4000-8000-000000000001', 'cc010001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Patwari Halqa of Mauza Chak Jhumra is directed to produce complete record of mutation No. 2341 including all relevant documents before this court on 18-03-2026. Revenue Officer (Naib-Tehsildar) of Tehsil Faisalabad Sadar is also summoned to attend and produce original mutation register.',
  'cc500001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'dd100001-0000-4000-8000-000000000001'
  AND hearing_id = 'cc010001-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'dd200001-0000-4000-8000-000000000001', 'cc040001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'A local commission comprising the Naib-Tehsildar, Sheikhupura and Patwari Halqa is hereby appointed to visit the subject land (Khasra No. 112/3-4, Mauza Pindi Bhattian) and submit a demarcation report with a proposed partition plan. Report to be submitted within 30 days. Commission fee of PKR 5,000 to be deposited by petitioner within 7 days.',
  'cc500001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'dd200001-0000-4000-8000-000000000001'
  AND hearing_id = 'cc040001-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'dd500001-0000-4000-8000-000000000001', 'cc060001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Handwriting and fingerprint experts from the Punjab Forensic Science Agency are appointed to examine sale deed No. 1247/2025 and compare the signatures/thumb impressions thereon with specimen signatures/thumb impressions of plaintiff Tariq Nawaz. Expert report to be submitted within 45 days. Sub-Registrar Sheikhupura directed to produce original deed registration file.',
  'cc500001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'dd500001-0000-4000-8000-000000000001'
  AND hearing_id = 'cc060001-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'dd700001-0000-4000-8000-000000000001', 'cc080001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Conciliation proceedings conducted and failed. As per Section 10 of the Family Courts Act 1964, case proceeds for recording of evidence. Respondent Farhan Malik is directed to pay interim maintenance of PKR 25,000 per month to petitioner for both minor children with effect from today. Failure to pay shall attract execution proceedings. Next date 08-03-2026.',
  'c613a1dd-419c-4436-975c-734cfad37b0d'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'dd700001-0000-4000-8000-000000000001'
  AND hearing_id = 'cc080001-0000-4000-8000-000000000001'::uuid
);

-- ── STEP B11: Witnesses for new cases ────────────────────────────────────────

-- LRV-2026-0001 Mutation case witnesses
INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, statement, status, examination_date, added_by)
SELECT 'dd100001-0000-4000-8000-000000000001',
  'Zara Hussain (Petitioner)', '35202-1122334-5', '03451234567', '22-B Johar Town, Lahore',
  'prosecution', 'Petitioner / Land Owner',
  'I am the daughter of late Muhammad Hussain who owned Khasra No. 45/1-2 in Mauza Chak Jhumra. After his death I inherited 1/3 share. The respondent has fraudulently obtained mutation No. 2341 by misrepresenting facts before the Patwari. I never consented to any transfer.',
  'listed', NULL, 'cc300001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'dd100001-0000-4000-8000-000000000001' AND witness_name = 'Zara Hussain (Petitioner)'
);

INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, status, added_by)
SELECT 'dd100001-0000-4000-8000-000000000001',
  'Patwari Muhammad Yousaf', '35202-3344556-1', '042-99880011', 'Revenue Office, Chak Jhumra',
  'prosecution', 'Revenue Official – entered disputed mutation',
  'summoned', 'cc300001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'dd100001-0000-4000-8000-000000000001' AND witness_name = 'Patwari Muhammad Yousaf'
);

-- LTR-2026-0001 Sale Deed case witnesses
INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, statement, status, examination_date, added_by)
SELECT 'dd500001-0000-4000-8000-000000000001',
  'Tariq Nawaz (Plaintiff)', '35202-9988776-3', '03001119988', 'Village Chak 12, Sheikhupura',
  'prosecution', 'Plaintiff / Actual Owner',
  'I am the registered owner of Khasra No. 88/2 on G.T. Road, Sheikhupura. I never executed sale deed No. 1247/2025. I was not present before the Sub-Registrar on 10-09-2025. My signatures have been forged. I first came to know of this fraud when I received a notice from the defendant.',
  'listed', NULL, 'cc300001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'dd500001-0000-4000-8000-000000000001' AND witness_name = 'Tariq Nawaz (Plaintiff)'
);

INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact,
  witness_side, relation_to_case, status, added_by)
SELECT 'dd500001-0000-4000-8000-000000000001',
  'Punjab Forensic Science Agency Expert', NULL, '042-99200500',
  'prosecution', 'Handwriting Expert – PFSA Lahore',
  'listed', 'cc300001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'dd500001-0000-4000-8000-000000000001' AND witness_name = 'Punjab Forensic Science Agency Expert'
);

-- FAM-2026-0001 Family case witnesses
INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, statement, status, examination_date, added_by)
SELECT 'dd700001-0000-4000-8000-000000000001',
  'Zara Hussain (Petitioner)', '35202-1122334-5', '03451234567', '22-B Johar Town, Lahore',
  'prosecution', 'Petitioner / Wife',
  'I married Farhan Malik on 12-05-2018. The marriage has broken down irretrievably. The respondent has subjected me to physical and mental cruelty. He has not paid any maintenance for the last 18 months. I seek Khul and custody of both minor children Ali (7) and Sara (4).',
  'examined', '2026-03-08', 'cc400001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'dd700001-0000-4000-8000-000000000001' AND witness_name = 'Zara Hussain (Petitioner)'
);

INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, status, added_by)
SELECT 'dd700001-0000-4000-8000-000000000001',
  'Dr. Asma Khalid', '35202-5566778-9', '03001234001', 'Services Hospital, Lahore',
  'prosecution', 'Medical Expert – treated petitioner injuries',
  'summoned', 'cc400001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'dd700001-0000-4000-8000-000000000001' AND witness_name = 'Dr. Asma Khalid'
);

-- ── STEP B12: Scrutiny Records for new cases ──────────────────────────────────

-- LRV-2026-0001 – Mutation cancellation (approved)
INSERT INTO public.scrutiny_checklist (
  case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at
)
SELECT 'dd100001-0000-4000-8000-000000000001', '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true,
  'approved',
  'Revenue court has jurisdiction. Certified copy of mutation No. 2341 produced. Inheritance documents duly attested. Court fee paid. Limitation period within 3 years from mutation entry. Admitted for registration.',
  '2026-02-16 11:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'dd100001-0000-4000-8000-000000000001'
);

-- LRV-2026-0002 – Partition (approved)
INSERT INTO public.scrutiny_checklist (
  case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at
)
SELECT 'dd200001-0000-4000-8000-000000000001', '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true,
  'approved',
  'Partition suit maintainable. Khewat/Khatoni record produced showing co-ownership. Both parties identified. Court fee paid as per land value. Admitted.',
  '2026-01-10 10:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'dd200001-0000-4000-8000-000000000001'
);

-- LTR-2026-0001 – Sale Deed cancellation (approved)
INSERT INTO public.scrutiny_checklist (
  case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at
)
SELECT 'dd500001-0000-4000-8000-000000000001', '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true,
  'approved',
  'Certified copy of disputed sale deed produced. Plaintiff shows prima facie case of forgery. Court has jurisdiction. Court fee paid as per property value. Case admitted for proceedings.',
  '2026-01-26 10:30:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'dd500001-0000-4000-8000-000000000001'
);

-- FAM-2026-0001 – Family case (approved)
INSERT INTO public.scrutiny_checklist (
  case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at
)
SELECT 'dd700001-0000-4000-8000-000000000001', '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true,
  'approved',
  'Original Nikahnama and NADRA verification attached. Family court jurisdiction confirmed (parties reside in Lahore). Court fee paid. Petition is in prescribed format. Admitted.',
  '2026-02-04 11:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'dd700001-0000-4000-8000-000000000001'
);

-- ── STEP B13: Activity Log for new cases ─────────────────────────────────────

INSERT INTO public.case_activity_log (case_id, actor_id, action, details)
SELECT case_id::uuid, actor_id::uuid, action, details::jsonb
FROM (VALUES
  ('dd100001-0000-4000-8000-000000000001','cc100001-0000-4000-8000-000000000001','case_filed',         '{"note":"LRV-2026-0001 mutation cancellation petition filed by Zara Hussain"}'),
  ('dd100001-0000-4000-8000-000000000001','cc100001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"draft","new_status":"pending_lawyer_acceptance"}'),
  ('dd100001-0000-4000-8000-000000000001','cc300001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Imran Siddiqui accepted","fee_amount":65000}'),
  ('dd100001-0000-4000-8000-000000000001','475b9f5e-d054-41e7-843e-544afb0b3803','status_changed',     '{"old_status":"submitted_to_admin","new_status":"registered"}'),
  ('dd200001-0000-4000-8000-000000000001','cc200001-0000-4000-8000-000000000001','case_filed',         '{"note":"LRV-2026-0002 partition suit filed by Tariq Nawaz"}'),
  ('dd200001-0000-4000-8000-000000000001','cc200001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"draft","new_status":"pending_lawyer_acceptance"}'),
  ('dd200001-0000-4000-8000-000000000001','cc300001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Imran Siddiqui accepted","fee_amount":80000}'),
  ('dd200001-0000-4000-8000-000000000001','475b9f5e-d054-41e7-843e-544afb0b3803','status_changed',     '{"old_status":"registered","new_status":"issues_framed"}'),
  ('dd300001-0000-4000-8000-000000000001','cc100001-0000-4000-8000-000000000001','case_filed',         '{"note":"LRV-2026-0003 inheritance petition filed"}'),
  ('dd300001-0000-4000-8000-000000000001','cc300001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Imran Siddiqui accepted","fee_amount":55000}'),
  ('dd500001-0000-4000-8000-000000000001','cc200001-0000-4000-8000-000000000001','case_filed',         '{"note":"LTR-2026-0001 sale deed cancellation filed by Tariq Nawaz"}'),
  ('dd500001-0000-4000-8000-000000000001','cc300001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Imran Siddiqui accepted","fee_amount":95000}'),
  ('dd500001-0000-4000-8000-000000000001','475b9f5e-d054-41e7-843e-544afb0b3803','status_changed',     '{"old_status":"submitted_to_admin","new_status":"registered"}'),
  ('dd700001-0000-4000-8000-000000000001','cc100001-0000-4000-8000-000000000001','case_filed',         '{"note":"FAM-2026-0001 Khul petition filed by Zara Hussain"}'),
  ('dd700001-0000-4000-8000-000000000001','cc400001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Sana Gul accepted","fee_amount":70000}'),
  ('dd700001-0000-4000-8000-000000000001','c613a1dd-419c-4436-975c-734cfad37b0d','status_changed',     '{"old_status":"issues_framed","new_status":"evidence_stage","note":"Evidence stage commenced"}'),
  ('dd900001-0000-4000-8000-000000000001','a2b3c4d5-e6f7-4890-abcd-ef1234567891','case_filed',         '{"note":"CIV-2026-0010 recovery suit filed by Fatima Bibi"}'),
  ('dd900001-0000-4000-8000-000000000001','3586008a-7dd7-414a-87f2-88479132461c','case_accepted',      '{"note":"Barrister Ali Raza accepted","fee_amount":85000}'),
  ('dd900001-0000-4000-8000-000000000001','c613a1dd-419c-4436-975c-734cfad37b0d','status_changed',     '{"old_status":"evidence_stage","new_status":"arguments","note":"Evidence complete, arguments stage"}')
) AS v(case_id, actor_id, action, details)
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_activity_log l
  WHERE l.case_id = v.case_id::uuid AND l.action = v.action AND l.details::text = v.details
);

-- ── STEP B14: Notifications for new users and cases ──────────────────────────

INSERT INTO public.notifications (user_id, title, message, type, reference_type, is_read)
SELECT user_id::uuid, title, message, type::public.notification_type, reference_type, is_read
FROM (VALUES
  ('cc100001-0000-4000-8000-000000000001','Mutation Case Filed','Your case LRV-2026-0001 (Mutation Cancellation) has been registered.','case_status_changed','case',true),
  ('cc100001-0000-4000-8000-000000000001','Lawyer Accepted Case','Adv. Imran Siddiqui has accepted your land revenue case.','case_assigned','case',true),
  ('cc100001-0000-4000-8000-000000000001','Hearing Scheduled','Hearing No. 3 for LRV-2026-0001 scheduled on 15-Apr-2026.','hearing_scheduled','case',false),
  ('cc100001-0000-4000-8000-000000000001','Inheritance Case Update','Your inheritance petition LRV-2026-0003 is now in evidence stage.','case_status_changed','case',false),
  ('cc100001-0000-4000-8000-000000000001','Interim Maintenance Granted','Court has ordered PKR 25,000/month interim maintenance in FAM-2026-0001.','case_status_changed','case',false),
  ('cc200001-0000-4000-8000-000000000001','Partition Case Registered','Your partition suit LRV-2026-0002 has been registered.','case_status_changed','case',true),
  ('cc200001-0000-4000-8000-000000000001','Hearing Reminder','Commission hearing in LRV-2026-0002 on 10-Mar-2026.','hearing_reminder','case',false),
  ('cc200001-0000-4000-8000-000000000001','Sale Deed Case Update','Handwriting expert report received in LTR-2026-0001. Case in evidence stage.','case_status_changed','case',false),
  ('cc300001-0000-4000-8000-000000000001','New Case Assigned','You have been assigned to LRV-2026-0001 (Mutation Cancellation). Please review.','case_assigned','case',true),
  ('cc300001-0000-4000-8000-000000000001','New Case Assigned','You have been assigned to LRV-2026-0002 (Partition Suit). Please review.','case_assigned','case',true),
  ('cc300001-0000-4000-8000-000000000001','New Case Assigned','You have been assigned to LTR-2026-0001 (Sale Deed Cancellation). Please review.','case_assigned','case',true),
  ('cc300001-0000-4000-8000-000000000001','Expert Report Received','Handwriting expert report filed in LTR-2026-0001. Next hearing 20-Apr-2026.','hearing_scheduled','case',false),
  ('cc400001-0000-4000-8000-000000000001','New Case Assigned','You have been assigned to FAM-2026-0001 (Khul Petition). Please review.','case_assigned','case',true),
  ('cc400001-0000-4000-8000-000000000001','Hearing Reminder','PW-1 cross-examination in FAM-2026-0001 on 10-Apr-2026.','hearing_reminder','case',false),
  ('cc500001-0000-4000-8000-000000000001','New Land Revenue Case','LRV-2026-0001 has been assigned to your court for hearing.','case_assigned','case',true),
  ('cc500001-0000-4000-8000-000000000001','Local Commission Report','Commission report received in LRV-2026-0002 (Partition). Please review.','case_status_changed','case',false),
  ('cc600001-0000-4000-8000-000000000001','Proceedings Required','Please record proceedings for Hearing No. 2 in LRV-2026-0001.','hearing_scheduled','case',false),
  ('71e6fed4-9b07-43c8-a94d-e1adfc2989a4','Land Acquisition Case Submitted','Your case LRV-2026-0004 (Acquisition Challenge) has been submitted for scrutiny.','case_status_changed','case',false),
  ('3586008a-7dd7-414a-87f2-88479132461c','New Recovery Case Assigned','You have been assigned to CIV-2026-0010 (Recovery Suit). Please review.','case_assigned','case',true),
  ('3586008a-7dd7-414a-87f2-88479132461c','Hearing Reminder','Final arguments hearing in CIV-2026-0010 on 25-Apr-2026. Prepare synopsis.','hearing_reminder','case',false)
) AS v(user_id, title, message, type, reference_type, is_read)
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.user_id = v.user_id::uuid AND n.title = v.title
);

-- ============================================================
-- BATCH 3: More Users, Judges, Lawyers, Clients & Diverse Cases
-- Passwords for all new accounts: demo123456
--   client5@civilex.pk   → Shahid Mehmood   (Client, Karachi)
--   client6@civilex.pk   → Nadia Akram      (Client, Rawalpindi)
--   client7@civilex.pk   → Khalid Mahmood   (Client, Multan)
--   lawyer5@civilex.pk   → Barrister Faisal Qureshi  (Criminal/Constitutional)
--   lawyer6@civilex.pk   → Advocate Saima Khan        (Family/Civil)
--   judge3@civilex.pk    → Justice Rubina Tariq        (Trial Judge, Karachi)
--   magistrate2@civilex.pk → Magistrate Omar Farooq   (Magistrate, Rawalpindi)
--   admin2@civilex.pk    → Deputy Registrar Asif Shah  (Admin Court, Multan)
-- ============================================================

-- ── STEP C1: New Auth Users ──────────────────────────────────────────────────

DO $$
DECLARE
  pwd TEXT := crypt('demo123456', gen_salt('bf'));
BEGIN

  -- client5: Shahid Mehmood (Karachi)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee100001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client5@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"client","full_name":"Shahid Mehmood"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee100001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee100001-0000-4000-8000-000000000001',
    'client5@civilex.pk', 'email',
    '{"sub":"ee100001-0000-4000-8000-000000000001","email":"client5@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'client5@civilex.pk' AND provider = 'email');

  -- client6: Nadia Akram (Rawalpindi)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee200001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client6@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"client","full_name":"Nadia Akram"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee200001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee200001-0000-4000-8000-000000000001',
    'client6@civilex.pk', 'email',
    '{"sub":"ee200001-0000-4000-8000-000000000001","email":"client6@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'client6@civilex.pk' AND provider = 'email');

  -- client7: Khalid Mahmood (Multan)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee300001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'client7@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"client","full_name":"Khalid Mahmood"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee300001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee300001-0000-4000-8000-000000000001',
    'client7@civilex.pk', 'email',
    '{"sub":"ee300001-0000-4000-8000-000000000001","email":"client7@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'client7@civilex.pk' AND provider = 'email');

  -- lawyer5: Barrister Faisal Qureshi (Criminal / Constitutional)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee400001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'lawyer5@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"lawyer","full_name":"Barrister Faisal Qureshi"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee400001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee400001-0000-4000-8000-000000000001',
    'lawyer5@civilex.pk', 'email',
    '{"sub":"ee400001-0000-4000-8000-000000000001","email":"lawyer5@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'lawyer5@civilex.pk' AND provider = 'email');

  -- lawyer6: Advocate Saima Khan (Family / Civil)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee500001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'lawyer6@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"lawyer","full_name":"Advocate Saima Khan"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee500001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee500001-0000-4000-8000-000000000001',
    'lawyer6@civilex.pk', 'email',
    '{"sub":"ee500001-0000-4000-8000-000000000001","email":"lawyer6@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'lawyer6@civilex.pk' AND provider = 'email');

  -- judge3: Justice Rubina Tariq (Trial Judge, Karachi)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee600001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'judge3@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"trial_judge","full_name":"Justice Rubina Tariq"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee600001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee600001-0000-4000-8000-000000000001',
    'judge3@civilex.pk', 'email',
    '{"sub":"ee600001-0000-4000-8000-000000000001","email":"judge3@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'judge3@civilex.pk' AND provider = 'email');

  -- magistrate2: Magistrate Omar Farooq (Rawalpindi)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee700001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'magistrate2@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"magistrate","full_name":"Magistrate Omar Farooq"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee700001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee700001-0000-4000-8000-000000000001',
    'magistrate2@civilex.pk', 'email',
    '{"sub":"ee700001-0000-4000-8000-000000000001","email":"magistrate2@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'magistrate2@civilex.pk' AND provider = 'email');

  -- admin2: Deputy Registrar Asif Shah (Multan)
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) SELECT
    'ee800001-0000-4000-8000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'admin2@civilex.pk', pwd, NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin_court","full_name":"Deputy Registrar Asif Shah"}',
    NOW(), NOW(), 'authenticated', 'authenticated', '', '', '', ''
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'ee800001-0000-4000-8000-000000000001');

  INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  SELECT gen_random_uuid(), 'ee800001-0000-4000-8000-000000000001',
    'admin2@civilex.pk', 'email',
    '{"sub":"ee800001-0000-4000-8000-000000000001","email":"admin2@civilex.pk","email_verified":true}',
    NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM auth.identities WHERE provider_id = 'admin2@civilex.pk' AND provider = 'email');

END $$;

-- ── STEP C2: Update New Profiles ─────────────────────────────────────────────

UPDATE public.profiles SET
  full_name = 'Shahid Mehmood',
  phone     = '03002223344',
  cnic      = '42101-1234567-3',
  address   = 'Flat 4-B, Block 9, Gulshan-e-Iqbal, Karachi',
  city      = 'Karachi'
WHERE id = 'ee100001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Nadia Akram',
  phone     = '03135559988',
  cnic      = '37201-9876543-5',
  address   = 'House 22, Satellite Town, Rawalpindi',
  city      = 'Rawalpindi'
WHERE id = 'ee200001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Khalid Mahmood',
  phone     = '03006667788',
  cnic      = '36302-4567891-2',
  address   = '15 Nishtar Colony, Multan',
  city      = 'Multan'
WHERE id = 'ee300001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Barrister Faisal Qureshi',
  phone     = '02135550011',
  cnic      = '42201-5544332-1',
  address   = 'Supreme Court Bar, Karachi Registry',
  city      = 'Karachi'
WHERE id = 'ee400001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Advocate Saima Khan',
  phone     = '03015554455',
  cnic      = '37201-2233445-6',
  address   = 'Family Court Complex, Rawalpindi',
  city      = 'Rawalpindi'
WHERE id = 'ee500001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Justice Rubina Tariq',
  phone     = '02135556677',
  address   = 'District & Sessions Court, Karachi South',
  city      = 'Karachi'
WHERE id = 'ee600001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Magistrate Omar Farooq',
  phone     = '03005558899',
  address   = 'Judicial Complex, Rawalpindi',
  city      = 'Rawalpindi'
WHERE id = 'ee700001-0000-4000-8000-000000000001';

UPDATE public.profiles SET
  full_name = 'Deputy Registrar Asif Shah',
  phone     = '06135551122',
  address   = 'District Courts Complex, Multan',
  city      = 'Multan'
WHERE id = 'ee800001-0000-4000-8000-000000000001';

-- ── STEP C3: New Lawyer Profiles ─────────────────────────────────────────────

INSERT INTO public.lawyer_profiles (id, bar_license_number, specialization, experience_years, bio, hourly_rate, rating, total_reviews, is_available, location)
VALUES (
  'ee400001-0000-4000-8000-000000000001',
  'KHI-2009-1188',
  ARRAY['Criminal', 'Constitutional', 'Anti-Terrorism', 'Cyber'],
  17,
  'Senior criminal advocate with extensive experience before Session Courts, High Court, and Supreme Court. Handled over 300 criminal matters including high-profile murder, terrorism, and cyber fraud cases.',
  12000, 4.9, 87, true, 'Karachi'
) ON CONFLICT (id) DO UPDATE SET
  specialization   = EXCLUDED.specialization,
  experience_years = EXCLUDED.experience_years,
  bio              = EXCLUDED.bio;

INSERT INTO public.lawyer_profiles (id, bar_license_number, specialization, experience_years, bio, hourly_rate, rating, total_reviews, is_available, location)
VALUES (
  'ee500001-0000-4000-8000-000000000001',
  'RWP-2016-4422',
  ARRAY['Family', 'Civil', 'Guardianship', 'Inheritance'],
  9,
  'Experienced family law advocate based in Rawalpindi with specialization in divorce, custody, guardianship, and succession cases. Strong track record in family court matters across Punjab.',
  5500, 4.6, 41, true, 'Rawalpindi'
) ON CONFLICT (id) DO UPDATE SET
  specialization   = EXCLUDED.specialization,
  experience_years = EXCLUDED.experience_years,
  bio              = EXCLUDED.bio;

-- ── STEP C4: New Cases (diverse types and statuses) ──────────────────────────

-- FAM-2026-0002: Divorce & Maintenance (reserved_for_judgment) — Shahid vs Nadia
DELETE FROM public.cases WHERE case_number = 'FAM-2026-0002' AND id != 'ff100001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, defendant_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  marriage_certificate_number,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'ff100001-0000-4000-8000-000000000001'::uuid,
  'FAM-2026-0002', 'family', 'marriage_divorce', 'reserved_for_judgment',
  'Shahid Mehmood vs Nadia Akram - Restitution of Conjugal Rights',
  'Suit for restitution of conjugal rights under Section 9 of the Family Courts Act 1964. The plaintiff (husband) alleges that the defendant (wife) has deserted the matrimonial home without lawful excuse since 01-09-2025. Counter-claim filed by defendant for maintenance and dower.',
  'ee100001-0000-4000-8000-000000000001',
  'ee200001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'ee600001-0000-4000-8000-000000000001',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'Shahid Mehmood', '03002223344', '42101-1234567-3', 'Flat 4-B, Block 9, Gulshan-e-Iqbal, Karachi',
  'Nadia Akram', '03135559988', '37201-9876543-5', 'House 22, Satellite Town, Rawalpindi',
  'NKC-2020-78901',
  'family_court', 'sensitive', '2025-10-05', '2025-10-14',
  'Decree for restitution of conjugal rights. In alternative, decree of dissolution. Custody of minor daughter Hira (5 years). Return of dower PKR 3,00,000.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff100001-0000-4000-8000-000000000001');

-- FAM-2026-0003: Guardianship Petition (evidence_stage) — Nadia Akram
DELETE FROM public.cases WHERE case_number = 'FAM-2026-0003' AND id != 'ff200001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'ff200001-0000-4000-8000-000000000001'::uuid,
  'FAM-2026-0003', 'family', 'guardianship', 'evidence_stage',
  'Nadia Akram vs Bilal Anwar - Guardianship of Minor',
  'Petition under the Guardian and Wards Act 1890 for appointment of petitioner as sole guardian of minor son Usman (8 years). Father (respondent) is alleged to be a drug addict and unfit guardian. Petitioner is the natural mother currently residing in Rawalpindi.',
  'ee200001-0000-4000-8000-000000000001',
  'ee700001-0000-4000-8000-000000000001',
  'ee600001-0000-4000-8000-000000000001',
  '51fd1e7a-86a8-4e5e-9445-18fd947e64b7',
  'Nadia Akram', '03135559988', '37201-9876543-5', 'House 22, Satellite Town, Rawalpindi',
  'Bilal Anwar', '03005556789', '37201-1234560-8', '7 Dhoke Hassu, Rawalpindi',
  'family_court', 'sensitive', '2025-12-01', '2025-12-10',
  'Appointment as sole guardian of minor Usman. Interim custody pending final decision. Maintenance of PKR 30,000/month. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff200001-0000-4000-8000-000000000001');

-- CRM-2026-0004: Murder Case (preliminary_hearing) — Khalid Mahmood complainant
DELETE FROM public.cases WHERE case_number = 'CRM-2026-0004' AND id != 'ff300001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'ff300001-0000-4000-8000-000000000001'::uuid,
  'CRM-2026-0004', 'criminal', 'criminal', 'preliminary_hearing',
  'State vs Wasim Akram and Others - Murder (Section 302 PPC)',
  'FIR No. 112/2026 at Multan City Police Station. Complainant Khalid Mahmood alleges that on 10-03-2026 at approximately 9:00 PM, accused Wasim Akram along with two accomplices (unknown) opened fire at the deceased Muhammad Iqbal (brother of complainant) near Dera Adda, Multan, killing him on the spot. Motive stated to be old enmity over agricultural land.',
  'ee300001-0000-4000-8000-000000000001',
  'ee800001-0000-4000-8000-000000000001',
  'Khalid Mahmood', '03006667788', '36302-4567891-2', '15 Nishtar Colony, Multan',
  'Wasim Akram and co-accused', '03009871234', 'Dera Adda Area, Multan',
  'admin_court', 'highly_sensitive', '2026-03-11', '2026-03-15',
  'Prosecution and exemplary punishment of accused under Section 302 PPC. FIR to be read in full.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff300001-0000-4000-8000-000000000001');

-- CRM-2026-0005: Cybercrime / Online Fraud (issues_framed) — Nadia Akram complainant
DELETE FROM public.cases WHERE case_number = 'CRM-2026-0005' AND id != 'ff400001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'ff400001-0000-4000-8000-000000000001'::uuid,
  'CRM-2026-0005', 'criminal', 'criminal', 'issues_framed',
  'State vs Cyber Fraud Syndicate - Online Banking Fraud',
  'Complaint under Prevention of Electronic Crimes Act 2016 (PECA) Sections 10, 13, 16 and Section 420 PPC. Complainant Nadia Akram lost PKR 8,50,000 via phishing attack targeting her HBL account. FIR No. 67/2026 registered at FIA Cyber Crime Wing, Rawalpindi. Three accused identified through IP tracing.',
  'ee200001-0000-4000-8000-000000000001',
  'ee700001-0000-4000-8000-000000000001',
  'Nadia Akram', '03135559988', '37201-9876543-5', 'House 22, Satellite Town, Rawalpindi',
  'Ali Hassan, Asad Rehman and others', '03221122334', 'E-8/1, Islamabad',
  'admin_court', 'highly_sensitive', '2025-11-20', '2025-11-28',
  'Prosecution of accused under PECA 2016. Recovery of defrauded amount PKR 8,50,000. Compensation order.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff400001-0000-4000-8000-000000000001');

-- CIV-2026-0013: Tenant Eviction (issues_framed) — Shahid Mehmood
DELETE FROM public.cases WHERE case_number = 'CIV-2026-0013' AND id != 'ff500001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'ff500001-0000-4000-8000-000000000001'::uuid,
  'CIV-2026-0013', 'civil', 'civil', 'issues_framed',
  'Shahid Mehmood vs Tahir Abbas - Suit for Ejectment',
  'Suit for ejectment of the defendant who is a tenant in commercial property at Shop No. 14, Block-3, Gulshan-e-Iqbal, Karachi. Tenancy expired on 31-12-2025. Defendant refuses to vacate. Monthly rent of PKR 45,000 outstanding for 6 months. Suit is filed under Sindh Rented Premises Ordinance 1979.',
  'ee100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'ee600001-0000-4000-8000-000000000001',
  'cc600001-0000-4000-8000-000000000001',
  'Shahid Mehmood', '03002223344', '42101-1234567-3', 'Flat 4-B, Block 9, Gulshan-e-Iqbal, Karachi',
  'Tahir Abbas', '03221234567', '42101-9876543-7', 'Shop 14, Block 3, Gulshan-e-Iqbal, Karachi',
  'trial_court', 'normal', '2026-01-15', '2026-01-22',
  'Decree for ejectment and delivery of vacant possession of Shop No. 14. Recovery of outstanding rent PKR 2,70,000. Mesne profits at PKR 45,000/month till vacation. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff500001-0000-4000-8000-000000000001');

-- CIV-2026-0014: Insurance Claim Dispute (evidence_stage) — Nadia Akram
DELETE FROM public.cases WHERE case_number = 'CIV-2026-0014' AND id != 'ff600001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'ff600001-0000-4000-8000-000000000001'::uuid,
  'CIV-2026-0014', 'civil', 'civil', 'evidence_stage',
  'Nadia Akram vs State Life Insurance - Insurance Claim',
  'Suit for recovery of insurance death benefit of PKR 50,00,000 under a life insurance policy (Policy No. SL-2019-456789) on the life of deceased husband Bilal Anwar. The defendant (insurance company) has repudiated the claim alleging non-disclosure of pre-existing medical condition. Plaintiff contests this repudiation.',
  'ee200001-0000-4000-8000-000000000001',
  'ee700001-0000-4000-8000-000000000001',
  'ee600001-0000-4000-8000-000000000001',
  'cc600001-0000-4000-8000-000000000001',
  'Nadia Akram', '03135559988', '37201-9876543-5', 'House 22, Satellite Town, Rawalpindi',
  'State Life Insurance Corporation of Pakistan', '051-9201234', 'State Life Building, Islamabad',
  'trial_court', 'normal', '2025-08-10', '2025-08-20',
  'Recovery of death benefit PKR 50,00,000. Mark-up at 10% p.a. from date of repudiation. Costs of the suit.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff600001-0000-4000-8000-000000000001');

-- LRV-2026-0005: Benami Land Transfer Challenge (arguments) — Khalid Mahmood
DELETE FROM public.cases WHERE case_number = 'LRV-2026-0005' AND id != 'ff700001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id, trial_judge_id, stenographer_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_cnic, defendant_address,
  current_phase, sensitivity, filing_date, registration_date, relief_sought
)
SELECT
  'ff700001-0000-4000-8000-000000000001'::uuid,
  'LRV-2026-0005', 'land_revenue', 'land_mutation', 'arguments',
  'Khalid Mahmood vs Anwar Brothers - Benami Transfer Challenge',
  'Petition challenging benami transfer of agricultural land measuring 18 Kanals in Mauza Qadirpur, Multan, made in favour of defendant (Anwar Brothers firm) by the plaintiff''s deceased father without valid consideration. The transfer is alleged to be benami under the Benami Transactions (Prohibition) Act 2017 to defeat the rights of legal heirs.',
  'ee300001-0000-4000-8000-000000000001',
  'ee800001-0000-4000-8000-000000000001',
  'ee600001-0000-4000-8000-000000000001',
  'cc600001-0000-4000-8000-000000000001',
  'Khalid Mahmood', '03006667788', '36302-4567891-2', '15 Nishtar Colony, Multan',
  'Anwar Brothers (Firm)', '06135550022', NULL, 'Anwar Building, Hussain Agahi, Multan',
  'revenue_court', 'sensitive', '2025-07-01', '2025-07-10',
  'Declaration of benami nature of transfer. Setting aside of mutation in favour of Anwar Brothers. Restoration of land to estate of deceased. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff700001-0000-4000-8000-000000000001');

-- LTR-2026-0003: Mortgage Dispute (submitted_to_admin) — Shahid Mehmood
DELETE FROM public.cases WHERE case_number = 'LTR-2026-0003' AND id != 'ff800001-0000-4000-8000-000000000001';
INSERT INTO public.cases (
  id, case_number, case_type, case_category, status, title, description,
  plaintiff_id, admin_court_id,
  plaintiff_name, plaintiff_phone, plaintiff_cnic, plaintiff_address,
  defendant_name, defendant_phone, defendant_address,
  current_phase, sensitivity, filing_date, relief_sought
)
SELECT
  'ff800001-0000-4000-8000-000000000001'::uuid,
  'LTR-2026-0003', 'land_transfer', 'land_mortgage', 'submitted_to_admin',
  'Shahid Mehmood vs MCB Bank - Mortgage Redemption',
  'Suit for redemption of mortgage under Section 60 of the Transfer of Property Act 1882. Plaintiff executed a mortgage over residential apartment (Flat 4-B, Block 9, Gulshan-e-Iqbal, Karachi) in favour of MCB Bank as security for a loan of PKR 60,00,000. Plaintiff has repaid the principal amount but bank refuses to release the mortgage citing disputed interest calculations.',
  'ee100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  'Shahid Mehmood', '03002223344', '42101-1234567-3', 'Flat 4-B, Block 9, Gulshan-e-Iqbal, Karachi',
  'MCB Bank Limited', '021-35680101', 'MCB Tower, I.I. Chundrigar Road, Karachi',
  'admin_court', 'sensitive', '2026-04-10',
  'Decree for redemption of mortgage upon tender of any balance legitimately outstanding. Return of title documents. Removal of charge from property records. Costs.'
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE id = 'ff800001-0000-4000-8000-000000000001');

-- ── STEP C5: Land Case Details ────────────────────────────────────────────────

-- LRV-2026-0005 – Benami transfer, Multan
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, mutation_number, revenue_officer
)
SELECT
  'ff700001-0000-4000-8000-000000000001',
  '210/4-5', 'KHW-884', 'Multan', 'Multan Sadar', 'Mauza Qadirpur',
  '18 Kanals', 'agricultural', '4457', 'Patwari Farooq Baig'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'ff700001-0000-4000-8000-000000000001');

-- LTR-2026-0003 – Mortgage, Karachi
INSERT INTO public.land_case_details (
  case_id, khasra_number, khewat_number, district, tehsil, mauza,
  total_area, land_type, deed_number, deed_date, registration_authority
)
SELECT
  'ff800001-0000-4000-8000-000000000001',
  'F-4B/Block9', 'N/A', 'Karachi East', 'Gulshan', 'Gulshan-e-Iqbal',
  '1200 sq ft', 'residential', 'MCB-MTG-2021-0034', '2021-06-15',
  'Sub-Registrar Karachi East'
WHERE NOT EXISTS (SELECT 1 FROM public.land_case_details WHERE case_id = 'ff800001-0000-4000-8000-000000000001');

-- ── STEP C6: Criminal Case Details ───────────────────────────────────────────

-- CRM-2026-0004 – Murder case, Multan
INSERT INTO public.criminal_case_details (
  case_id, fir_number, police_station, offense_section, offense_description,
  io_name, bail_status
)
SELECT
  'ff300001-0000-4000-8000-000000000001',
  'FIR-112/2026', 'Multan City Police Station',
  'Section 302/34 PPC',
  'Murder of Muhammad Iqbal (s/o Rehmat Ali) by firearm at Dera Adda, Multan. Three accused: Wasim Akram (named), two unidentified. Motive: land enmity. Deceased died on the spot from bullet wounds to chest and head.',
  'DSP Muhammad Arif', 'denied'
WHERE NOT EXISTS (
  SELECT 1 FROM public.criminal_case_details WHERE case_id = 'ff300001-0000-4000-8000-000000000001'
);

-- CRM-2026-0005 – Cybercrime, Rawalpindi
INSERT INTO public.criminal_case_details (
  case_id, fir_number, police_station, offense_section, offense_description,
  io_name, bail_status
)
SELECT
  'ff400001-0000-4000-8000-000000000001',
  'FIR-67/2026', 'FIA Cyber Crime Wing, Rawalpindi',
  'Sections 10, 13, 16 PECA 2016 / Section 420 PPC',
  'Online banking fraud. Victim Nadia Akram defrauded of PKR 8,50,000 via phishing SMS mimicking HBL. Three accused identified through FIA IP trace: Ali Hassan, Asad Rehman, and Sadia Manzoor. Funds transferred to multiple mule accounts.',
  'Inspector Tariq Bashir (FIA)', 'granted'
WHERE NOT EXISTS (
  SELECT 1 FROM public.criminal_case_details WHERE case_id = 'ff400001-0000-4000-8000-000000000001'
);

-- ── STEP C7: Case Assignments ─────────────────────────────────────────────────

-- Lawyer6 (Saima Khan) on FAM-2026-0002 – plaintiff side (Shahid)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff100001-0000-4000-8000-000000000001', 'ee500001-0000-4000-8000-000000000001',
       'ee100001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 80000, '2025-10-16'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff100001-0000-4000-8000-000000000001' AND lawyer_id = 'ee500001-0000-4000-8000-000000000001'
);

-- Lawyer6 on FAM-2026-0003 – Guardianship (plaintiff side – Nadia)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff200001-0000-4000-8000-000000000001', 'ee500001-0000-4000-8000-000000000001',
       'ee200001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 60000, '2025-12-12'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff200001-0000-4000-8000-000000000001' AND lawyer_id = 'ee500001-0000-4000-8000-000000000001'
);

-- Lawyer5 (Faisal Qureshi) on CRM-2026-0004 – plaintiff side (Khalid)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff300001-0000-4000-8000-000000000001', 'ee400001-0000-4000-8000-000000000001',
       'ee300001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 150000, '2026-03-18'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff300001-0000-4000-8000-000000000001' AND lawyer_id = 'ee400001-0000-4000-8000-000000000001'
);

-- Lawyer5 on CRM-2026-0005 – Cybercrime (plaintiff side – Nadia)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff400001-0000-4000-8000-000000000001', 'ee400001-0000-4000-8000-000000000001',
       'ee200001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 90000, '2025-11-30'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff400001-0000-4000-8000-000000000001' AND lawyer_id = 'ee400001-0000-4000-8000-000000000001'
);

-- Lawyer2 (Ayesha Malik) on CIV-2026-0013 – Ejectment (plaintiff side – Shahid)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff500001-0000-4000-8000-000000000001', '1e1e6011-e4ab-446c-8592-a4dbb4168810',
       'ee100001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 55000, '2026-01-24'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff500001-0000-4000-8000-000000000001' AND lawyer_id = '1e1e6011-e4ab-446c-8592-a4dbb4168810'
);

-- Lawyer6 on CIV-2026-0014 – Insurance dispute (plaintiff side – Nadia)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff600001-0000-4000-8000-000000000001', 'ee500001-0000-4000-8000-000000000001',
       'ee200001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 100000, '2025-08-22'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff600001-0000-4000-8000-000000000001' AND lawyer_id = 'ee500001-0000-4000-8000-000000000001'
);

-- Lawyer3 (Imran Siddiqui) on LRV-2026-0005 – Benami (plaintiff side – Khalid)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff700001-0000-4000-8000-000000000001', 'cc300001-0000-4000-8000-000000000001',
       'ee300001-0000-4000-8000-000000000001', 'plaintiff', 'accepted', 110000, '2025-07-12'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff700001-0000-4000-8000-000000000001' AND lawyer_id = 'cc300001-0000-4000-8000-000000000001'
);

-- Lawyer1 (Ali Raza) on LTR-2026-0003 – Mortgage (plaintiff side – Shahid)
INSERT INTO public.case_assignments (case_id, lawyer_id, client_id, side, status, fee_amount, assigned_at)
SELECT 'ff800001-0000-4000-8000-000000000001', '3586008a-7dd7-414a-87f2-88479132461c',
       'ee100001-0000-4000-8000-000000000001', 'plaintiff', 'pending', 70000, '2026-04-12'
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_assignments
  WHERE case_id = 'ff800001-0000-4000-8000-000000000001' AND lawyer_id = '3586008a-7dd7-414a-87f2-88479132461c'
);

-- ── STEP C8: Payments for new cases ──────────────────────────────────────────

-- Court fee FAM-2026-0002 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'ee010001-0000-4000-8000-000000000001'::uuid,
  'ff100001-0000-4000-8000-000000000001', 'ee100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  5000, 'court_fee', 'jazzcash', 'completed', 'TXN-2025-FAM-0002',
  'Court fee for FAM-2026-0002 (Restitution of Conjugal Rights)', '2025-10-12 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee010001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee FAM-2026-0002 instalment 1/2 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, is_installment, installment_number, total_installments,
  description, paid_at)
SELECT 'ee020001-0000-4000-8000-000000000001'::uuid,
  'ff100001-0000-4000-8000-000000000001', 'ee100001-0000-4000-8000-000000000001',
  'ee500001-0000-4000-8000-000000000001',
  40000, 'lawyer_fee', 'easypaisa', 'completed', 'TXN-2025-FAM-LAW-01',
  true, 1, 2, 'Lawyer fee instalment 1/2 – Adv. Saima Khan (FAM-2026-0002)', '2025-10-18 14:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee020001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee FAM-2026-0002 instalment 2/2 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, is_installment, installment_number, total_installments,
  parent_payment_id, description, paid_at)
SELECT 'ee030001-0000-4000-8000-000000000001'::uuid,
  'ff100001-0000-4000-8000-000000000001', 'ee100001-0000-4000-8000-000000000001',
  'ee500001-0000-4000-8000-000000000001',
  40000, 'lawyer_fee', 'jazzcash', 'completed', 'TXN-2025-FAM-LAW-02',
  true, 2, 2, 'ee020001-0000-4000-8000-000000000001'::uuid,
  'Lawyer fee instalment 2/2 – Adv. Saima Khan (FAM-2026-0002)', '2025-12-18 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee030001-0000-4000-8000-000000000001'::uuid);

-- Court fee FAM-2026-0003 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'ee040001-0000-4000-8000-000000000001'::uuid,
  'ff200001-0000-4000-8000-000000000001', 'ee200001-0000-4000-8000-000000000001',
  'ee700001-0000-4000-8000-000000000001',
  3500, 'court_fee', 'easypaisa', 'completed', 'TXN-2025-FAM-0003',
  'Court fee for FAM-2026-0003 (Guardianship Petition)', '2025-12-08 09:30:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee040001-0000-4000-8000-000000000001'::uuid);

-- Court fee CRM-2026-0004 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'ee050001-0000-4000-8000-000000000001'::uuid,
  'ff300001-0000-4000-8000-000000000001', 'ee300001-0000-4000-8000-000000000001',
  'ee800001-0000-4000-8000-000000000001',
  2000, 'court_fee', 'bank_transfer', 'completed', 'TXN-2026-CRM-0004',
  'Court fee for CRM-2026-0004 (Murder Case)', '2026-03-13 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee050001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee CRM-2026-0004 – instalment 1/3 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, is_installment, installment_number, total_installments,
  description, paid_at)
SELECT 'ee060001-0000-4000-8000-000000000001'::uuid,
  'ff300001-0000-4000-8000-000000000001', 'ee300001-0000-4000-8000-000000000001',
  'ee400001-0000-4000-8000-000000000001',
  50000, 'lawyer_fee', 'jazzcash', 'completed', 'TXN-2026-CRM-LAW-01',
  true, 1, 3, 'Lawyer fee instalment 1/3 – Barrister Faisal Qureshi', '2026-03-20 12:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee060001-0000-4000-8000-000000000001'::uuid);

-- Lawyer fee CRM-2026-0004 – instalment 2/3 (pending)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, is_installment, installment_number, total_installments,
  parent_payment_id, description)
SELECT 'ee070001-0000-4000-8000-000000000001'::uuid,
  'ff300001-0000-4000-8000-000000000001', 'ee300001-0000-4000-8000-000000000001',
  'ee400001-0000-4000-8000-000000000001',
  50000, 'lawyer_fee', 'jazzcash', 'pending',
  true, 2, 3, 'ee060001-0000-4000-8000-000000000001'::uuid,
  'Lawyer fee instalment 2/3 – Barrister Faisal Qureshi'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee070001-0000-4000-8000-000000000001'::uuid);

-- Court fee CIV-2026-0013 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'ee080001-0000-4000-8000-000000000001'::uuid,
  'ff500001-0000-4000-8000-000000000001', 'ee100001-0000-4000-8000-000000000001',
  '475b9f5e-d054-41e7-843e-544afb0b3803',
  10000, 'court_fee', 'card', 'completed', 'TXN-2026-CIV-0013',
  'Court fee for CIV-2026-0013 (Ejectment Suit)', '2026-01-20 09:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee080001-0000-4000-8000-000000000001'::uuid);

-- Court fee CIV-2026-0014 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'ee090001-0000-4000-8000-000000000001'::uuid,
  'ff600001-0000-4000-8000-000000000001', 'ee200001-0000-4000-8000-000000000001',
  'ee700001-0000-4000-8000-000000000001',
  50000, 'court_fee', 'bank_transfer', 'completed', 'TXN-2025-CIV-0014',
  'Court fee for CIV-2026-0014 (Insurance Claim, PKR 50L suit)', '2025-08-18 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee090001-0000-4000-8000-000000000001'::uuid);

-- Court fee LRV-2026-0005 (completed)
INSERT INTO public.payments (id, case_id, payer_id, receiver_id, amount, payment_type,
  payment_method, status, transaction_id, description, paid_at)
SELECT 'ee0a0001-0000-4000-8000-000000000001'::uuid,
  'ff700001-0000-4000-8000-000000000001', 'ee300001-0000-4000-8000-000000000001',
  'ee800001-0000-4000-8000-000000000001',
  9000, 'court_fee', 'jazzcash', 'completed', 'TXN-2025-LRV-0005',
  'Court fee for LRV-2026-0005 (Benami Challenge)', '2025-07-08 10:30:00'
WHERE NOT EXISTS (SELECT 1 FROM public.payments WHERE id = 'ee0a0001-0000-4000-8000-000000000001'::uuid);

-- ── STEP C9: Scrutiny Records for new cases ───────────────────────────────────

-- FAM-2026-0002 (approved)
INSERT INTO public.scrutiny_checklist (case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at)
SELECT 'ff100001-0000-4000-8000-000000000001', '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true, 'approved',
  'Nikahnama attached. NADRA verification done. Parties resident in Karachi – jurisdiction confirmed. Court fee paid. Petition in prescribed format. Admitted.',
  '2025-10-13 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'ff100001-0000-4000-8000-000000000001');

-- FAM-2026-0003 (approved)
INSERT INTO public.scrutiny_checklist (case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at)
SELECT 'ff200001-0000-4000-8000-000000000001', 'ee700001-0000-4000-8000-000000000001',
  true, true, true, true, true, true, true, 'approved',
  'Birth certificate of minor attached. Petitioner''s identity established. Family court jurisdiction confirmed (minor ordinarily resides in Rawalpindi). Admitted.',
  '2025-12-09 10:30:00'
WHERE NOT EXISTS (SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'ff200001-0000-4000-8000-000000000001');

-- CRM-2026-0004 (approved)
INSERT INTO public.scrutiny_checklist (case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at)
SELECT 'ff300001-0000-4000-8000-000000000001', 'ee800001-0000-4000-8000-000000000001',
  true, true, true, true, true, true, true, 'approved',
  'Certified copy of FIR 112/2026 attached. Post-mortem report and inquest report annexed. Sessions court has jurisdiction for Section 302 PPC offence. Admitted for proceedings.',
  '2026-03-14 09:30:00'
WHERE NOT EXISTS (SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'ff300001-0000-4000-8000-000000000001');

-- CRM-2026-0005 (approved)
INSERT INTO public.scrutiny_checklist (case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at)
SELECT 'ff400001-0000-4000-8000-000000000001', 'ee700001-0000-4000-8000-000000000001',
  true, true, true, true, true, true, true, 'approved',
  'FIA complaint with IP trace report attached. Bank transaction records annexed. Jurisdiction of Special Court (PECA) confirmed. Admitted.',
  '2025-11-26 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'ff400001-0000-4000-8000-000000000001');

-- CIV-2026-0013 (approved)
INSERT INTO public.scrutiny_checklist (case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at)
SELECT 'ff500001-0000-4000-8000-000000000001', '475b9f5e-d054-41e7-843e-544afb0b3803',
  true, true, true, true, true, true, true, 'approved',
  'Tenancy agreement, rent receipts, and legal notice attached. Rent Controller jurisdiction confirmed. Court fee paid on claimed arrears. Admitted.',
  '2026-01-21 11:30:00'
WHERE NOT EXISTS (SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'ff500001-0000-4000-8000-000000000001');

-- CIV-2026-0014 (approved)
INSERT INTO public.scrutiny_checklist (case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at)
SELECT 'ff600001-0000-4000-8000-000000000001', 'ee700001-0000-4000-8000-000000000001',
  true, true, true, true, true, true, true, 'approved',
  'Insurance policy copy, repudiation letter, death certificate attached. Court fee paid as per insurance claim value. Limitation period within 6 years of repudiation. Admitted.',
  '2025-08-19 10:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'ff600001-0000-4000-8000-000000000001');

-- LRV-2026-0005 (approved)
INSERT INTO public.scrutiny_checklist (case_id, reviewed_by,
  proper_documentation, court_fees_paid, jurisdiction_verified,
  parties_identified, cause_of_action_valid, limitation_period_checked, proper_format,
  decision, remarks, reviewed_at)
SELECT 'ff700001-0000-4000-8000-000000000001', 'ee800001-0000-4000-8000-000000000001',
  true, true, true, true, true, true, true, 'approved',
  'Certified copy of disputed mutation and revenue record attached. Benami Transactions Act 2017 provides cause of action. Revenue court jurisdiction confirmed. Court fee paid. Admitted.',
  '2025-07-09 11:00:00'
WHERE NOT EXISTS (SELECT 1 FROM public.scrutiny_checklist WHERE case_id = 'ff700001-0000-4000-8000-000000000001');

-- ── STEP C10: Hearings for new cases ──────────────────────────────────────────

-- FAM-2026-0002 – Hearing 1: Conciliation (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe010001-0000-4000-8000-000000000001'::uuid,
  'ff100001-0000-4000-8000-000000000001',
  1, 'preliminary', '2025-10-20 10:00:00', '2025-10-20 11:15:00',
  'ee600001-0000-4000-8000-000000000001', 'Family Court Room 1, Karachi',
  'First hearing. Conciliation proceedings conducted per Family Courts Act. Plaintiff appeared with counsel; defendant appeared in person (no counsel). Reconciliation attempted; defendant denied any cruelty or desertion but refused to return. Conciliation failed.',
  'Conciliation failed. Parties to proceed for evidence. Interim maintenance of PKR 20,000/month for minor Hira ordered from today.',
  '2025-11-18 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe010001-0000-4000-8000-000000000001'::uuid);

-- FAM-2026-0002 – Hearing 2: Evidence (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe020001-0000-4000-8000-000000000001'::uuid,
  'ff100001-0000-4000-8000-000000000001',
  2, 'regular', '2025-11-18 10:00:00', '2025-11-18 11:30:00',
  'ee600001-0000-4000-8000-000000000001', 'Family Court Room 1, Karachi',
  'PW-1 (Plaintiff Shahid Mehmood) examined. Marriage certificate Exh. P-1, Nikahnama Exh. P-2 tendered. WhatsApp messages (Exh. P-3) showing defendant''s refusal to return admitted. Cross-examination: defendant''s counsel questioned plaintiff on alleged cruelty claims. No counter claim for divorce pressed at this stage.',
  'PW-1 cross-examination concluded. Defendant''s evidence on next date. Case is proceeding at pace.',
  '2025-12-20 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe020001-0000-4000-8000-000000000001'::uuid);

-- FAM-2026-0002 – Hearing 3: Arguments (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe030001-0000-4000-8000-000000000001'::uuid,
  'ff100001-0000-4000-8000-000000000001',
  3, 'final_arguments', '2026-02-10 10:00:00', '2026-02-10 12:00:00',
  'ee600001-0000-4000-8000-000000000001', 'Family Court Room 1, Karachi',
  'Final arguments heard from both sides. Plaintiff''s counsel argued that desertion is established. Defendant''s counsel argued no cruelty occurred and sought dismissal. Written synopses filed by both parties. Judgment reserved.',
  'Judgment reserved. To be announced on next date.',
  '2026-03-05 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe030001-0000-4000-8000-000000000001'::uuid);

-- FAM-2026-0003 – Hearing 1: Guardianship (preliminary, completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe040001-0000-4000-8000-000000000001'::uuid,
  'ff200001-0000-4000-8000-000000000001',
  1, 'preliminary', '2025-12-18 11:00:00', '2025-12-18 12:00:00',
  'ee600001-0000-4000-8000-000000000001', 'Family Court Room 2, Rawalpindi',
  'Preliminary hearing in guardianship petition. Both parents appeared. Minor welfare report ordered from District Social Welfare Officer. Interim custody granted to petitioner-mother. Respondent-father granted visiting rights every other Sunday.',
  'DSWO report due within 30 days. Respondent warned against interfering with minor''s schooling or residence.',
  '2026-01-20 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe040001-0000-4000-8000-000000000001'::uuid);

-- FAM-2026-0003 – Hearing 2: Evidence (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe050001-0000-4000-8000-000000000001'::uuid,
  'ff200001-0000-4000-8000-000000000001',
  2, 'regular', '2026-01-20 11:00:00', '2026-01-20 12:30:00',
  'ee600001-0000-4000-8000-000000000001', 'Family Court Room 2, Rawalpindi',
  'DSWO welfare report received and marked Exh. C-1. Report recommends custody with mother as it serves the welfare of the minor. PW-1 (Nadia Akram) examined in chief. Medical evidence of respondent''s drug use (Exh. P-2) tendered. Cross-examination on next date.',
  'DSWO report supports petitioner. PW-1 cross-examination on next date. Respondent to arrange clean chit from PEMRA/health authority if relying on sobriety claim.',
  '2026-02-25 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe050001-0000-4000-8000-000000000001'::uuid);

-- CRM-2026-0004 – Hearing 1: Charge framing (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe060001-0000-4000-8000-000000000001'::uuid,
  'ff300001-0000-4000-8000-000000000001',
  1, 'preliminary', '2026-03-25 09:00:00', '2026-03-25 10:30:00',
  'ee800001-0000-4000-8000-000000000001', 'Sessions Court Room 3, Multan',
  'Case registered and challan submitted by prosecution. Charge under Section 302/34 PPC framed and read to accused Wasim Akram. Accused pleaded not guilty. Case transferred to Sessions Court for trial. Bail application to be filed separately.',
  'Charge framed. Case at trial stage. Prosecution to produce witnesses starting next date. IO to be summoned first.',
  '2026-04-20 09:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe060001-0000-4000-8000-000000000001'::uuid);

-- CRM-2026-0005 – Hearing 1: Appearance (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe070001-0000-4000-8000-000000000001'::uuid,
  'ff400001-0000-4000-8000-000000000001',
  1, 'preliminary', '2025-12-05 10:00:00', '2025-12-05 11:00:00',
  'ee700001-0000-4000-8000-000000000001', 'Special Court (PECA), Rawalpindi',
  'First hearing. All three accused appeared on bail. FIA charge sheet and digital forensics report produced. Issues framed: (1) Whether accused committed offences under PECA 2016? (2) Whether victim''s account was accessed without authorization? Case proceeds for recording of prosecution evidence.',
  'Digital forensic evidence to be examined by an independent IT expert. FIA Inspector to be examined as PW-1. Next date for evidence.',
  '2026-01-15 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe070001-0000-4000-8000-000000000001'::uuid);

-- CIV-2026-0013 – Ejectment – Hearing 1 (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe080001-0000-4000-8000-000000000001'::uuid,
  'ff500001-0000-4000-8000-000000000001',
  1, 'preliminary', '2026-02-01 11:00:00', '2026-02-01 12:00:00',
  'ee600001-0000-4000-8000-000000000001', 'Rent Controller Court, Karachi',
  'Preliminary hearing in ejectment suit. Defendant appeared with counsel. Original tenancy agreement produced. Issues framed: (1) Whether tenancy has expired? (2) Whether defendant owes arrears? (3) Whether plaintiff is entitled to ejectment? Evidence stage commenced.',
  'Issues framed. Plaintiff to produce evidence first. Defendant to bring all receipts claimed as proof of payment. Next date for PW-1 examination.',
  '2026-03-05 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe080001-0000-4000-8000-000000000001'::uuid);

-- CIV-2026-0014 – Insurance – Hearing 1 (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe090001-0000-4000-8000-000000000001'::uuid,
  'ff600001-0000-4000-8000-000000000001',
  1, 'preliminary', '2025-09-05 10:00:00', '2025-09-05 11:00:00',
  'ee600001-0000-4000-8000-000000000001', 'Civil Court Room 2, Rawalpindi',
  'Preliminary hearing. Insurance policy and repudiation letter produced. Defendant insurance company filed written statement denying liability. Issues framed: (1) Is the repudiation of claim valid? (2) Is the alleged non-disclosure a bar to claim? Evidence stage commenced.',
  'Both sides to produce actuarial/medical expert witnesses. Policy documents Exh. P-1, repudiation letter Exh. P-2 marked.',
  '2025-10-10 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe090001-0000-4000-8000-000000000001'::uuid);

-- CIV-2026-0014 – Insurance – Hearing 2 (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe0a0001-0000-4000-8000-000000000001'::uuid,
  'ff600001-0000-4000-8000-000000000001',
  2, 'evidence_recording', '2025-10-10 10:00:00', '2025-10-10 11:30:00',
  'ee600001-0000-4000-8000-000000000001', 'Civil Court Room 2, Rawalpindi',
  'PW-1 (Nadia Akram) examined in chief. Death certificate, post-mortem report, and medical history Exh. P-3 through P-5 tendered. Plaintiff''s counsel argued no pre-existing condition was known at time of policy. Cross-examination by insurance counsel deferred.',
  'PW-1 cross-examination on next date. Insurance company to produce underwriting file.',
  '2025-12-01 10:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe0a0001-0000-4000-8000-000000000001'::uuid);

-- LRV-2026-0005 – Benami – Hearing 1 (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe0b0001-0000-4000-8000-000000000001'::uuid,
  'ff700001-0000-4000-8000-000000000001',
  1, 'preliminary', '2025-07-20 11:00:00', '2025-07-20 12:00:00',
  'ee600001-0000-4000-8000-000000000001', 'Revenue Court Room 1, Multan',
  'First hearing in benami challenge. Petitioner produced certified mutation record and inheritance certificate. Respondent (Anwar Brothers) appeared through partner and denied benami allegations. Issues framed: (1) Was the transfer benami? (2) Is petitioner entitled to share as heir? Evidence stage commenced.',
  'Petitioner to produce witnesses on next date. Revenue records and account books of Anwar Brothers to be summoned from Revenue Office.',
  '2025-09-01 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe0b0001-0000-4000-8000-000000000001'::uuid);

-- LRV-2026-0005 – Benami – Hearing 2: Arguments (completed)
INSERT INTO public.hearings (id, case_id, hearing_number, hearing_type, scheduled_date, actual_date,
  presiding_officer_id, courtroom, proceedings_summary, judge_remarks, next_hearing_date, status)
SELECT 'fe0c0001-0000-4000-8000-000000000001'::uuid,
  'ff700001-0000-4000-8000-000000000001',
  2, 'arguments', '2026-01-15 11:00:00', '2026-01-15 13:00:00',
  'ee600001-0000-4000-8000-000000000001', 'Revenue Court Room 1, Multan',
  'Arguments commenced. Petitioner''s counsel cited Benami Transactions Act 2017 and revenue record extracts showing no monetary consideration in mutation. Respondent''s counsel produced firm account books and a receipt allegedly showing payment of consideration. Arguments continue.',
  'Both parties to file written synopses on legal interpretation of benami under the 2017 Act by next date. Judgment to follow.',
  '2026-03-10 11:00:00', 'completed'
WHERE NOT EXISTS (SELECT 1 FROM public.hearings WHERE id = 'fe0c0001-0000-4000-8000-000000000001'::uuid);

-- ── STEP C11: Order Sheets ────────────────────────────────────────────────────

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'ff100001-0000-4000-8000-000000000001', 'fe010001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Conciliation proceedings have failed. Respondent is directed to pay interim maintenance of PKR 20,000 per month for minor daughter Hira from today until further orders. Non-payment within 7 days of each month shall entitle petitioner to apply for execution. Next date for evidence: 18-11-2025.',
  'ee600001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'ff100001-0000-4000-8000-000000000001'
  AND hearing_id = 'fe010001-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'ff200001-0000-4000-8000-000000000001', 'fe040001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Interim custody of minor Usman (8 years) is granted to petitioner-mother Nadia Akram pending final decision. Respondent is granted visiting rights on every alternate Sunday from 10:00 AM to 5:00 PM. District Social Welfare Officer, Rawalpindi is directed to prepare a welfare report within 30 days. Next date: 20-01-2026.',
  'ee600001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'ff200001-0000-4000-8000-000000000001'
  AND hearing_id = 'fe040001-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'ff300001-0000-4000-8000-000000000001', 'fe060001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Charge under Section 302(b) PPC read to accused Wasim Akram. Accused pleaded not guilty. Trial to proceed. IO Sub-Inspector Sajid Ali summoned for examination as PW-1 on 20-04-2026. Prosecution directed to ensure presence of all eye-witnesses. Next date: 20-04-2026.',
  'ee800001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'ff300001-0000-4000-8000-000000000001'
  AND hearing_id = 'fe060001-0000-4000-8000-000000000001'::uuid
);

INSERT INTO public.order_sheets (case_id, hearing_id, order_type, order_text, issued_by)
SELECT 'ff400001-0000-4000-8000-000000000001', 'fe070001-0000-4000-8000-000000000001'::uuid,
  'interim',
  'Issues framed in PECA case. FIA Inspector Tariq Bashir to be examined as PW-1 on next date (15-01-2026). Independent IT forensic expert from NUST to be appointed to verify digital evidence. Expert fee of PKR 50,000 to be deposited equally by both parties.',
  'ee700001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_sheets WHERE case_id = 'ff400001-0000-4000-8000-000000000001'
  AND hearing_id = 'fe070001-0000-4000-8000-000000000001'::uuid
);

-- ── STEP C12: Witnesses for new cases ────────────────────────────────────────

-- FAM-2026-0002 witnesses
INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, statement, status, examination_date, added_by)
SELECT 'ff100001-0000-4000-8000-000000000001',
  'Shahid Mehmood (Plaintiff)', '42101-1234567-3', '03002223344', 'Flat 4-B, Block 9, Gulshan-e-Iqbal, Karachi',
  'prosecution', 'Plaintiff / Husband',
  'I married Nadia Akram on 15-06-2020. We have one minor daughter Hira. My wife left the matrimonial home in September 2025 without any lawful excuse and is refusing to return. I have not subjected her to any cruelty. I am willing to maintain her at my home.',
  'examined', '2025-11-18', 'ee500001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'ff100001-0000-4000-8000-000000000001' AND witness_name = 'Shahid Mehmood (Plaintiff)'
);

-- CRM-2026-0004 witnesses
INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, statement, status, examination_date, added_by)
SELECT 'ff300001-0000-4000-8000-000000000001',
  'Khalid Mahmood (Complainant)', '36302-4567891-2', '03006667788', '15 Nishtar Colony, Multan',
  'prosecution', 'Complainant / Brother of Deceased',
  'On 10-03-2026 at about 9:00 PM I received a call that my brother Muhammad Iqbal had been shot near Dera Adda. I reached the spot within 10 minutes and found him lying in a pool of blood. He was already dead. Accused Wasim Akram and my brother had a dispute over 5 Kanals of land near our village. I witnessed the accused with a pistol near the scene earlier that evening.',
  'listed', NULL, 'ee400001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'ff300001-0000-4000-8000-000000000001' AND witness_name = 'Khalid Mahmood (Complainant)'
);

INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact,
  witness_side, relation_to_case, status, added_by)
SELECT 'ff300001-0000-4000-8000-000000000001',
  'Sub-Inspector Sajid Ali (IO)', '36302-1234560-0', '03211113344',
  'prosecution', 'Investigation Officer – Multan City PS',
  'summoned', 'ee400001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'ff300001-0000-4000-8000-000000000001' AND witness_name = 'Sub-Inspector Sajid Ali (IO)'
);

-- CIV-2026-0014 witnesses
INSERT INTO public.witness_records (case_id, witness_name, witness_cnic, witness_contact, witness_address,
  witness_side, relation_to_case, statement, status, examination_date, added_by)
SELECT 'ff600001-0000-4000-8000-000000000001',
  'Nadia Akram (Plaintiff)', '37201-9876543-5', '03135559988', 'House 22, Satellite Town, Rawalpindi',
  'prosecution', 'Plaintiff / Insured Widow',
  'My late husband Bilal Anwar had a State Life Insurance policy SL-2019-456789 with sum assured of PKR 50,00,000. He passed away on 15-06-2025. I filed the death claim. The company repudiated it claiming he had undisclosed hypertension. He was fully examined by their doctor at policy inception and passed the medical test.',
  'examined', '2025-10-10', 'ee500001-0000-4000-8000-000000000001'
WHERE NOT EXISTS (
  SELECT 1 FROM public.witness_records WHERE case_id = 'ff600001-0000-4000-8000-000000000001' AND witness_name = 'Nadia Akram (Plaintiff)'
);

-- ── STEP C13: Activity Log ────────────────────────────────────────────────────

INSERT INTO public.case_activity_log (case_id, actor_id, action, details)
SELECT case_id::uuid, actor_id::uuid, action, details::jsonb
FROM (VALUES
  ('ff100001-0000-4000-8000-000000000001','ee100001-0000-4000-8000-000000000001','case_filed',         '{"note":"FAM-2026-0002 Restitution petition filed by Shahid Mehmood"}'),
  ('ff100001-0000-4000-8000-000000000001','ee500001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Saima Khan accepted","fee_amount":80000}'),
  ('ff100001-0000-4000-8000-000000000001','ee600001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"evidence_stage","new_status":"arguments","note":"Evidence concluded"}'),
  ('ff100001-0000-4000-8000-000000000001','ee600001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"arguments","new_status":"reserved_for_judgment","note":"Judgment reserved"}'),
  ('ff200001-0000-4000-8000-000000000001','ee200001-0000-4000-8000-000000000001','case_filed',         '{"note":"FAM-2026-0003 Guardianship petition filed by Nadia Akram"}'),
  ('ff200001-0000-4000-8000-000000000001','ee500001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Saima Khan accepted guardianship case","fee_amount":60000}'),
  ('ff200001-0000-4000-8000-000000000001','ee600001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"issues_framed","new_status":"evidence_stage","note":"Welfare report received, evidence stage"}'),
  ('ff300001-0000-4000-8000-000000000001','ee300001-0000-4000-8000-000000000001','case_filed',         '{"note":"CRM-2026-0004 Murder case FIR filed by Khalid Mahmood"}'),
  ('ff300001-0000-4000-8000-000000000001','ee400001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Barrister Faisal Qureshi accepted murder case","fee_amount":150000}'),
  ('ff300001-0000-4000-8000-000000000001','ee800001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"registered","new_status":"preliminary_hearing","note":"Charge framed against Wasim Akram"}'),
  ('ff400001-0000-4000-8000-000000000001','ee200001-0000-4000-8000-000000000001','case_filed',         '{"note":"CRM-2026-0005 Cybercrime complaint filed by Nadia Akram"}'),
  ('ff400001-0000-4000-8000-000000000001','ee400001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Barrister Faisal Qureshi accepted cybercrime case","fee_amount":90000}'),
  ('ff400001-0000-4000-8000-000000000001','ee700001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"registered","new_status":"issues_framed","note":"Issues framed in PECA case"}'),
  ('ff500001-0000-4000-8000-000000000001','ee100001-0000-4000-8000-000000000001','case_filed',         '{"note":"CIV-2026-0013 Ejectment suit filed by Shahid Mehmood"}'),
  ('ff500001-0000-4000-8000-000000000001','1e1e6011-e4ab-446c-8592-a4dbb4168810','case_accepted',      '{"note":"Adv. Ayesha Malik accepted ejectment case","fee_amount":55000}'),
  ('ff500001-0000-4000-8000-000000000001','475b9f5e-d054-41e7-843e-544afb0b3803','status_changed',     '{"old_status":"registered","new_status":"issues_framed","note":"Issues framed in ejectment suit"}'),
  ('ff600001-0000-4000-8000-000000000001','ee200001-0000-4000-8000-000000000001','case_filed',         '{"note":"CIV-2026-0014 Insurance claim suit filed by Nadia Akram"}'),
  ('ff600001-0000-4000-8000-000000000001','ee500001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Saima Khan accepted insurance case","fee_amount":100000}'),
  ('ff600001-0000-4000-8000-000000000001','ee600001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"issues_framed","new_status":"evidence_stage","note":"Evidence stage commenced"}'),
  ('ff700001-0000-4000-8000-000000000001','ee300001-0000-4000-8000-000000000001','case_filed',         '{"note":"LRV-2026-0005 Benami transfer challenge filed by Khalid Mahmood"}'),
  ('ff700001-0000-4000-8000-000000000001','cc300001-0000-4000-8000-000000000001','case_accepted',      '{"note":"Adv. Imran Siddiqui accepted benami case","fee_amount":110000}'),
  ('ff700001-0000-4000-8000-000000000001','ee600001-0000-4000-8000-000000000001','status_changed',     '{"old_status":"evidence_stage","new_status":"arguments","note":"Evidence concluded, arguments stage"}'),
  ('ff800001-0000-4000-8000-000000000001','ee100001-0000-4000-8000-000000000001','case_filed',         '{"note":"LTR-2026-0003 Mortgage redemption suit filed by Shahid Mehmood"}')
) AS v(case_id, actor_id, action, details)
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_activity_log l
  WHERE l.case_id = v.case_id::uuid AND l.action = v.action AND l.details::text = v.details
);

-- ── STEP C14: Notifications for Batch 3 ──────────────────────────────────────

INSERT INTO public.notifications (user_id, title, message, type, reference_type, is_read)
SELECT user_id::uuid, title, message, type::public.notification_type, reference_type, is_read
FROM (VALUES
  ('ee100001-0000-4000-8000-000000000001','Family Case Filed','Your case FAM-2026-0002 (Restitution of Conjugal Rights) has been registered.','case_status_changed','case',true),
  ('ee100001-0000-4000-8000-000000000001','Interim Maintenance Ordered','Court ordered PKR 20,000/month interim maintenance for minor Hira in FAM-2026-0002.','case_status_changed','case',true),
  ('ee100001-0000-4000-8000-000000000001','Judgment Reserved','Judgment has been reserved in FAM-2026-0002. Await next hearing date.','case_status_changed','case',false),
  ('ee100001-0000-4000-8000-000000000001','Ejectment Case Registered','Your ejectment suit CIV-2026-0013 has been registered.','case_status_changed','case',true),
  ('ee100001-0000-4000-8000-000000000001','Lawyer Accepted Case','Adv. Ayesha Malik has accepted your ejectment case CIV-2026-0013.','case_assigned','case',true),
  ('ee100001-0000-4000-8000-000000000001','Mortgage Case Submitted','Your mortgage redemption case LTR-2026-0003 is under scrutiny.','case_status_changed','case',false),
  ('ee200001-0000-4000-8000-000000000001','Guardianship Case Registered','Your guardianship petition FAM-2026-0003 has been registered.','case_status_changed','case',true),
  ('ee200001-0000-4000-8000-000000000001','Interim Custody Granted','Court has granted interim custody of Usman to you in FAM-2026-0003.','case_status_changed','case',true),
  ('ee200001-0000-4000-8000-000000000001','Cybercrime Case Update','Issues framed in CRM-2026-0005. Next hearing for evidence recording.','case_status_changed','case',false),
  ('ee200001-0000-4000-8000-000000000001','Insurance Case Update','Your insurance suit CIV-2026-0014 is in evidence stage.','case_status_changed','case',false),
  ('ee300001-0000-4000-8000-000000000001','Murder Case Registered','Your criminal case CRM-2026-0004 has been registered and charge framed.','case_status_changed','case',true),
  ('ee300001-0000-4000-8000-000000000001','Benami Case Update','Your benami land challenge LRV-2026-0005 is in arguments stage.','case_status_changed','case',false),
  ('ee300001-0000-4000-8000-000000000001','Hearing Reminder','Next hearing in CRM-2026-0004 on 20-Apr-2026. Ensure witnesses are available.','hearing_reminder','case',false),
  ('ee400001-0000-4000-8000-000000000001','New Murder Case Assigned','You have been assigned to CRM-2026-0004 (Section 302 PPC). Please review urgently.','case_assigned','case',true),
  ('ee400001-0000-4000-8000-000000000001','New Cybercrime Case Assigned','You have been assigned to CRM-2026-0005 (PECA Fraud). Please review.','case_assigned','case',true),
  ('ee400001-0000-4000-8000-000000000001','Court Fee Pending','Instalment 2/3 for CRM-2026-0004 is pending. Please ensure timely payment.','payment_completed','case',false),
  ('ee500001-0000-4000-8000-000000000001','New Family Case Assigned','You have been assigned to FAM-2026-0002 (Restitution). Please review.','case_assigned','case',true),
  ('ee500001-0000-4000-8000-000000000001','New Guardianship Case Assigned','You have been assigned to FAM-2026-0003 (Guardianship). Please review.','case_assigned','case',true),
  ('ee500001-0000-4000-8000-000000000001','New Insurance Case Assigned','You have been assigned to CIV-2026-0014 (Insurance Claim). Please review.','case_assigned','case',true),
  ('ee500001-0000-4000-8000-000000000001','Hearing Reminder','PW-1 cross-examination in FAM-2026-0003 on 25-Feb-2026. Prepare cross-examination notes.','hearing_reminder','case',false),
  ('ee600001-0000-4000-8000-000000000001','New Family Cases Assigned','FAM-2026-0002 and FAM-2026-0003 assigned to your court.','case_assigned','case',true),
  ('ee600001-0000-4000-8000-000000000001','Judgment to be Announced','FAM-2026-0002 is reserved for judgment. Please set announcement date.','case_status_changed','case',false),
  ('ee700001-0000-4000-8000-000000000001','New Criminal Cases Assigned','CRM-2026-0005 (Cybercrime) and FAM-2026-0003 (Guardianship) have been registered in your court.','case_assigned','case',true),
  ('ee800001-0000-4000-8000-000000000001','High-Priority Murder Case','CRM-2026-0004 (Section 302 PPC) has been registered and requires urgent attention.','case_assigned','case',true),
  ('ee800001-0000-4000-8000-000000000001','New Benami Case Registered','LRV-2026-0005 (Benami Transfer Challenge) is under your court jurisdiction.','case_assigned','case',true),
  ('1e1e6011-e4ab-446c-8592-a4dbb4168810','New Ejectment Case Assigned','You have been assigned to CIV-2026-0013 (Ejectment, Karachi). Please review.','case_assigned','case',true)
) AS v(user_id, title, message, type, reference_type, is_read)
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n
  WHERE n.user_id = v.user_id::uuid AND n.title = v.title
);
