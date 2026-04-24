-- ============================================================
-- Migration: 00034_create_storage_bucket.sql
-- Creates the case-documents storage bucket (was commented out
-- in earlier migrations, causing 400 on every file upload).
-- ============================================================

-- Create the private bucket for case documents.
-- ON CONFLICT DO NOTHING is safe to run multiple times.
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'case-documents',
  'case-documents',
  false,                         -- private: access via signed URLs only
  20971520,                      -- 20 MB per file
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET
    file_size_limit   = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
