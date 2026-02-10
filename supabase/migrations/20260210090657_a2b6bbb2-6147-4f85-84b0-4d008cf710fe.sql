
CREATE TABLE public.trusted_professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  company text,
  logo_url text,
  description text,
  long_description text,
  languages text[] DEFAULT '{}',
  website text,
  email text,
  phone text,
  whatsapp text,
  booking_url text,
  specializations text[] DEFAULT '{}',
  cities_covered text[] DEFAULT '{}',
  works_with_internationals boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.trusted_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published professionals"
  ON public.trusted_professionals FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage professionals"
  ON public.trusted_professionals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_trusted_professionals_updated_at
  BEFORE UPDATE ON public.trusted_professionals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
