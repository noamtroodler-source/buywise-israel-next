-- Create project_favorites table for saving projects
CREATE TABLE project_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE project_favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own project favorites" ON project_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own project favorites" ON project_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own project favorites" ON project_favorites
  FOR DELETE USING (auth.uid() = user_id);