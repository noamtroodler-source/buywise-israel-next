
-- 1. Add new columns to trusted_professionals
ALTER TABLE public.trusted_professionals
  ADD COLUMN IF NOT EXISTS key_differentiators text[],
  ADD COLUMN IF NOT EXISTS consultation_type text,
  ADD COLUMN IF NOT EXISTS response_time text,
  ADD COLUMN IF NOT EXISTS engagement_model text,
  ADD COLUMN IF NOT EXISTS process_steps jsonb;

-- 2. Create professional_testimonials table
CREATE TABLE public.professional_testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid NOT NULL REFERENCES public.trusted_professionals(id) ON DELETE CASCADE,
  quote text NOT NULL,
  author_name text NOT NULL,
  author_context text,
  service_used text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Enable RLS with public read
ALTER TABLE public.professional_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for professional testimonials"
  ON public.professional_testimonials
  FOR SELECT
  USING (true);

-- 4. Index for fast lookups
CREATE INDEX idx_professional_testimonials_professional_id
  ON public.professional_testimonials(professional_id);
