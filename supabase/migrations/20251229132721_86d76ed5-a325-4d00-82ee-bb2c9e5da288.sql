-- Create tool_feedback table for collecting user feedback on calculator tools
CREATE TABLE public.tool_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.tool_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (anonymous or logged in)
CREATE POLICY "Anyone can submit feedback"
ON public.tool_feedback
FOR INSERT
WITH CHECK (true);

-- Users can only view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.tool_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for querying feedback by tool
CREATE INDEX idx_tool_feedback_tool_name ON public.tool_feedback(tool_name);
CREATE INDEX idx_tool_feedback_created_at ON public.tool_feedback(created_at DESC);