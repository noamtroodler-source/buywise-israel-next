-- Create saved_calculator_results table
CREATE TABLE public.saved_calculator_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  calculator_type TEXT NOT NULL,
  name TEXT,
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_calculator_results ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved results
CREATE POLICY "Users can view own saved results" ON public.saved_calculator_results
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own saved results
CREATE POLICY "Users can insert own saved results" ON public.saved_calculator_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved results
CREATE POLICY "Users can update own saved results" ON public.saved_calculator_results
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own saved results
CREATE POLICY "Users can delete own saved results" ON public.saved_calculator_results
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_calculator_results_updated_at
  BEFORE UPDATE ON public.saved_calculator_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();