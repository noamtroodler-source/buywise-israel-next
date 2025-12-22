-- Add new columns to blog_posts table
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS audiences text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reading_time_minutes integer DEFAULT 5;

-- Create saved_articles table for bookmark functionality
CREATE TABLE IF NOT EXISTS public.saved_articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, post_id)
);

-- Enable RLS on saved_articles
ALTER TABLE public.saved_articles ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_articles
CREATE POLICY "Users can view their own saved articles"
ON public.saved_articles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can save articles"
ON public.saved_articles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own articles"
ON public.saved_articles
FOR DELETE
USING (auth.uid() = user_id);

-- Insert additional blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
    ('Buying in Israel', 'buying-in-israel', 'Israel-specific purchase information and guidance'),
    ('Investment Tips', 'investment-tips', 'Real estate investment strategies and advice'),
    ('Legal & Finance', 'legal-finance', 'Taxes, legal requirements, mortgages and financial guidance'),
    ('Living in Israel', 'living-in-israel', 'Lifestyle, culture and practical living information'),
    ('Market Insights', 'market-insights', 'In-depth analysis and trends'),
    ('Neighborhood Guides', 'neighborhood-guides', 'Area-specific content and local guides')
ON CONFLICT (slug) DO NOTHING;