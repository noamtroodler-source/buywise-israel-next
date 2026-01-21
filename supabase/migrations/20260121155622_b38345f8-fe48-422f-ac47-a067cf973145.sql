-- Create the project-images bucket for developer project assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true);

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to project-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-images');

-- Allow public read access for all files
CREATE POLICY "Allow public read access to project-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'project-images');

-- Allow authenticated users to update their uploads
CREATE POLICY "Allow authenticated updates to project-images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Allow authenticated deletes from project-images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-images');