-- Add category_ids column for multi-category support (up to 3)
ALTER TABLE blog_posts 
ADD COLUMN category_ids uuid[] DEFAULT '{}';