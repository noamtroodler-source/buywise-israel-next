-- Create content_visits table for tracking user content views
CREATE TABLE public.content_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_path TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('guide', 'tool', 'area', 'blog', 'glossary')),
  first_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_visited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  visit_count INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT unique_user_content UNIQUE(user_id, content_path)
);

-- Index for fast lookups by user
CREATE INDEX idx_content_visits_user ON public.content_visits(user_id);

-- Enable Row Level Security
ALTER TABLE public.content_visits ENABLE ROW LEVEL SECURITY;

-- RLS policies - users can only access their own visits
CREATE POLICY "Users can view their own visits"
  ON public.content_visits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own visits"
  ON public.content_visits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own visits"
  ON public.content_visits FOR UPDATE
  USING (auth.uid() = user_id);