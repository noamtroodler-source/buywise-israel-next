
CREATE TABLE public.import_job_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'credits',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.import_job_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read import costs"
  ON public.import_job_costs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert import costs"
  ON public.import_job_costs FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_import_job_costs_job ON public.import_job_costs(job_id);
