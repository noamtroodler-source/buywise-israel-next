-- Add lead management columns to property_inquiries
ALTER TABLE public.property_inquiries 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ;

-- Add notification preferences to agents
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_inquiry BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_on_approval BOOLEAN DEFAULT true;

-- Create index for efficient lead queries
CREATE INDEX IF NOT EXISTS idx_property_inquiries_agent_status 
ON public.property_inquiries(agent_id, status);

CREATE INDEX IF NOT EXISTS idx_property_inquiries_created_at 
ON public.property_inquiries(created_at DESC);