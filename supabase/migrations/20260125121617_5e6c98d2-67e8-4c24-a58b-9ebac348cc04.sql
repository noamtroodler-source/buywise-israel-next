-- Add ban tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banned_at timestamptz,
ADD COLUMN IF NOT EXISTS banned_until timestamptz,
ADD COLUMN IF NOT EXISTS ban_reason text,
ADD COLUMN IF NOT EXISTS banned_by uuid REFERENCES auth.users(id);

-- Create index for efficient queries on banned users
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON public.profiles(is_banned) WHERE is_banned = true;

-- RLS policy: Only admins can update ban fields
CREATE POLICY "Admins can update ban status" ON public.profiles
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));