-- Fix 1: Restrict profiles table to only allow users to view their own profile
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy: Users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy for admins to view all profiles (for admin dashboard)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for agents to view profiles (for inquiries/contact info)
CREATE POLICY "Agents can view profiles for their inquiries"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'agent'));

-- Fix 2: Tighten inquiries INSERT policy - require valid data
DROP POLICY IF EXISTS "Anyone can create inquiries" ON public.inquiries;

-- New policy: Anyone can create inquiries but must provide valid email/name
CREATE POLICY "Anyone can create inquiries with valid data"
ON public.inquiries
FOR INSERT
WITH CHECK (
  length(trim(name)) > 1 AND
  length(trim(email)) > 5 AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  length(trim(message)) > 10
);

-- Fix 3: Tighten tool_feedback INSERT policy - require rating and tool name
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.tool_feedback;

-- New policy: Anyone can submit feedback with valid data
CREATE POLICY "Anyone can submit feedback with valid data"
ON public.tool_feedback
FOR INSERT
WITH CHECK (
  rating >= 1 AND rating <= 5 AND
  length(trim(tool_name)) > 0
);

-- Fix 4: Tighten contact_submissions INSERT policy - require valid data
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

-- New policy: Anyone can submit contact form with valid data
CREATE POLICY "Anyone can submit contact form with valid data"
ON public.contact_submissions
FOR INSERT
WITH CHECK (
  length(trim(name)) > 1 AND
  length(trim(email)) > 5 AND
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' AND
  length(trim(message)) > 10
);

-- Fix 5: Tighten price_drop_notifications INSERT - should only be system/trigger
DROP POLICY IF EXISTS "System can insert notifications" ON public.price_drop_notifications;

-- This table is populated by a trigger (notify_price_drop), not direct user inserts
-- We keep it restrictive - only admins can manually insert if needed
CREATE POLICY "Only trigger or admin can insert notifications"
ON public.price_drop_notifications
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));