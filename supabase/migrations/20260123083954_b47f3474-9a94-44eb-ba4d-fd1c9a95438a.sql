-- Fix 1: Add RLS policies for email_verifications table
CREATE POLICY "Anyone can create verification codes"
ON public.email_verifications FOR INSERT
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Anyone can read verification codes"
ON public.email_verifications FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Anyone can update verification codes"
ON public.email_verifications FOR UPDATE
TO authenticated, anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Admins can delete verification codes"
ON public.email_verifications FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));