
-- =============================================
-- PHASE 1: MONETIZATION DATABASE FOUNDATION
-- =============================================

-- 1. membership_plans
CREATE TABLE public.membership_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  tier text NOT NULL,
  name text NOT NULL,
  max_listings int,
  max_seats int NOT NULL DEFAULT 1,
  max_blogs_per_month int NOT NULL DEFAULT 0,
  price_monthly_ils numeric NOT NULL DEFAULT 0,
  price_annual_ils numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, tier)
);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON public.membership_plans FOR SELECT USING (true);
CREATE POLICY "Admins can insert plans" ON public.membership_plans FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update plans" ON public.membership_plans FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 2. subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  plan_id uuid NOT NULL REFERENCES public.membership_plans(id),
  billing_cycle text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'trialing',
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  canceled_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Owner SELECT: join through agencies/developers to match user_id
CREATE POLICY "Owners can view own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (
  (entity_type = 'agency' AND entity_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()))
  OR (entity_type = 'developer' AND entity_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
CREATE POLICY "Admins can insert subscriptions" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update subscriptions" ON public.subscriptions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3. promo_codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  trial_days int NOT NULL DEFAULT 0,
  discount_percent numeric NOT NULL DEFAULT 0,
  discount_duration_months int NOT NULL DEFAULT 0,
  credit_schedule jsonb,
  credit_type text NOT NULL DEFAULT 'unrestricted',
  applies_to text NOT NULL DEFAULT 'all',
  max_redemptions int,
  times_redeemed int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active promos" ON public.promo_codes FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can insert promos" ON public.promo_codes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update promos" ON public.promo_codes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 4. subscription_promo_redemptions
CREATE TABLE public.subscription_promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id),
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  credit_months_granted int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own redemptions" ON public.subscription_promo_redemptions FOR SELECT TO authenticated USING (
  subscription_id IN (
    SELECT s.id FROM public.subscriptions s
    WHERE (s.entity_type = 'agency' AND s.entity_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()))
       OR (s.entity_type = 'developer' AND s.entity_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()))
  )
  OR public.has_role(auth.uid(), 'admin')
);
-- INSERT only via service role (no client policy)

-- 5. credit_packages
CREATE TABLE public.credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  credits_included int NOT NULL,
  price_ils numeric NOT NULL,
  bonus_percent numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view packages" ON public.credit_packages FOR SELECT USING (true);
CREATE POLICY "Admins can insert packages" ON public.credit_packages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update packages" ON public.credit_packages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. credit_transactions (append-only ledger)
CREATE TABLE public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  amount int NOT NULL,
  balance_after int NOT NULL DEFAULT 0,
  transaction_type text NOT NULL,
  credit_type text NOT NULL DEFAULT 'unrestricted',
  reference_id uuid,
  description text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_transactions_entity ON public.credit_transactions(entity_type, entity_id);
CREATE INDEX idx_credit_transactions_expires ON public.credit_transactions(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (
  (entity_type = 'agency' AND entity_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()))
  OR (entity_type = 'developer' AND entity_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()))
  OR public.has_role(auth.uid(), 'admin')
);
-- INSERT only via service role (no client policy)

-- 7. visibility_products
CREATE TABLE public.visibility_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  credit_cost int NOT NULL,
  duration_days int NOT NULL,
  max_slots int,
  applies_to text NOT NULL DEFAULT 'all',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.visibility_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.visibility_products FOR SELECT USING (true);
CREATE POLICY "Admins can insert products" ON public.visibility_products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.visibility_products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 8. active_boosts
CREATE TABLE public.active_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.visibility_products(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  credit_transaction_id uuid REFERENCES public.credit_transactions(id),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  slot_position int,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_active_boosts_target ON public.active_boosts(target_type, target_id) WHERE is_active = true;
CREATE INDEX idx_active_boosts_product ON public.active_boosts(product_id) WHERE is_active = true;

ALTER TABLE public.active_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active boosts" ON public.active_boosts FOR SELECT USING (true);
CREATE POLICY "Owners can insert boosts" ON public.active_boosts FOR INSERT TO authenticated WITH CHECK (
  (entity_type = 'agency' AND entity_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()))
  OR (entity_type = 'developer' AND entity_id IN (SELECT id FROM public.developers WHERE user_id = auth.uid()))
);
CREATE POLICY "Admins can update boosts" ON public.active_boosts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.get_credit_balance(p_entity_type text, p_entity_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(amount), 0)::int
  FROM public.credit_transactions
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND (expires_at IS NULL OR expires_at > now());
$$;

