
-- 1. Reassign category_id from absorbed → surviving
-- Buying Guide → Buying in Israel
UPDATE public.blog_posts SET category_id = '972b9e9c-1984-4dcc-be28-0404f9d39258' WHERE category_id = '7b4d265a-4ccf-45d1-9cd5-af2304ebb553';
-- Investment Tips → Investment
UPDATE public.blog_posts SET category_id = '9686bb37-0cce-482f-9f9f-78da2e117442' WHERE category_id = '89fbbf36-7876-4793-be5a-0e53b3a166fd';
-- Market Updates → Market Insights
UPDATE public.blog_posts SET category_id = '5a136a92-a387-449e-8c2b-86784c80ed93' WHERE category_id = '4097eb20-dd01-4534-9f23-6c49bd3c23a1';
-- Neighborhood Guides → Neighborhoods
UPDATE public.blog_posts SET category_id = '1f4c588f-38de-4442-a0e5-17b2f5d3a1a4' WHERE category_id = '44275eb4-c954-4c9a-92d6-293209563013';

-- 2. Update category_ids arrays (replace absorbed IDs with surviving IDs)
UPDATE public.blog_posts SET category_ids = array_replace(category_ids, '7b4d265a-4ccf-45d1-9cd5-af2304ebb553', '972b9e9c-1984-4dcc-be28-0404f9d39258') WHERE '7b4d265a-4ccf-45d1-9cd5-af2304ebb553' = ANY(category_ids);
UPDATE public.blog_posts SET category_ids = array_replace(category_ids, '89fbbf36-7876-4793-be5a-0e53b3a166fd', '9686bb37-0cce-482f-9f9f-78da2e117442') WHERE '89fbbf36-7876-4793-be5a-0e53b3a166fd' = ANY(category_ids);
UPDATE public.blog_posts SET category_ids = array_replace(category_ids, '4097eb20-dd01-4534-9f23-6c49bd3c23a1', '5a136a92-a387-449e-8c2b-86784c80ed93') WHERE '4097eb20-dd01-4534-9f23-6c49bd3c23a1' = ANY(category_ids);
UPDATE public.blog_posts SET category_ids = array_replace(category_ids, '44275eb4-c954-4c9a-92d6-293209563013', '1f4c588f-38de-4442-a0e5-17b2f5d3a1a4') WHERE '44275eb4-c954-4c9a-92d6-293209563013' = ANY(category_ids);

-- 3. Delete the 4 absorbed categories
DELETE FROM public.blog_categories WHERE id IN (
  '7b4d265a-4ccf-45d1-9cd5-af2304ebb553',
  '89fbbf36-7876-4793-be5a-0e53b3a166fd',
  '4097eb20-dd01-4534-9f23-6c49bd3c23a1',
  '44275eb4-c954-4c9a-92d6-293209563013'
);

-- 4. Update surviving category descriptions
UPDATE public.blog_categories SET description = 'Guides and advice for purchasing property in Israel' WHERE id = '972b9e9c-1984-4dcc-be28-0404f9d39258';
UPDATE public.blog_categories SET description = 'Real estate investment strategies, tips, and opportunities' WHERE id = '9686bb37-0cce-482f-9f9f-78da2e117442';
UPDATE public.blog_categories SET description = 'Market trends, analysis, news, and updates' WHERE id = '5a136a92-a387-449e-8c2b-86784c80ed93';
UPDATE public.blog_categories SET description = 'Area guides and neighborhood spotlights across Israel' WHERE id = '1f4c588f-38de-4442-a0e5-17b2f5d3a1a4';
