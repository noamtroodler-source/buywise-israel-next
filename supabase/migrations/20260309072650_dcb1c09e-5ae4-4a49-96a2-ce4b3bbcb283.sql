CREATE POLICY "Allow public read of active founding partner count"
ON public.founding_partners
FOR SELECT
TO anon, authenticated
USING (is_active = true);