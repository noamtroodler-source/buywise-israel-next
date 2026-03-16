
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS import_type text NOT NULL DEFAULT 'resale';
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS is_incremental boolean NOT NULL DEFAULT false;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS auto_sync_url text;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;
