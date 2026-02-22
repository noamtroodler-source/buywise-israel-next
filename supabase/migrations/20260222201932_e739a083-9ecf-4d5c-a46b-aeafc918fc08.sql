
-- Drop the actual trigger on blog_posts first
DROP TRIGGER IF EXISTS on_blog_approval ON public.blog_posts;

-- Drop old tables (CASCADE handles remaining deps)
DROP TABLE IF EXISTS public.active_boosts CASCADE;
DROP TABLE IF EXISTS public.visibility_products CASCADE;
DROP TABLE IF EXISTS public.credit_transactions CASCADE;
DROP TABLE IF EXISTS public.credit_packages CASCADE;
DROP TABLE IF EXISTS public.overage_rates CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS public.get_credit_balance(text, uuid);
DROP FUNCTION IF EXISTS public.record_credit_purchase(text, uuid, integer, text, text, uuid, text, timestamp with time zone);
DROP FUNCTION IF EXISTS public.spend_credits(text, uuid, integer, text, uuid);
DROP FUNCTION IF EXISTS public.get_active_boost_count(uuid);
DROP FUNCTION IF EXISTS public.enforce_boost_slot_cap();
DROP FUNCTION IF EXISTS public.grant_blog_approval_credits();

-- ============================================
-- Create new tables
-- ============================================

-- Featured Listings
CREATE TABLE public.featured_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  is_free_credit boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_featured_listings_active_unique 
  ON public.featured_listings (agency_id, property_id) 
  WHERE is_active = true;

CREATE INDEX idx_featured_listings_active ON public.featured_listings (is_active) WHERE is_active = true;

ALTER TABLE public.featured_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured listings"
  ON public.featured_listings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Agency admins can manage own featured listings"
  ON public.featured_listings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = featured_listings.agency_id 
        AND a.admin_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = featured_listings.agency_id 
        AND a.admin_user_id = auth.uid()
    )
  );

-- Founding Partners
CREATE TABLE public.founding_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  option text NOT NULL CHECK (option IN ('option_a', 'option_b')),
  discount_percent numeric NOT NULL DEFAULT 0,
  discount_locked boolean NOT NULL DEFAULT false,
  free_credits_per_month int NOT NULL DEFAULT 3,
  free_credits_duration_months int NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  exclusivity_ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.founding_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency can view own founding partner status"
  ON public.founding_partners FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies a 
      WHERE a.id = founding_partners.agency_id 
        AND a.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage founding partners"
  ON public.founding_partners FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Founding Featured Credits
CREATE TABLE public.founding_featured_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founding_partner_id uuid NOT NULL REFERENCES public.founding_partners(id) ON DELETE CASCADE,
  month_number int NOT NULL,
  credits_granted int NOT NULL DEFAULT 3,
  credits_used int NOT NULL DEFAULT 0,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX idx_founding_credits_unique 
  ON public.founding_featured_credits (founding_partner_id, month_number);

ALTER TABLE public.founding_featured_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency can view own founding credits"
  ON public.founding_featured_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.founding_partners fp
      JOIN public.agencies a ON a.id = fp.agency_id
      WHERE fp.id = founding_featured_credits.founding_partner_id
        AND a.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage founding credits"
  ON public.founding_featured_credits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
