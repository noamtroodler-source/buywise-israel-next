-- Create table for guest property saves
CREATE TABLE public.guest_property_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT guest_property_saves_unique UNIQUE (property_id, guest_id)
);

-- Enable Row Level Security
ALTER TABLE public.guest_property_saves ENABLE ROW LEVEL SECURITY;

-- RLS policy: guests can INSERT their own rows (guest_id must match header)
CREATE POLICY "Guests can insert their own saves"
ON public.guest_property_saves
FOR INSERT
WITH CHECK (guest_id = current_setting('request.headers', true)::json->>'x-guest-id');

-- RLS policy: guests can DELETE their own rows
CREATE POLICY "Guests can delete their own saves"
ON public.guest_property_saves
FOR DELETE
USING (guest_id = current_setting('request.headers', true)::json->>'x-guest-id');

-- No SELECT policy: guests cannot read the table directly

-- Create RPC function that returns combined saves count
CREATE OR REPLACE FUNCTION public.get_property_saves_count(p_property_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT count(*)::integer FROM public.favorites WHERE property_id = p_property_id)
    +
    (SELECT count(*)::integer FROM public.guest_property_saves WHERE property_id = p_property_id),
    0
  );
$$;