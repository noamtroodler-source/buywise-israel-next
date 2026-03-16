ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS last_sync_checked_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sync_status text DEFAULT NULL;