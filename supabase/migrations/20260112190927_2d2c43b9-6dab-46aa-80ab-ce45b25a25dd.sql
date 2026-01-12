-- Create calculator_constants table for centralized configuration values
CREATE TABLE public.calculator_constants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  constant_key text UNIQUE NOT NULL,
  category text NOT NULL,
  value_numeric numeric,
  value_json jsonb,
  label text,
  description text,
  source text,
  source_url text,
  effective_from date,
  effective_until date,
  is_current boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calculator_constants ENABLE ROW LEVEL SECURITY;

-- Everyone can read constants
CREATE POLICY "Calculator constants are viewable by everyone"
ON public.calculator_constants FOR SELECT
USING (true);

-- Only admins can manage
CREATE POLICY "Admins can manage calculator constants"
ON public.calculator_constants FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_calculator_constants_updated_at
BEFORE UPDATE ON public.calculator_constants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed core constants from research (Jan 2025 data)

-- General constants
INSERT INTO public.calculator_constants (constant_key, category, value_numeric, label, description, source, source_url, effective_from, is_current) VALUES
('VAT_RATE', 'general', 0.18, 'VAT Rate', 'Israeli VAT rate effective January 2025', 'Israel Tax Authority', 'https://taxes.gov.il', '2025-01-01', true),
('VAT_RATE_PREVIOUS', 'general', 0.17, 'VAT Rate (2024)', 'Previous VAT rate before January 2025', 'Israel Tax Authority', 'https://taxes.gov.il', '2015-10-01', false);

-- Mortgage LTV limits (Bank of Israel Directive 329)
INSERT INTO public.calculator_constants (constant_key, category, value_numeric, label, description, source, source_url, effective_from, is_current) VALUES
('LTV_FIRST_TIME', 'mortgage', 0.75, 'First-Time Buyer LTV', 'Maximum loan-to-value for first-time buyers', 'Bank of Israel Directive 329 v11', 'https://www.boi.org.il', '2024-04-01', true),
('LTV_UPGRADER', 'mortgage', 0.70, 'Upgrader LTV', 'Maximum loan-to-value for upgrading buyers', 'Bank of Israel Directive 329 v11', 'https://www.boi.org.il', '2024-04-01', true),
('LTV_INVESTOR', 'mortgage', 0.50, 'Investor LTV', 'Maximum loan-to-value for investment properties', 'Bank of Israel Directive 329 v11', 'https://www.boi.org.il', '2024-04-01', true),
('LTV_FOREIGN', 'mortgage', 0.50, 'Foreign Buyer LTV', 'Maximum loan-to-value for foreign/non-resident buyers', 'Bank of Israel Directive 329 v11', 'https://www.boi.org.il', '2024-04-01', true),
('LTV_OLEH', 'mortgage', 0.75, 'Oleh Hadash LTV', 'Maximum loan-to-value for new immigrants', 'Bank of Israel Directive 329 v11', 'https://www.boi.org.il', '2024-04-01', true),
('MAX_PTI', 'mortgage', 0.50, 'Payment-to-Income Limit', 'Maximum monthly payment as percentage of net income', 'Bank of Israel Directive 329 v11', 'https://www.boi.org.il', '2024-04-01', true),
('VARIABLE_RATE_MAX_PERCENT', 'mortgage', 0.3333, 'Variable Rate Limit', 'Maximum portion of mortgage that can be variable rate (1/3)', 'Bank of Israel Directive 329 v11', 'https://www.boi.org.il', '2024-04-01', true);

-- Professional fees
INSERT INTO public.calculator_constants (constant_key, category, value_numeric, label, description, source, effective_from, is_current) VALUES
('LAWYER_RATE_MIN', 'fees', 0.005, 'Lawyer Fee Min %', 'Minimum lawyer fee as percentage of price (0.5%)', 'Market Standard', '2024-01-01', true),
('LAWYER_RATE_MAX', 'fees', 0.015, 'Lawyer Fee Max %', 'Maximum lawyer fee as percentage of price (1.5%)', 'Market Standard', '2024-01-01', true),
('LAWYER_MIN_FEE', 'fees', 5000, 'Lawyer Minimum Fee', 'Minimum lawyer fee in NIS (before VAT)', 'Market Standard', '2024-01-01', true),
('AGENT_RATE', 'fees', 0.02, 'Agent Commission', 'Standard buyer agent commission (2%)', 'Market Standard', '2024-01-01', true),
('AGENT_RATE_SELLER', 'fees', 0.02, 'Seller Agent Commission', 'Standard seller agent commission (2%)', 'Market Standard', '2024-01-01', true),
('APPRAISAL_FEE_MIN', 'fees', 1500, 'Appraisal Fee Min', 'Minimum appraisal fee in NIS', 'Market Standard', '2024-01-01', true),
('APPRAISAL_FEE_MAX', 'fees', 3500, 'Appraisal Fee Max', 'Maximum appraisal fee in NIS', 'Market Standard', '2024-01-01', true);

