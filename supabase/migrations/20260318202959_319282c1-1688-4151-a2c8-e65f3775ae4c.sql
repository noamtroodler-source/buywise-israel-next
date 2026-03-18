ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS regions_active text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_publicly_traded boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS tase_ticker text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS notable_projects text[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS awards_certifications text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_projects_text text DEFAULT NULL;