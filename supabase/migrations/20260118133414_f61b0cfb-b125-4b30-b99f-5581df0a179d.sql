-- Allow authenticated users to create their own agent profile
CREATE POLICY "Users can create their own agent profile"
ON public.agents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to add roles to themselves
CREATE POLICY "Users can add their own roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);