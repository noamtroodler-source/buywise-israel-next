-- Phase 1.1: Add Missing Property Fields
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_balcony boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_elevator boolean DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS has_storage boolean DEFAULT false;

-- Create partial indexes for filter performance
CREATE INDEX IF NOT EXISTS idx_properties_balcony ON public.properties(has_balcony) WHERE has_balcony = true;
CREATE INDEX IF NOT EXISTS idx_properties_elevator ON public.properties(has_elevator) WHERE has_elevator = true;
CREATE INDEX IF NOT EXISTS idx_properties_storage ON public.properties(has_storage) WHERE has_storage = true;

-- Phase 1.2: Expand Buyer Profile Fields
ALTER TABLE public.buyer_profiles 
  ADD COLUMN IF NOT EXISTS target_cities text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS property_type_preferences text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS purchase_timeline text CHECK (purchase_timeline IN ('immediate', '1_3_months', '3_6_months', '6_12_months', 'flexible')),
  ADD COLUMN IF NOT EXISTS budget_min integer,
  ADD COLUMN IF NOT EXISTS budget_max integer;

-- Phase 1.3: Create Share Events Table
CREATE TABLE IF NOT EXISTS public.share_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('property', 'project', 'area', 'tool')),
  entity_id text NOT NULL,
  share_method text NOT NULL CHECK (share_method IN ('copy_link', 'whatsapp', 'telegram', 'native_share')),
  page_path text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on share_events
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (including anonymous)
CREATE POLICY "Anyone can insert share events" ON public.share_events
  FOR INSERT WITH CHECK (true);

-- Only admins can read share events
CREATE POLICY "Admins can read share events" ON public.share_events
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_share_events_entity ON public.share_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_share_events_method ON public.share_events(share_method);
CREATE INDEX IF NOT EXISTS idx_share_events_created ON public.share_events(created_at DESC);

-- Phase 2: Insert Pardes Hanna Anchors
INSERT INTO public.city_anchors (city_id, anchor_type, name, name_he, description, latitude, longitude, icon, display_order)
SELECT 
  id,
  'orientation',
  'Pardes Hanna Train Station',
  'תחנת רכבת פרדס חנה',
  'Central transportation hub connecting to Tel Aviv and Haifa, essential landmark for commuters',
  32.4712,
  34.9698,
  'train',
  1
FROM public.cities WHERE name ILIKE 'Pardes Hanna%'
ON CONFLICT DO NOTHING;

INSERT INTO public.city_anchors (city_id, anchor_type, name, name_he, description, latitude, longitude, icon, display_order)
SELECT 
  id,
  'daily_life',
  'Pardes Hanna Market & Town Center',
  'מרכז העיר והשוק',
  'Historic market area and commercial center with local shops, cafes, and community services',
  32.4725,
  34.9650,
  'shopping-bag',
  2
FROM public.cities WHERE name ILIKE 'Pardes Hanna%'
ON CONFLICT DO NOTHING;

INSERT INTO public.city_anchors (city_id, anchor_type, name, name_he, description, latitude, longitude, icon, display_order)
SELECT 
  id,
  'mobility',
  'Highway 4 Interchange',
  'מחלף כביש 4',
  'Main highway access point providing quick connections to coastal cities and central Israel',
  32.4680,
  34.9580,
  'car',
  3
FROM public.cities WHERE name ILIKE 'Pardes Hanna%'
ON CONFLICT DO NOTHING;