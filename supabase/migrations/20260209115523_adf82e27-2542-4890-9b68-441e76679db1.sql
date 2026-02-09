-- Fix all FK constraints referencing auth.users that block user deletion
-- Set to ON DELETE SET NULL for non-essential references

ALTER TABLE public.admin_audit_log DROP CONSTRAINT IF EXISTS admin_audit_log_user_id_fkey;
ALTER TABLE public.admin_audit_log ADD CONSTRAINT admin_audit_log_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.agency_invites DROP CONSTRAINT IF EXISTS agency_invites_created_by_fkey;
ALTER TABLE public.agency_invites ADD CONSTRAINT agency_invites_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.agency_join_requests DROP CONSTRAINT IF EXISTS agency_join_requests_reviewed_by_fkey;
ALTER TABLE public.agency_join_requests ADD CONSTRAINT agency_join_requests_reviewed_by_fkey 
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_approved_by_fkey;
ALTER TABLE public.agents ADD CONSTRAINT agents_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.homepage_featured_slots DROP CONSTRAINT IF EXISTS homepage_featured_slots_added_by_fkey;
ALTER TABLE public.homepage_featured_slots ADD CONSTRAINT homepage_featured_slots_added_by_fkey 
  FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_banned_by_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_banned_by_fkey 
  FOREIGN KEY (banned_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_reviewed_by_fkey;
ALTER TABLE public.properties ADD CONSTRAINT properties_reviewed_by_fkey 
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.property_inquiries DROP CONSTRAINT IF EXISTS property_inquiries_user_id_fkey;
ALTER TABLE public.property_inquiries ADD CONSTRAINT property_inquiries_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.property_views DROP CONSTRAINT IF EXISTS property_views_viewer_user_id_fkey;
ALTER TABLE public.property_views ADD CONSTRAINT property_views_viewer_user_id_fkey 
  FOREIGN KEY (viewer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;