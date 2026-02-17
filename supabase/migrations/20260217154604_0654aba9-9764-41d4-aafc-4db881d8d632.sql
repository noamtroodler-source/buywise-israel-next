
-- Enterprise inquiries table
CREATE TABLE public.enterprise_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  entity_type TEXT NOT NULL DEFAULT 'agency',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enterprise_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (contact sales form)
CREATE POLICY "Anyone can submit enterprise inquiry"
ON public.enterprise_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view enterprise inquiries"
ON public.enterprise_inquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update (status changes)
CREATE POLICY "Admins can update enterprise inquiries"
ON public.enterprise_inquiries
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_enterprise_inquiries_updated_at
BEFORE UPDATE ON public.enterprise_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
