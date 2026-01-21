-- Create homepage_featured_slots table for managing featured content
CREATE TABLE public.homepage_featured_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('property_sale', 'property_rent', 'project_hero', 'project_secondary')),
  entity_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 1,
  featured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  added_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique position per slot type
  UNIQUE(slot_type, position),
  -- Ensure entity can only be in one slot at a time
  UNIQUE(entity_id)
);

-- Enable RLS
ALTER TABLE public.homepage_featured_slots ENABLE ROW LEVEL SECURITY;

-- Admins can manage all featured slots
CREATE POLICY "Admins can manage featured slots"
ON public.homepage_featured_slots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can read featured slots (needed for homepage)
CREATE POLICY "Featured slots are viewable by everyone"
ON public.homepage_featured_slots
FOR SELECT
USING (true);

-- Create index for efficient queries
CREATE INDEX idx_homepage_featured_slots_type ON public.homepage_featured_slots(slot_type);
CREATE INDEX idx_homepage_featured_slots_expires ON public.homepage_featured_slots(expires_at) WHERE expires_at IS NOT NULL;