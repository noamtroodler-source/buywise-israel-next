-- Fix permissive RLS policies for property_views and property_inquiries

-- 1. Drop the overly permissive INSERT policies
DROP POLICY IF EXISTS "Anyone can insert property views" ON public.property_views;
DROP POLICY IF EXISTS "Users can create inquiries" ON public.property_inquiries;

-- 2. Create more restrictive policies for property_views
-- Allow authenticated users OR track with session_id for anonymous
CREATE POLICY "Authenticated users can log property views"
ON public.property_views
FOR INSERT
WITH CHECK (
    -- Must either be authenticated OR provide a session_id for anonymous tracking
    auth.uid() IS NOT NULL OR session_id IS NOT NULL
);

-- 3. Create more restrictive policy for property_inquiries
-- Only authenticated users can create inquiries, OR provide contact info for anonymous
CREATE POLICY "Users can create inquiries with valid contact info"
ON public.property_inquiries
FOR INSERT
WITH CHECK (
    -- Either authenticated OR must provide email for contact
    auth.uid() IS NOT NULL OR (email IS NOT NULL AND email != '')
);