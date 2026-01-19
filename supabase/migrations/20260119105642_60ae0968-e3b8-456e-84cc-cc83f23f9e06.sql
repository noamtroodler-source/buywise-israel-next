-- Allow admins to view all properties (for review purposes)
CREATE POLICY "Admins can view all properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));