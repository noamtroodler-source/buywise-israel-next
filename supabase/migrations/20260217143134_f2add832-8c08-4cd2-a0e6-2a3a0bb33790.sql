
-- Add Stripe reference columns to membership_plans
ALTER TABLE public.membership_plans
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_monthly_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_annual_id text;

-- Add Stripe reference columns to credit_packages
ALTER TABLE public.credit_packages
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- record_credit_purchase: atomically insert a credit transaction with correct balance_after
CREATE OR REPLACE FUNCTION public.record_credit_purchase(
  p_entity_type text,
  p_entity_id uuid,
  p_amount int,
  p_transaction_type text,
  p_credit_type text DEFAULT 'unrestricted',
  p_reference_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_balance int;
  v_new_id uuid;
BEGIN
  -- Lock to prevent concurrent balance corruption
  PERFORM pg_advisory_xact_lock(hashtext(p_entity_type || p_entity_id::text));

  -- Get current balance
  SELECT COALESCE(SUM(amount), 0)::int INTO v_current_balance
  FROM public.credit_transactions
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND (expires_at IS NULL OR expires_at > now());

  -- Insert transaction
  INSERT INTO public.credit_transactions (
    entity_type, entity_id, amount, balance_after,
    transaction_type, credit_type, reference_id, description, expires_at
  ) VALUES (
    p_entity_type, p_entity_id, p_amount, v_current_balance + p_amount,
    p_transaction_type, p_credit_type, p_reference_id, p_description, p_expires_at
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;
