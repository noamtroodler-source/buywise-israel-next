-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

-- Allow authenticated users (agents) to upload images
CREATE POLICY "Agents can upload property images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
  AND has_role(auth.uid(), 'agent'::app_role)
);

-- Allow agents to update their own uploaded images
CREATE POLICY "Agents can update their own images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow agents to delete their own images
CREATE POLICY "Agents can delete their own images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Public can view all property images
CREATE POLICY "Property images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');