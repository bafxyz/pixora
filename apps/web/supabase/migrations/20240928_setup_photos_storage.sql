-- Migration: Setup photos storage bucket
-- Created: 2024-09-28
-- Description: Creates photos bucket and RLS policies for photo uploads

-- Create photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,  -- public bucket
  10485760,  -- 10MB file size limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure RLS is enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow photographers to delete their photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow photographers to update their photos" ON storage.objects;

-- Create new policies
CREATE POLICY "Allow authenticated users to upload photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'photos'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow public read access to photos" ON storage.objects
FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Allow photographers to delete their photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'photos'
  AND auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata'->>'role')::text IN ('photographer', 'studio-admin', 'admin')
  )
);

CREATE POLICY "Allow photographers to update their photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'photos'
  AND auth.role() = 'authenticated'
  AND (
    (auth.jwt() ->> 'user_metadata'->>'role')::text IN ('photographer', 'studio-admin', 'admin')
  )
);