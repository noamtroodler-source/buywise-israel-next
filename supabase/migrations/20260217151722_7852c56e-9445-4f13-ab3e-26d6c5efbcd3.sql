
-- spend_credits: like record_credit_purchase but validates balance >= amount
CREATE OR REPLACE FUNCTION public.spend_credits(
  p_entity_type text,
  p_entity_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL,
  p_reference_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- Validate sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient credit balance. Current: %, Required: %', v_current_balance, p_amount;
  END IF;

  -- Insert debit transaction (negative amount)
  INSERT INTO public.credit_transactions (
    entity_type, entity_id, amount, balance_after,
    transaction_type, credit_type, reference_id, description
  ) VALUES (
    p_entity_type, p_entity_id, -p_amount, v_current_balance - p_amount,
    'spend', 'unrestricted', p_reference_id, p_description
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- RLS on active_boosts: entity owners can SELECT their own boosts
ALTER TABLE public.active_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entity owners can view their own boosts"
ON public.active_boosts
FOR SELECT
TO authenticated
USING (
  (entity_type = 'agency' AND entity_id IN (
    SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()
  ))
  OR
  (entity_type = 'developer' AND entity_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ))
);

-- Admins can manage all boosts
CREATE POLICY "Admins can manage all boosts"
ON public.active_boosts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS on credit_transactions: entity owners can SELECT their own transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entity owners can view their own credit transactions"
ON public.credit_transactions
FOR SELECT
TO authenticated
USING (
  (entity_type = 'agency' AND entity_id IN (
    SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()
  ))
  OR
  (entity_type = 'developer' AND entity_id IN (
    SELECT id FROM public.developers WHERE user_id = auth.uid()
  ))
);

-- Admins can manage all credit transactions
CREATE POLICY "Admins can manage all credit transactions"
ON public.credit_transactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS on visibility_products: anyone can read active products
ALTER TABLE public.visibility_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active visibility products"
ON public.visibility_products
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage visibility products"
ON public.visibility_products
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
