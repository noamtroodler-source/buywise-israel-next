-- Add representing_agent_id to projects table for optional agent assignment
ALTER TABLE public.projects 
ADD COLUMN representing_agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;