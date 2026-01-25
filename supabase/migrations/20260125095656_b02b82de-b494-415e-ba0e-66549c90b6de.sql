-- Add professional blog fields to blog_posts table
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS author_type TEXT CHECK (author_type IN ('agent', 'agency', 'developer', 'admin')),
ADD COLUMN IF NOT EXISTS author_profile_id UUID,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft' CHECK (verification_status IN ('draft', 'pending_review', 'approved', 'changes_requested', 'rejected')),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create index for faster lookups by author
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_profile ON public.blog_posts(author_type, author_profile_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_verification_status ON public.blog_posts(verification_status);

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Authors can create posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can manage all posts" ON public.blog_posts;

-- Policy: Anyone can view approved and published posts
CREATE POLICY "Public can view approved published posts"
ON public.blog_posts FOR SELECT
USING (
  is_published = true 
  AND (verification_status = 'approved' OR verification_status IS NULL)
);

-- Policy: Authors can view their own posts (any status)
CREATE POLICY "Authors can view own posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Policy: Admins can view all posts
CREATE POLICY "Admins can view all posts"
ON public.blog_posts FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Authenticated users can create posts (draft by default)
CREATE POLICY "Authenticated users can create posts"
ON public.blog_posts FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Policy: Authors can update their own posts
CREATE POLICY "Authors can update own posts"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Policy: Admins can update any post (for approval workflow)
CREATE POLICY "Admins can update all posts"
ON public.blog_posts FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Authors can delete their own draft posts
CREATE POLICY "Authors can delete own drafts"
ON public.blog_posts FOR DELETE
TO authenticated
USING (
  author_id = auth.uid() 
  AND (verification_status = 'draft' OR verification_status IS NULL)
);

-- Policy: Admins can delete any post
CREATE POLICY "Admins can delete all posts"
ON public.blog_posts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));