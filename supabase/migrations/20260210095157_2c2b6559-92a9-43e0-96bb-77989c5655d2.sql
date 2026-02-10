
CREATE OR REPLACE FUNCTION handle_price_reduction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price < OLD.price THEN
    IF OLD.original_price IS NULL THEN
      NEW.original_price := OLD.price;
    END IF;
    NEW.price_reduced_at := NOW();
  END IF;
  IF NEW.original_price IS NOT NULL AND NEW.price >= NEW.original_price THEN
    NEW.original_price := NULL;
    NEW.price_reduced_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
