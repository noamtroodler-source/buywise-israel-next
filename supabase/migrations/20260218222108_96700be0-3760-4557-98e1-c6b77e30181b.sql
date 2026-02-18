
-- overage_rates table
CREATE TABLE public.overage_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  resource_type text NOT NULL,
  rate_ils numeric NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial rates
INSERT INTO public.overage_rates (entity_type, resource_type, rate_ils) VALUES
  ('agency',    'listing', 150),
  ('agency',    'seat',    100),
  ('developer', 'project', 500);

-- overage_records table
CREATE TABLE public.overage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  resource_type text NOT NULL,
  plan_limit integer NOT NULL,
  actual_count integer NOT NULL,
  overage_units integer GENERATED ALWAYS AS (GREATEST(0, actual_count - plan_limit)) STORED,
  rate_ils_per_unit numeric NOT NULL,
  total_amount_ils numeric GENERATED ALWAYS AS (GREATEST(0, actual_count - plan_limit) * rate_ils_per_unit) STORED,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, entity_type, resource_type, billing_period_start)
);

-- updated_at trigger for overage_records
CREATE TRIGGER overage_records_updated_at
  BEFORE UPDATE ON public.overage_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.overage_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overage_records ENABLE ROW LEVEL SECURITY;

-- overage_rates: readable by all authenticated users (needed for display)
CREATE POLICY "overage_rates_read" ON public.overage_rates FOR SELECT TO authenticated USING (true);

-- overage_rates: admin write
CREATE POLICY "overage_rates_admin_write" ON public.overage_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- overage_records: subscribers can only see their own
CREATE POLICY "overage_records_own_read" ON public.overage_records FOR SELECT TO authenticated
  USING (
    entity_id IN (
      SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()
      UNION
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );

-- overage_records: admin can read/write all
CREATE POLICY "overage_records_admin_all" ON public.overage_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
