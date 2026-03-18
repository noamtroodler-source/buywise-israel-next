ALTER TABLE public.chat_conversations ADD COLUMN title TEXT;

-- Allow users to update their own conversation titles
-- (existing UPDATE policy already covers this)