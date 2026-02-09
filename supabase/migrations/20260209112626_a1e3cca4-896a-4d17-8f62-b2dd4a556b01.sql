-- Allow authenticated users to register their own agency
CREATE POLICY "Users can create their own agency"
ON public.agencies
FOR INSERT
TO authenticated
WITH CHECK (admin_user_id = auth.uid());

-- Allow agency admins to update their own agency
CREATE POLICY "Agency admins can update their own agency"
ON public.agencies
FOR UPDATE
TO authenticated
USING (admin_user_id = auth.uid())
WITH CHECK (admin_user_id = auth.uid());