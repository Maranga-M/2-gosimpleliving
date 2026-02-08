-- Create a new storage bucket for media assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-assets', 'media-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'media-assets' );

-- Policy: Allow Authenticated Insert (Upload)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'media-assets' AND auth.role() = 'authenticated' );

-- Policy: Allow Authenticated Delete
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'media-assets' AND auth.role() = 'authenticated' );
