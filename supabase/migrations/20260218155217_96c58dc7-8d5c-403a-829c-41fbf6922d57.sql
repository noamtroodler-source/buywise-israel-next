ALTER TABLE public.enterprise_inquiries
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS admin_notes text;