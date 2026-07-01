-- Add branding columns to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS brand_color text NOT NULL DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Create public storage bucket for event assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-assets',
  'event-assets',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Event assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-assets');

-- Authenticated users can upload (path convention: {user_id}/{filename})
CREATE POLICY "Authenticated users can upload event assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-assets');

-- Users can update files they own (first path segment = user_id)
CREATE POLICY "Users can update their own event assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'event-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete files they own
CREATE POLICY "Users can delete their own event assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'event-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
