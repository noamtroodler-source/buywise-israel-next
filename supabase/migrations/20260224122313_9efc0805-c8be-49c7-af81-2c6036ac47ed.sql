
CREATE TABLE public.agency_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  quote TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_context TEXT,
  service_used TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency testimonials are publicly readable"
  ON public.agency_testimonials FOR SELECT
  USING (true);

CREATE INDEX idx_agency_testimonials_agency ON public.agency_testimonials(agency_id, display_order);
