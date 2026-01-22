-- Database indexes for projects table (matching properties pattern)
CREATE INDEX IF NOT EXISTS idx_projects_published 
ON projects(is_published) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_projects_city_published 
ON projects(city, is_published) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_projects_status_published 
ON projects(status, is_published) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_projects_completion_published 
ON projects(completion_date, is_published) 
WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_projects_featured_published 
ON projects(is_featured, is_published, created_at DESC) 
WHERE is_published = true AND is_featured = true;

CREATE INDEX IF NOT EXISTS idx_projects_developer_published 
ON projects(developer_id, is_published) 
WHERE is_published = true;

-- Blog posts index for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_published 
ON blog_posts(is_published, published_at DESC) 
WHERE is_published = true;

-- Homepage featured slots index
CREATE INDEX IF NOT EXISTS idx_featured_slots_type_position 
ON homepage_featured_slots(slot_type, position);

-- Agents index for common queries (without status filter in WHERE clause)
CREATE INDEX IF NOT EXISTS idx_agents_status_verified 
ON agents(status, is_verified);

-- Developers index for common queries (without status filter in WHERE clause)
CREATE INDEX IF NOT EXISTS idx_developers_status_verified 
ON developers(status, is_verified);