
-- Simple function to increment times_redeemed on promo_codes
CREATE OR REPLACE FUNCTION public.increment_promo_redemptions(p_promo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.promo_codes
  SET times_redeemed = times_redeemed + 1
  WHERE id = p_promo_id;
END;
$$;

-- Add unique constraint on subscriptions for upsert
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_entity_unique UNIQUE (entity_type, entity_id);
