
-- Drop the old policy that only allows agents
DROP POLICY IF EXISTS "Agents can upload property images" ON storage.objects;

-- Create a new policy allowing any authenticated user to upload
CREATE POLICY "Authenticated users can upload to property-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'property-images');
