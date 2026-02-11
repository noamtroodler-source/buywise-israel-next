
-- Update handle_price_reduction to track ANY price change (up or down)
CREATE OR REPLACE FUNCTION public.handle_price_reduction()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Track ANY price change (up or down)
  IF NEW.price <> OLD.price THEN
    IF OLD.original_price IS NULL THEN
      NEW.original_price := OLD.price;
    END IF;
    IF NEW.price < OLD.price THEN
      NEW.price_reduced_at := NOW();
    END IF;
  END IF;
  -- Clear when price returns to original
  IF NEW.original_price IS NOT NULL AND NEW.price = NEW.original_price THEN
    NEW.original_price := NULL;
    NEW.price_reduced_at := NULL;
  END IF;
  RETURN NEW;
END;
$function$;
