
-- 1. Restrict agency invite codes from anonymous viewers
REVOKE SELECT (default_invite_code) ON public.agencies FROM anon;

-- 2. Tighten email_verifications UPDATE to row owner
DROP POLICY IF EXISTS "Update own verification codes" ON public.email_verifications;
CREATE POLICY "Users can update only their own verification codes"
ON public.email_verifications
FOR UPDATE
TO authenticated
USING (email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text)
WITH CHECK (email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text);

-- 3. Restrict project-images storage mutations to admins
DROP POLICY IF EXISTS "Allow authenticated deletes from project-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to project-images" ON storage.objects;

CREATE POLICY "Admins can delete project-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update project-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Blog approval workflow enforcement
DROP POLICY IF EXISTS "Published blog posts are viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.blog_posts;

CREATE POLICY "Authors can update own posts (restricted)"
ON public.blog_posts
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Trigger: prevent non-admins from elevating publish/approval state
CREATE OR REPLACE FUNCTION public.enforce_blog_approval_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot publish or change verification_status to approved
  IF TG_OP = 'INSERT' THEN
    NEW.is_published := false;
    IF NEW.verification_status = 'approved' THEN
      NEW.verification_status := 'pending';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Lock is_published unless it was already true (admin set it)
    IF NEW.is_published IS DISTINCT FROM OLD.is_published AND NEW.is_published = true THEN
      NEW.is_published := OLD.is_published;
    END IF;
    -- Authors cannot self-approve
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
       AND NEW.verification_status = 'approved' THEN
      NEW.verification_status := OLD.verification_status;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_blog_approval_workflow_trg ON public.blog_posts;
CREATE TRIGGER enforce_blog_approval_workflow_trg
BEFORE INSERT OR UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_blog_approval_workflow();

-- 5. agency_source_blocklist: only agency admins (or platform admins) may insert
DROP POLICY IF EXISTS "System can insert blocklist entries" ON public.agency_source_blocklist;
CREATE POLICY "Agency admins can insert blocklist entries"
ON public.agency_source_blocklist
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = agency_source_blocklist.agency_id
      AND a.admin_user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- 6. cross_agency_conflicts: only service role / admins may insert
DROP POLICY IF EXISTS "System can insert conflicts" ON public.cross_agency_conflicts;
CREATE POLICY "Only admins can insert cross-agency conflicts"
ON public.cross_agency_conflicts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 7. import_conflicts: only service role / admins may insert
DROP POLICY IF EXISTS "Service can insert conflicts" ON public.import_conflicts;
CREATE POLICY "Only admins can insert import conflicts"
ON public.import_conflicts
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
