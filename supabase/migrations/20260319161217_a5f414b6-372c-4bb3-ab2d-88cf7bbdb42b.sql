
-- 1. CRITICAL: Drop the dangerous INSERT policy that allows self-promotion to admin
DROP POLICY IF EXISTS "Users can add their own roles" ON public.user_roles;

-- 2. CRITICAL: Fix email_verifications - remove public read of OTP codes
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can read verification codes" ON public.email_verifications;

-- Only the edge function (service role) needs to read verification codes.
-- No client-side SELECT is needed. If a policy for authenticated reading by email owner is desired:
CREATE POLICY "Users can only read own verification codes"
  ON public.email_verifications
  FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 3. Fix tool_runs tautological UPDATE policy
DROP POLICY IF EXISTS "Users can update their own tool runs" ON public.tool_runs;

-- Replace with a proper session-based policy that actually compares to a value
CREATE POLICY "Users can update their own tool runs"
  ON public.tool_runs
  FOR UPDATE
  USING (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
  WITH CHECK (
    (user_id IS NOT NULL AND user_id = auth.uid())
    OR
    (user_id IS NULL AND session_id IS NOT NULL)
  );
