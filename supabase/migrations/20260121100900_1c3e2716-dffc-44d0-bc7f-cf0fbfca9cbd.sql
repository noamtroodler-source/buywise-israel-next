-- Feature flags table for toggling site features
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  label TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Feature flags are viewable by everyone" 
ON public.feature_flags FOR SELECT USING (true);

CREATE POLICY "Admins can manage feature flags" 
ON public.feature_flags FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Site announcements table for banner messages
CREATE TABLE public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  is_active BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Active announcements are viewable by everyone" 
ON public.site_announcements FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage announcements" 
ON public.site_announcements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Admin audit log table
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view/insert audit logs
CREATE POLICY "Admins can view audit logs" 
ON public.admin_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert audit logs" 
ON public.admin_audit_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_key, is_enabled, label, description) VALUES
('SHOW_MORTGAGE_CALCULATOR', true, 'Mortgage Calculator', 'Show/hide the mortgage calculator tool'),
('SHOW_RENT_VS_BUY', true, 'Rent vs Buy Calculator', 'Show/hide the rent vs buy comparison tool'),
('SHOW_INVESTMENT_SCORE', true, 'Investment Score', 'Show investment scores on property cards'),
('SHOW_AI_ASSISTANT', true, 'AI Assistant', 'Enable the AI chat assistant'),
('MAINTENANCE_MODE', false, 'Maintenance Mode', 'Put the site in maintenance mode'),
('SHOW_MARKET_TRENDS', true, 'Market Trends', 'Show market trend charts and data');

-- Insert branding constants
INSERT INTO public.calculator_constants (constant_key, category, value_json, label, description, is_current)
VALUES 
('SITE_WHATSAPP_NUMBER', 'branding', '{"phone": "972501234567", "message": "Hi, I have a question about..."}', 'Support WhatsApp Number', 'WhatsApp contact for support', true),
('SITE_CONTACT_EMAIL', 'branding', '{"email": "support@buywise.co.il"}', 'Support Email', 'Primary contact email address', true),
('SITE_RESPONSE_TIME', 'branding', '{"hours": 24}', 'Response Time', 'Expected response time in hours', true);

-- Create updated_at trigger for new tables
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_announcements_updated_at
BEFORE UPDATE ON public.site_announcements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();