-- Add new columns to properties table for enhanced filtering
ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking INTEGER DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS condition TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT false;

-- Create search_alerts table for saved searches/alerts
CREATE TABLE IF NOT EXISTS public.search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  filters JSONB NOT NULL DEFAULT '{}',
  listing_type TEXT NOT NULL DEFAULT 'for_sale', -- 'for_sale', 'for_rent', 'projects'
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
  notify_email BOOLEAN DEFAULT true,
  notify_whatsapp BOOLEAN DEFAULT false,
  notify_sms BOOLEAN DEFAULT false,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on search_alerts
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own alerts"
ON public.search_alerts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own alerts
CREATE POLICY "Users can create their own alerts"
ON public.search_alerts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own alerts
CREATE POLICY "Users can update their own alerts"
ON public.search_alerts
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own alerts
CREATE POLICY "Users can delete their own alerts"
ON public.search_alerts
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_search_alerts_updated_at
BEFORE UPDATE ON public.search_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();