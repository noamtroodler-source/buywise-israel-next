-- Allow BuyWise platform admins to view & manage agency_members for any agency
CREATE POLICY "Platform admins can view all agency members"
ON public.agency_members FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Platform admins can insert agency members"
ON public.agency_members FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Platform admins can update agency members"
ON public.agency_members FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Platform admins can delete agency members"
ON public.agency_members FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));