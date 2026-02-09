-- Fix: allow deleting users who are agency admins by setting admin_user_id to NULL on delete
ALTER TABLE public.agencies DROP CONSTRAINT IF EXISTS agencies_admin_user_id_fkey;
ALTER TABLE public.agencies ADD CONSTRAINT agencies_admin_user_id_fkey 
  FOREIGN KEY (admin_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;