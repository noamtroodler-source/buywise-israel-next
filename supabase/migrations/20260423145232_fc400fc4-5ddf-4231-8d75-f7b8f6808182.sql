INSERT INTO storage.buckets (id, name, public) VALUES ('agency-logos', 'agency-logos', true);

CREATE POLICY "Agency logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'agency-logos');

CREATE POLICY "Authenticated users can upload agency logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'agency-logos' AND auth.role() = 'authenticated');