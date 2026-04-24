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
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE case_number = 'CIV-2026-0001');

-- Criminal Case 1: Theft (registered)
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
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE case_number = 'CRM-2026-0001');

-- Civil Case 2: Family Matter (draft)
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
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE case_number = 'CIV-2026-0002');

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