CREATE OR REPLACE FUNCTION public.get_active_boost_count(p_product_id uuid)
RETURNS int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.active_boosts
  WHERE product_id = p_product_id
    AND is_active = true
    AND ends_at > now();
$$;

-- =============================================
-- SEED DATA
-- =============================================

-- Agency plans
INSERT INTO public.membership_plans (entity_type, tier, name, max_listings, max_seats, max_blogs_per_month, price_monthly_ils, price_annual_ils, sort_order) VALUES
('agency', 'starter', 'Agency Starter', 15, 2, 2, 149, 1430, 1),
('agency', 'growth', 'Agency Growth', 50, 5, 5, 349, 3350, 2),
('agency', 'pro', 'Agency Pro', 150, 15, 15, 749, 7190, 3),
('agency', 'enterprise', 'Agency Enterprise', NULL, 999, 999, 1499, 14390, 4);

-- Developer plans
INSERT INTO public.membership_plans (entity_type, tier, name, max_listings, max_seats, max_blogs_per_month, price_monthly_ils, price_annual_ils, sort_order) VALUES
('developer', 'starter', 'Developer Starter', 3, 1, 1, 199, 1910, 1),
('developer', 'growth', 'Developer Growth', 10, 3, 3, 499, 4790, 2),
('developer', 'pro', 'Developer Pro', 30, 5, 10, 999, 9590, 3),
('developer', 'enterprise', 'Developer Enterprise', NULL, 999, 999, 1999, 19190, 4);

-- Credit packages
INSERT INTO public.credit_packages (name, credits_included, price_ils, bonus_percent, sort_order) VALUES
('Starter', 50, 99, 0, 1),
('Growth', 150, 249, 10, 2),
('Pro', 500, 699, 20, 3),
('Dominator', 1500, 1799, 30, 4);

-- Visibility products (9 boost types)
INSERT INTO public.visibility_products (slug, name, description, credit_cost, duration_days, max_slots, applies_to) VALUES
('homepage_sale_featured', 'Homepage Sale Featured', 'Featured position on homepage sale listings', 30, 7, 6, 'agency'),
('homepage_rent_featured', 'Homepage Rent Featured', 'Featured position on homepage rental listings', 25, 7, 6, 'agency'),
('homepage_project_featured', 'Homepage Project Featured', 'Featured position on homepage new projects', 40, 7, 4, 'developer'),
('search_priority', 'Search Priority Boost', 'Priority positioning in search results', 15, 7, NULL, 'all'),
('city_spotlight', 'City Spotlight', 'Featured in city page spotlight section', 20, 7, 3, 'all'),
('similar_listings_priority', 'Similar Listings Priority', 'Priority in You Might Also Like carousel', 10, 7, NULL, 'all'),
('agency_directory_featured', 'Agency Directory Featured', 'Featured position in agency directory', 25, 30, 5, 'agency'),
('developer_directory_featured', 'Developer Directory Featured', 'Featured position in developer directory', 25, 30, 5, 'developer'),
('email_digest_sponsored', 'Email Digest Sponsored', 'Sponsored slot in weekly email digest', 35, 7, 2, 'all');

-- Founding program promo code
INSERT INTO public.promo_codes (code, description, trial_days, discount_percent, discount_duration_months, credit_schedule, credit_type, applies_to) VALUES
('FOUNDING2026', 'Founding Program – 60-day trial, 25% off for 10 months, monthly credits', 60, 25, 10, '[150,150,50,50,50,50,50,50,50,50,50,50]'::jsonb, 'unrestricted', 'all');
