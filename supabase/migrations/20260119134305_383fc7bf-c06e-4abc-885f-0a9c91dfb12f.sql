-- Fix function search path security warning
CREATE OR REPLACE FUNCTION set_inquiry_agency_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the agency_id from the agent
  SELECT agency_id INTO NEW.agency_id
  FROM public.agents WHERE id = NEW.agent_id;
  
  -- Default assigned_to to the original agent
  IF NEW.assigned_to IS NULL THEN
    NEW.assigned_to := NEW.agent_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;