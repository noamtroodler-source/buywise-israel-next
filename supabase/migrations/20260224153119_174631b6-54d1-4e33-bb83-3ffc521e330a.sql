
-- Create import_jobs table
CREATE TABLE public.import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  website_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'discovering' CHECK (status IN ('discovering', 'ready', 'processing', 'completed', 'failed')),
  total_urls INTEGER NOT NULL DEFAULT 0,
  processed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  discovered_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS: agency admin can manage their own import jobs
CREATE POLICY "Agency admin can manage import jobs"
  ON public.import_jobs
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies a
      WHERE a.id = import_jobs.agency_id
        AND a.admin_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a
      WHERE a.id = import_jobs.agency_id
        AND a.admin_user_id = auth.uid()
    )
  );

-- Create import_job_items table
CREATE TABLE public.import_job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.import_jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed', 'skipped')),
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  error_message TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.import_job_items ENABLE ROW LEVEL SECURITY;

-- RLS: agency admin can manage items via job ownership
CREATE POLICY "Agency admin can manage import job items"
  ON public.import_job_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.import_jobs j
      JOIN public.agencies a ON a.id = j.agency_id
      WHERE j.id = import_job_items.job_id
        AND a.admin_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.import_jobs j
      JOIN public.agencies a ON a.id = j.agency_id
      WHERE j.id = import_job_items.job_id
        AND a.admin_user_id = auth.uid()
    )
  );

-- Add import_source column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS import_source TEXT;

-- Add updated_at trigger for import_jobs
CREATE TRIGGER update_import_jobs_updated_at
  BEFORE UPDATE ON public.import_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Service role policies for edge function access
CREATE POLICY "Service role full access import_jobs"
  ON public.import_jobs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access import_job_items"
  ON public.import_job_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
