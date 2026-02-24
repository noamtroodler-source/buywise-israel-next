ALTER TABLE public.import_job_items ADD COLUMN project_id UUID REFERENCES public.projects(id);
ALTER TABLE public.projects ADD COLUMN import_source TEXT;