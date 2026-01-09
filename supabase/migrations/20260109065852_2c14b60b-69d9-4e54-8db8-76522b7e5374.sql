-- Create recently_viewed table for logged-in users
CREATE TABLE public.recently_viewed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Enable Row Level Security
ALTER TABLE public.recently_viewed ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own recently viewed"
ON public.recently_viewed
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to recently viewed"
ON public.recently_viewed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their recently viewed"
ON public.recently_viewed
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their recently viewed"
ON public.recently_viewed
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_recently_viewed_user_id ON public.recently_viewed(user_id);
CREATE INDEX idx_recently_viewed_viewed_at ON public.recently_viewed(viewed_at DESC);