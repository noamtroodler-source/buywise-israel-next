
-- 1. Add sort_order column
ALTER TABLE public.visibility_products ADD COLUMN sort_order integer DEFAULT 0;

-- 2. Split "Homepage Project Featured" into hero
UPDATE public.visibility_products
SET name = 'Homepage Project Hero',
    slug = 'homepage_project_hero',
    credit_cost = 150,
    max_slots = 1,
    description = 'Hero slot on homepage projects section'
WHERE slug = 'homepage_project_featured';

-- 3. Insert new products
INSERT INTO public.visibility_products (name, slug, description, credit_cost, duration_days, max_slots, applies_to, is_active)
VALUES
  ('Homepage Project Secondary', 'homepage_project_secondary', 'Secondary slots on homepage projects section', 90, 7, 2, 'developer', true),
  ('Projects Boost', 'projects_boost', 'Top of /projects grid', 60, 7, NULL, 'developer', true),
  ('Budget Tool Sponsor', 'budget_tool_sponsor', 'Sponsored slot in Properties in Your Budget tool', 50, 7, 1, 'all', true);

-- 4. Update existing credit costs to spec values
UPDATE public.visibility_products SET credit_cost = 30 WHERE slug = 'homepage_sale_featured';
UPDATE public.visibility_products SET credit_cost = 25 WHERE slug = 'homepage_rent_featured';
UPDATE public.visibility_products SET credit_cost = 15 WHERE slug = 'search_priority';
UPDATE public.visibility_products SET credit_cost = 20 WHERE slug = 'city_spotlight';
UPDATE public.visibility_products SET credit_cost = 10 WHERE slug = 'similar_listings_priority';
UPDATE public.visibility_products SET credit_cost = 25 WHERE slug = 'agency_directory_featured';
UPDATE public.visibility_products SET credit_cost = 25 WHERE slug = 'developer_directory_featured';
UPDATE public.visibility_products SET credit_cost = 35 WHERE slug = 'email_digest_sponsored';

-- 5. Set sort_order on all products
UPDATE public.visibility_products SET sort_order = 1 WHERE slug = 'homepage_sale_featured';
UPDATE public.visibility_products SET sort_order = 2 WHERE slug = 'homepage_rent_featured';
UPDATE public.visibility_products SET sort_order = 3 WHERE slug = 'homepage_project_hero';
UPDATE public.visibility_products SET sort_order = 4 WHERE slug = 'homepage_project_secondary';
UPDATE public.visibility_products SET sort_order = 5 WHERE slug = 'projects_boost';
UPDATE public.visibility_products SET sort_order = 6 WHERE slug = 'search_priority';
UPDATE public.visibility_products SET sort_order = 7 WHERE slug = 'city_spotlight';
UPDATE public.visibility_products SET sort_order = 8 WHERE slug = 'budget_tool_sponsor';
UPDATE public.visibility_products SET sort_order = 9 WHERE slug = 'similar_listings_priority';
UPDATE public.visibility_products SET sort_order = 10 WHERE slug = 'agency_directory_featured';
UPDATE public.visibility_products SET sort_order = 11 WHERE slug = 'developer_directory_featured';
UPDATE public.visibility_products SET sort_order = 12 WHERE slug = 'email_digest_sponsored';
