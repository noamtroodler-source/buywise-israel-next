DROP POLICY IF EXISTS "Agency admins can insert price context events" ON public.price_context_events;

CREATE POLICY "Agency admins can insert price context events"
ON public.price_context_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    JOIN public.agencies a ON a.id = p.primary_agency_id
    WHERE p.id = price_context_events.property_id
      AND a.admin_user_id = auth.uid()
  )
);