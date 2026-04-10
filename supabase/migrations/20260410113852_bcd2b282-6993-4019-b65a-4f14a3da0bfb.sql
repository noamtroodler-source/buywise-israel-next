CREATE TABLE public.neighborhood_illustrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug text NOT NULL,
  neighborhood_name text NOT NULL,
  image_url text,
  storage_path text,
  prompt_used text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(city_slug, neighborhood_name)
);

ALTER TABLE public.neighborhood_illustrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view neighborhood illustrations"
ON public.neighborhood_illustrations FOR SELECT USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('neighborhood-illustrations', 'neighborhood-illustrations', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read neighborhood illustrations"
ON storage.objects FOR SELECT
USING (bucket_id = 'neighborhood-illustrations');