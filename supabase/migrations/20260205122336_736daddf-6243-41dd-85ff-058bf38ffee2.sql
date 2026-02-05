-- Create listing_reports table for community-driven data quality
CREATE TABLE public.listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  report_type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT check_entity CHECK (
    (property_id IS NOT NULL AND project_id IS NULL) OR
    (property_id IS NULL AND project_id IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can create reports (anonymous or authenticated)
CREATE POLICY "Anyone can create reports" ON listing_reports
  FOR INSERT WITH CHECK (true);

-- Users can view their own reports
CREATE POLICY "Users can view own reports" ON listing_reports
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all reports using existing has_role function
CREATE POLICY "Admins can manage all reports" ON listing_reports
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add index for faster lookups
CREATE INDEX idx_listing_reports_property_id ON listing_reports(property_id);
CREATE INDEX idx_listing_reports_project_id ON listing_reports(project_id);
CREATE INDEX idx_listing_reports_status ON listing_reports(status);