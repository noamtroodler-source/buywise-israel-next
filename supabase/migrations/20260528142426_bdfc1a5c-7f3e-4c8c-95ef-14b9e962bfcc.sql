UPDATE public.agents a
SET status = 'active'
WHERE a.status <> 'active'
  AND a.user_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.agency_members m
    WHERE m.user_id = a.user_id
      AND m.role IN ('owner', 'admin')
  );