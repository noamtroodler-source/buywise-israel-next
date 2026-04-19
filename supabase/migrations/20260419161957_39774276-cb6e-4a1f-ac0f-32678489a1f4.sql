-- Add field_source_map to properties to track per-field provenance
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS field_source_map JSONB DEFAULT '{}'::jsonb;

-- Create import_conflicts table
CREATE TABLE IF NOT EXISTS public.import_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  existing_value JSONB,
  existing_source TEXT,
  incoming_value JSONB,
  incoming_source TEXT,
  diff_percent NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_conflicts_property_id ON public.import_conflicts(property_id);
CREATE INDEX IF NOT EXISTS idx_import_conflicts_agency_id ON public.import_conflicts(agency_id);
CREATE INDEX IF NOT EXISTS idx_import_conflicts_status ON public.import_conflicts(status);

ALTER TABLE public.import_conflicts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage all conflicts"
  ON public.import_conflicts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Agency members can view conflicts for their agency
CREATE POLICY "Agency members view their conflicts"
  ON public.import_conflicts FOR SELECT
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- Agency members can update (resolve) conflicts for their agency
CREATE POLICY "Agency members resolve their conflicts"
  ON public.import_conflicts FOR UPDATE
  USING (
    agency_id IN (
      SELECT agency_id FROM public.agents WHERE user_id = auth.uid()
    )
  );

-- Service role / functions can insert conflicts
CREATE POLICY "Service can insert conflicts"
  ON public.import_conflicts FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_import_conflicts_updated_at
  BEFORE UPDATE ON public.import_conflicts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();