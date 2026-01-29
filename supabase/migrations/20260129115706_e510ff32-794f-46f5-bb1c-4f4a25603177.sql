-- Fix SECURITY DEFINER functions missing search_path protection
-- This addresses the security vulnerability where functions could be exploited via search_path manipulation

-- Fix 1: set_inquiry_agency_id function
CREATE OR REPLACE FUNCTION public.set_inquiry_agency_id()
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

-- Fix 2: notify_agent_on_inquiry function
CREATE OR REPLACE FUNCTION public.notify_agent_on_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agent_notifications (agent_id, type, title, message, action_url)
  VALUES (
    NEW.agent_id,
    'lead',
    'New Inquiry Received',
    COALESCE(NEW.name, 'Someone') || ' is interested in your listing',
    '/agent/leads'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 3: log_property_price_change function
CREATE OR REPLACE FUNCTION public.log_property_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price AND OLD.price IS NOT NULL THEN
    INSERT INTO public.listing_price_history (
      entity_type, entity_id, old_price, new_price, 
      changed_at, change_reason, changed_by_type
    ) VALUES (
      'property', NEW.id, OLD.price, NEW.price,
      now(), 'manual', 'agent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix 4: log_property_status_change function
CREATE OR REPLACE FUNCTION public.log_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.listing_status IS DISTINCT FROM NEW.listing_status THEN
    INSERT INTO public.listing_status_history (
      entity_type, entity_id, status_from, status_to,
      changed_at, changed_by_type
    ) VALUES (
      'property', NEW.id, OLD.listing_status::text, NEW.listing_status::text,
      now(), 'agent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;