-- Government fees (2025)
INSERT INTO public.calculator_constants (constant_key, category, value_numeric, label, description, source, source_url, effective_from, is_current) VALUES
('TABU_NESACH_FEE', 'fees', 128.60, 'Tabu Extract Fee', 'Cost for official Tabu extract (nesach tabu)', 'Ministry of Justice', 'https://www.gov.il/he/departments/tabu', '2025-01-01', true),
('TABU_REGISTRATION_FEE', 'fees', 178, 'Tabu Registration Fee', 'Registration fee per property at Land Registry', 'Ministry of Justice', 'https://www.gov.il/he/departments/tabu', '2025-01-01', true),
('MORTGAGE_REGISTRATION_FEE', 'fees', 178, 'Mortgage Registration', 'Fee for registering mortgage lien', 'Ministry of Justice', 'https://www.gov.il/he/departments/tabu', '2025-01-01', true),
('MORTGAGE_ORIGINATION_MAX', 'fees', 360, 'Mortgage Origination Cap', 'Maximum bank can charge for mortgage origination', 'Bank of Israel', 'https://www.boi.org.il', '2024-01-01', true);

-- Tax rates
INSERT INTO public.calculator_constants (constant_key, category, value_numeric, label, description, source, source_url, effective_from, is_current) VALUES
('BETTERMENT_LEVY_RATE', 'tax', 0.50, 'Betterment Levy Rate', 'Tax on property value increase from planning changes', 'Planning & Building Law', 'https://www.gov.il', '2024-01-01', true),
('CAPITAL_GAINS_RATE', 'tax', 0.25, 'Capital Gains Tax', 'Tax rate on real estate capital gains', 'Israel Tax Authority', 'https://taxes.gov.il', '2024-01-01', true),
('CAPITAL_GAINS_EXEMPT_PERIOD', 'tax', 18, 'CGT Exemption Period', 'Months between sales for primary residence exemption', 'Israel Tax Authority', 'https://taxes.gov.il', '2024-01-01', true);

-- Arnona ranges (Ministry of Interior 2025)
INSERT INTO public.calculator_constants (constant_key, category, value_numeric, label, description, source, source_url, effective_from, is_current) VALUES
('ARNONA_RESIDENTIAL_MIN', 'municipal', 40.30, 'Arnona Min Rate', 'Minimum residential Arnona per sqm annually', 'Ministry of Interior', 'https://www.gov.il/he/departments/ministry_of_interior', '2025-01-01', true),
('ARNONA_RESIDENTIAL_MAX', 'municipal', 139.63, 'Arnona Max Rate', 'Maximum residential Arnona per sqm annually', 'Ministry of Interior', 'https://www.gov.il/he/departments/ministry_of_interior', '2025-01-01', true),
('ARNONA_ANNUAL_INCREASE_2025', 'municipal', 0.0529, 'Arnona 2025 Increase', 'Approved Arnona increase for 2025 (5.29%)', 'Ministry of Interior', 'https://www.gov.il/he/departments/ministry_of_interior', '2025-01-01', true);

-- Arnona discounts (value_json for complex rules)
INSERT INTO public.calculator_constants (constant_key, category, value_json, label, description, source, effective_from, is_current) VALUES
('ARNONA_DISCOUNT_OLIM_YEAR1', 'arnona_discounts', '{"max_percent": 90, "area_limit_sqm": 100}', 'New Immigrant Discount (Year 1)', 'Up to 90% discount on first 100sqm for new immigrants', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_OLIM_YEAR2', 'arnona_discounts', '{"max_percent": 66, "area_limit_sqm": 100}', 'New Immigrant Discount (Year 2)', '66% discount on first 100sqm in second year', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_DISABLED_90', 'arnona_discounts', '{"max_percent": 80, "area_limit_sqm": null}', 'Disability Discount (90%+)', 'Up to 80% discount for 90%+ disability', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_DISABLED_75', 'arnona_discounts', '{"max_percent": 40, "area_limit_sqm": null}', 'Disability Discount (75-89%)', 'Up to 40% discount for 75-89% disability', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_SENIOR_70', 'arnona_discounts', '{"max_percent": 30, "area_limit_sqm": 100}', 'Senior Citizen Discount', 'Up to 30% discount for age 70+ on first 100sqm', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_HOLOCAUST', 'arnona_discounts', '{"max_percent": 66, "area_limit_sqm": 70}', 'Holocaust Survivor Discount', 'Up to 66% discount on first 70sqm', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_SINGLE_PARENT', 'arnona_discounts', '{"max_percent": 20, "area_limit_sqm": null}', 'Single Parent Discount', 'Up to 20% discount for single parents', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_IDF', 'arnona_discounts', '{"max_percent": 100, "area_limit_sqm": null}', 'Active IDF Discount', '100% exemption for active IDF soldiers', 'Ministry of Interior', '2025-01-01', true),
('ARNONA_DISCOUNT_LOW_INCOME', 'arnona_discounts', '{"min_percent": 20, "max_percent": 90, "income_based": true}', 'Low Income Discount', '20-90% discount based on income level', 'Ministry of Interior', '2025-01-01', true);