-- Phase 1: Complete Database Schema for BuyWise Real Estate Platform
-- Based on comprehensive research data from Israeli Real Estate Research Reports

-- ============================================
-- TABLE 1: Purchase Tax Brackets
-- ============================================
CREATE TABLE public.purchase_tax_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_type TEXT NOT NULL, -- first_time, upgrader, investor, oleh, company, foreign
  bracket_min NUMERIC NOT NULL,
  bracket_max NUMERIC,
  rate_percent NUMERIC NOT NULL,
  effective_from DATE NOT NULL DEFAULT '2024-01-01',
  effective_until DATE,
  is_current BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchase_tax_brackets ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Purchase tax brackets are viewable by everyone"
ON public.purchase_tax_brackets FOR SELECT USING (true);

-- Admin management
CREATE POLICY "Admins can manage purchase tax brackets"
ON public.purchase_tax_brackets FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TABLE 2: Mortgage Tracks
-- ============================================
CREATE TABLE public.mortgage_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_type TEXT NOT NULL, -- prime, fixed_shekel, fixed_cpi, variable_5yr, variable_cpi
  hebrew_name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  description TEXT,
  current_rate_min NUMERIC,
  current_rate_max NUMERIC,
  is_cpi_linked BOOLEAN DEFAULT false,
  risk_level TEXT, -- low, medium, high
  prepayment_penalty TEXT,
  best_use_case TEXT,
  foreign_buyer_notes TEXT,
  boi_limit_percent INTEGER, -- Bank of Israel limit for this track type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mortgage_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mortgage tracks are viewable by everyone"
ON public.mortgage_tracks FOR SELECT USING (true);

CREATE POLICY "Admins can manage mortgage tracks"
ON public.mortgage_tracks FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TABLE 3: Professional Fees
-- ============================================
CREATE TABLE public.professional_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type TEXT NOT NULL, -- lawyer, agent_buyer, agent_seller, mortgage_broker, notary, appraiser, developer_lawyer
  hebrew_name TEXT,
  rate_min_percent NUMERIC,
  rate_max_percent NUMERIC,
  flat_fee_min NUMERIC,
  flat_fee_max NUMERIC,
  includes_vat BOOLEAN DEFAULT false,
  notes TEXT,
  applies_to TEXT[] DEFAULT ARRAY['all'], -- new_construction, resale, all
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Professional fees are viewable by everyone"
ON public.professional_fees FOR SELECT USING (true);

CREATE POLICY "Admins can manage professional fees"
ON public.professional_fees FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TABLE 4: Document Checklist Items
-- ============================================
CREATE TABLE public.document_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage TEXT NOT NULL, -- pre_approval, contract_signing, closing, post_purchase
  document_name_english TEXT NOT NULL,
  document_name_hebrew TEXT,
  transliteration TEXT,
  where_to_get TEXT,
  typical_timeline TEXT,
  notes TEXT,
  required_for TEXT[] DEFAULT ARRAY['all'], -- israeli, oleh, foreign, self_employed
  is_critical BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document checklist items are viewable by everyone"
ON public.document_checklist_items FOR SELECT USING (true);

CREATE POLICY "Admins can manage document checklist items"
ON public.document_checklist_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TABLE 5: Glossary Terms
-- ============================================
CREATE TABLE public.glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hebrew_term TEXT NOT NULL,
  transliteration TEXT,
  english_term TEXT NOT NULL,
  simple_explanation TEXT,
  detailed_explanation TEXT,
  usage_context TEXT,
  pro_tip TEXT,
  category TEXT, -- legal, tax, mortgage, property, general, government
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.glossary_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Glossary terms are viewable by everyone"
ON public.glossary_terms FOR SELECT USING (true);

CREATE POLICY "Admins can manage glossary terms"
ON public.glossary_terms FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TABLE 6: Renovation Costs
-- ============================================
CREATE TABLE public.renovation_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  hebrew_name TEXT,
  cost_range_min NUMERIC,
  cost_range_max NUMERIC,
  unit TEXT, -- per_sqm, per_unit, per_bathroom, per_kitchen, flat
  notes TEXT,
  category TEXT, -- kitchen, bathroom, flooring, electrical, plumbing, painting, windows, general
  quality_level TEXT, -- basic, standard, premium
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.renovation_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Renovation costs are viewable by everyone"
ON public.renovation_costs FOR SELECT USING (true);

CREATE POLICY "Admins can manage renovation costs"
ON public.renovation_costs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TABLE 7: Historical Prices
-- ============================================
CREATE TABLE public.historical_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  year INTEGER NOT NULL,
  average_price NUMERIC,
  average_price_sqm NUMERIC,
  yoy_change_percent NUMERIC,
  transaction_count INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(city, year)
);

-- Enable RLS
ALTER TABLE public.historical_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Historical prices are viewable by everyone"
ON public.historical_prices FOR SELECT USING (true);

CREATE POLICY "Admins can manage historical prices"
ON public.historical_prices FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TABLE 8: Neighborhoods (Enhanced)
-- ============================================
CREATE TABLE public.neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID REFERENCES public.cities(id) ON DELETE CASCADE,
  city_name TEXT NOT NULL, -- Denormalized for easier queries
  name TEXT NOT NULL,
  hebrew_name TEXT,
  character TEXT,
  price_tier TEXT, -- budget, mid, premium, luxury
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  avg_price_sqm NUMERIC,
  target_buyers TEXT,
  pros TEXT[],
  cons TEXT[],
  anglo_presence TEXT, -- low, medium, high
  has_good_schools BOOLEAN DEFAULT false,
  is_religious BOOLEAN DEFAULT false,
  near_beach BOOLEAN DEFAULT false,
  near_train BOOLEAN DEFAULT false,
  walkability_score INTEGER, -- 1-10
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Neighborhoods are viewable by everyone"
ON public.neighborhoods FOR SELECT USING (true);

CREATE POLICY "Admins can manage neighborhoods"
ON public.neighborhoods FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster city lookups
CREATE INDEX idx_neighborhoods_city ON public.neighborhoods(city_name);
CREATE INDEX idx_neighborhoods_city_id ON public.neighborhoods(city_id);

-- ============================================
-- ENHANCE CITIES TABLE with new columns
-- ============================================
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS arnona_rate_sqm NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS arnona_monthly_avg NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS average_vaad_bayit NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS renovation_cost_basic NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS renovation_cost_premium NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS anglo_presence TEXT;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS commute_time_tel_aviv INTEGER;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS has_train_station BOOLEAN DEFAULT false;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS socioeconomic_rank INTEGER;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS gross_yield_percent NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS net_yield_percent NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS yoy_price_change NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS average_price_sqm NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS median_apartment_price NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS price_range_min NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS price_range_max NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS rental_3_room_min NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS rental_3_room_max NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS rental_4_room_min NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS rental_4_room_max NUMERIC;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS investment_score INTEGER;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS buyer_profile_match TEXT[];
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS key_developments TEXT;
ALTER TABLE public.cities ADD COLUMN IF NOT EXISTS market_outlook TEXT;

-- ============================================
-- SEED DATA: Purchase Tax Brackets (2024/2025)
-- ============================================

-- First-time buyer (Dira Yechida) brackets
INSERT INTO public.purchase_tax_brackets (buyer_type, bracket_min, bracket_max, rate_percent, notes) VALUES
('first_time', 0, 1978745, 0, 'No tax on first bracket for first-time buyers'),
('first_time', 1978745, 2347040, 3.5, 'Standard first-time rate'),
('first_time', 2347040, 6055070, 5, 'Higher bracket'),
('first_time', 6055070, 20183570, 8, 'Luxury bracket'),
('first_time', 20183570, NULL, 10, 'Top bracket');

-- Investor/Additional property brackets
INSERT INTO public.purchase_tax_brackets (buyer_type, bracket_min, bracket_max, rate_percent, notes) VALUES
('investor', 0, 6055070, 8, 'Flat 8% for investors up to threshold'),
('investor', 6055070, NULL, 10, 'Top bracket for high-value properties');

-- Oleh Hadash (New Immigrant) brackets - special benefits
INSERT INTO public.purchase_tax_brackets (buyer_type, bracket_min, bracket_max, rate_percent, notes) VALUES
('oleh', 0, 1978745, 0, 'Tax exempt on first bracket'),
('oleh', 1978745, 6055070, 0.5, 'Reduced 0.5% rate for Olim - valid 7 years from aliyah'),
('oleh', 6055070, NULL, 5, 'Standard rate above threshold');

-- Foreign buyer brackets (non-resident)
INSERT INTO public.purchase_tax_brackets (buyer_type, bracket_min, bracket_max, rate_percent, notes) VALUES
('foreign', 0, 6055070, 8, 'Same as investor rate'),
('foreign', 6055070, NULL, 10, 'Top bracket');

-- Company buyer brackets
INSERT INTO public.purchase_tax_brackets (buyer_type, bracket_min, bracket_max, rate_percent, notes) VALUES
('company', 0, 6055070, 8, 'Corporate purchase rate'),
('company', 6055070, NULL, 10, 'Top bracket for companies');

-- Upgrader (selling primary and buying new) brackets
INSERT INTO public.purchase_tax_brackets (buyer_type, bracket_min, bracket_max, rate_percent, notes) VALUES
('upgrader', 0, 1978745, 0, 'Same as first-time if sold within 18 months'),
('upgrader', 1978745, 2347040, 3.5, 'Must sell previous property within 18 months'),
('upgrader', 2347040, 6055070, 5, 'Higher bracket'),
('upgrader', 6055070, 20183570, 8, 'Luxury bracket'),
('upgrader', 20183570, NULL, 10, 'Top bracket');

-- ============================================
-- SEED DATA: Mortgage Tracks
-- ============================================
INSERT INTO public.mortgage_tracks (track_type, hebrew_name, english_name, description, current_rate_min, current_rate_max, is_cpi_linked, risk_level, prepayment_penalty, best_use_case, foreign_buyer_notes, boi_limit_percent) VALUES
('prime', 'פריים', 'Prime Rate', 'Variable rate linked to Bank of Israel prime rate (currently ~6%). Fluctuates with monetary policy. Most flexible but highest volatility.', 5.75, 6.25, false, 'high', 'None - can prepay anytime', 'Best for those planning to sell/refinance within 5 years or expecting rate drops', 'Same terms for foreign buyers', 33),
('fixed_shekel', 'קבועה לא צמודה', 'Fixed Non-Indexed', 'Fixed interest rate in shekels for entire term. No CPI linkage. Predictable payments but higher starting rate.', 4.7, 5.2, false, 'low', 'High penalty for early repayment', 'Best for risk-averse borrowers wanting payment certainty', 'Recommended for foreign currency earners', 33),
('fixed_cpi', 'קבועה צמודה', 'Fixed CPI-Linked', 'Fixed rate plus CPI adjustment. Lower nominal rate but principal increases with inflation.', 3.4, 3.8, true, 'medium', 'Moderate penalty', 'Good when expecting low inflation. Balance of stability and cost.', 'Principal grows with Israeli inflation - consider currency risk', 33),
('variable_5yr', 'משתנה כל 5 שנים', 'Variable Every 5 Years', 'Rate resets every 5 years based on market conditions. Medium-term predictability.', 4.3, 4.8, false, 'medium', 'Low penalty within reset period', 'Good compromise between fixed and prime', 'Same terms available', 33),
('variable_cpi', 'משתנה צמודה', 'Variable CPI-Linked', 'Variable rate that resets periodically, plus CPI indexation. Lowest starting rate but double risk exposure.', 2.8, 3.5, true, 'high', 'Low penalty', 'Only if confident inflation stays low and want lowest initial payment', 'Highest risk for USD/EUR earners due to dual exposure', 34);

-- ============================================
-- SEED DATA: Professional Fees
-- ============================================
INSERT INTO public.professional_fees (fee_type, hebrew_name, rate_min_percent, rate_max_percent, flat_fee_min, flat_fee_max, includes_vat, notes, applies_to) VALUES
('lawyer', 'עורך דין', 0.5, 1.5, 5000, 25000, false, 'Buyer attorney fees. VAT (17%) added on top. Typically 0.5-1% for resale, higher for complex deals.', ARRAY['resale', 'all']),
('developer_lawyer', 'עורך דין קבלן', 1.5, 2.0, NULL, NULL, false, 'Developer attorney fees for new construction. Non-negotiable, set by developer.', ARRAY['new_construction']),
('agent_buyer', 'תיווך קונה', 1.0, 2.0, NULL, NULL, false, 'Buyer agent commission. Standard is 2% + VAT. Sometimes negotiable.', ARRAY['resale']),
('agent_seller', 'תיווך מוכר', 1.0, 2.0, NULL, NULL, false, 'Seller agent commission. Usually 2% + VAT. Paid by seller.', ARRAY['resale']),
('mortgage_broker', 'יועץ משכנתא', 0.3, 0.5, 3000, 8000, false, 'Optional but recommended. Can save significant money on mortgage terms.', ARRAY['all']),
('appraiser', 'שמאי', NULL, NULL, 1500, 3500, true, 'Required by bank for mortgage. Price varies by property size and complexity.', ARRAY['all']),
('notary', 'נוטריון', NULL, NULL, 500, 2000, true, 'For certified copies, powers of attorney. Required for foreign buyers.', ARRAY['all']),
('mortgage_origination', 'עמלת פתיחת תיק', NULL, NULL, 360, 360, true, 'Bank maximum fee for opening mortgage file (regulated).', ARRAY['all']),
('tabu_registration', 'רישום טאבו', NULL, NULL, 300, 600, true, 'Land registry fee. Varies by property value.', ARRAY['all']),
('caveat_registration', 'הערת אזהרה', NULL, NULL, 130, 250, true, 'Warning note registration to protect purchase.', ARRAY['all']),
('mortgage_registration', 'רישום משכנתא', NULL, NULL, 200, 350, true, 'Mortgage lien registration at land registry.', ARRAY['all']),
('bank_guarantee', 'ערבות בנקאית', 0.5, 1.5, NULL, NULL, false, 'For new construction - bank guarantee on developer payments.', ARRAY['new_construction']);

-- ============================================
-- SEED DATA: Document Checklist Items
-- ============================================
INSERT INTO public.document_checklist_items (stage, document_name_english, document_name_hebrew, transliteration, where_to_get, typical_timeline, notes, required_for, is_critical, sort_order) VALUES
-- Pre-Approval Stage
('pre_approval', 'Identity Document', 'תעודת זהות', 'Teudat Zehut', 'Ministry of Interior', 'Already have', 'Israeli ID card with attachment (ספח)', ARRAY['israeli'], true, 1),
('pre_approval', 'Passport', 'דרכון', 'Darkon', 'Home country embassy', 'Already have', 'Valid passport, notarized copy for foreign buyers', ARRAY['oleh', 'foreign'], true, 2),
('pre_approval', 'Proof of Income - Salaried', 'תלושי משכורת', 'Tlushei Maskoret', 'Employer', '1-2 days', 'Last 3 salary slips. Some banks require 6 months.', ARRAY['israeli', 'oleh'], true, 3),
('pre_approval', 'Proof of Income - Self Employed', 'שומות מס', 'Shumot Mas', 'Accountant/Tax Authority', '1-2 weeks', 'Last 2-3 years tax assessments', ARRAY['self_employed'], true, 4),
('pre_approval', 'Bank Statements', 'דפי חשבון בנק', 'Dapei Cheshbon Bank', 'Your bank', '1-2 days', 'Last 3-6 months showing income deposits', ARRAY['all'], true, 5),
('pre_approval', 'Proof of Equity/Down Payment', 'אישור הון עצמי', 'Ishur Hon Atzmi', 'Bank/Investment accounts', '1-3 days', 'Statements showing available funds for down payment', ARRAY['all'], true, 6),
('pre_approval', 'Teudat Oleh', 'תעודת עולה', 'Teudat Oleh', 'Jewish Agency/Ministry of Aliyah', 'At aliyah', 'Required for Oleh tax benefits - shows aliyah date', ARRAY['oleh'], true, 7),
('pre_approval', 'Credit Report', 'דוח BDI', 'Doch BDI', 'Bank or BDI directly', '1-2 days', 'Israeli credit report. Bank usually pulls automatically.', ARRAY['israeli'], false, 8),
('pre_approval', 'Employment Verification Letter', 'אישור מעסיק', 'Ishur Maasik', 'Employer HR', '2-5 days', 'Letter confirming employment, salary, tenure', ARRAY['all'], false, 9),
('pre_approval', 'Foreign Income Documentation', 'אישור הכנסה מחול', 'Ishur Hachnasa MeChul', 'Foreign employer/bank', '1-2 weeks', 'Translated and notarized. Some banks discount 10-30%.', ARRAY['foreign', 'oleh'], true, 10),

-- Contract Signing Stage
('contract_signing', 'Mortgage Pre-Approval', 'אישור עקרוני', 'Ishur Ikroni', 'Bank', '1-7 days', 'Letter confirming bank will lend. Usually valid 60-90 days.', ARRAY['all'], true, 11),
('contract_signing', 'Property Tabu Extract', 'נסח טאבו', 'Nesach Tabu', 'Tabu.gov.il or lawyer', 'Same day', 'Land registry extract showing ownership, liens, notes', ARRAY['all'], true, 12),
('contract_signing', 'Apartment Registration Certificate', 'תעודת בית משותף', 'Teudat Beit Meshutaf', 'Land Registry', '1-3 days', 'Confirms apartment registration in building', ARRAY['all'], false, 13),
('contract_signing', 'Building Permit', 'היתר בנייה', 'Heter Bniya', 'Local municipality', '1-2 weeks', 'For new construction or recent additions', ARRAY['all'], false, 14),
('contract_signing', 'Engineer Report', 'חוות דעת מהנדס', 'Chavat Daat Mehandess', 'Hire privately', '1-2 weeks', 'Recommended for older buildings. Checks structure, problems.', ARRAY['all'], false, 15),
('contract_signing', 'Power of Attorney', 'ייפוי כוח', 'Yipui Koach', 'Notary', '1-2 days', 'If buying from abroad. Must be notarized and apostilled.', ARRAY['foreign'], true, 16),

-- Closing Stage
('closing', 'Final Mortgage Approval', 'אישור סופי', 'Ishur Sofi', 'Bank', '1-2 weeks', 'After appraisal and all docs submitted', ARRAY['all'], true, 17),
('closing', 'Bank Appraisal', 'שומה', 'Shuma', 'Bank-appointed appraiser', '3-7 days', 'Bank orders after contract signed. You pay.', ARRAY['all'], true, 18),
('closing', 'Life Insurance', 'ביטוח חיים', 'Bituach Chaim', 'Insurance company', '1-2 weeks', 'Required by bank. Must cover mortgage balance.', ARRAY['all'], true, 19),
('closing', 'Property Insurance', 'ביטוח מבנה', 'Bituach Mivne', 'Insurance company', '1-2 days', 'Structure insurance required by bank', ARRAY['all'], true, 20),
('closing', 'Tax Clearance', 'אישור מס שבח/רכישה', 'Ishur Mas Shevach/Rechisha', 'Tax Authority', '1-4 weeks', 'Lawyer usually handles. Required for registration.', ARRAY['all'], true, 21),
('closing', 'Municipal Clearance', 'אישור עירייה', 'Ishur Iriya', 'Municipality', '1-2 weeks', 'Confirms no debts on property (arnona, etc.)', ARRAY['all'], true, 22),

-- Post-Purchase
('post_purchase', 'Tabu Registration', 'רישום בטאבו', 'Rishum BaTabu', 'Lawyer submits', '2-6 months', 'Transfer of ownership. Lawyer handles.', ARRAY['all'], true, 23),
('post_purchase', 'Arnona Registration', 'רישום ארנונה', 'Rishum Arnona', 'Municipality', '1-2 weeks', 'Register as new owner for property tax', ARRAY['all'], true, 24),
('post_purchase', 'Utility Transfers', 'העברת חשבונות', 'Haavarat Cheshbonot', 'Electric/Water/Gas companies', '1-2 weeks', 'Transfer accounts to your name', ARRAY['all'], false, 25);

-- ============================================
-- SEED DATA: Glossary Terms
-- ============================================
INSERT INTO public.glossary_terms (hebrew_term, transliteration, english_term, simple_explanation, detailed_explanation, usage_context, pro_tip, category) VALUES
('טאבו', 'Tabu', 'Land Registry', 'The official Israeli land registry where property ownership is recorded', 'The Land Registry (Tabu) is managed by the Ministry of Justice and contains all registered land parcels and buildings in Israel. A "Nesach Tabu" (registry extract) shows current ownership, mortgages, liens, and any warning notes on a property.', 'Checking property ownership, registering purchase', 'Always get a fresh Nesach Tabu before signing - it shows any liens or legal issues', 'legal'),
('נסח טאבו', 'Nesach Tabu', 'Land Registry Extract', 'Official document showing property ownership and any registered claims', 'This is the key document proving ownership. It shows: current owner(s), property size, mortgages registered, any "Hearat Azhara" (warning notes), and historical transactions. Can be obtained online at tabu.gov.il.', 'Due diligence, mortgage application', 'Compare the Nesach to what seller claims - any discrepancy is a red flag', 'legal'),
('הערת אזהרה', 'Hearat Azhara', 'Warning Note/Caveat', 'A legal note registered on property to protect a buyer claim', 'When you sign a purchase contract, your lawyer immediately registers this note at Tabu. It warns anyone checking that you have a claim on the property, preventing the seller from selling to someone else or taking additional mortgages.', 'After signing purchase contract', 'Insist on same-day registration - this protects your deposit', 'legal'),
('משכנתא', 'Mashkanta', 'Mortgage', 'A loan secured against property', 'Israeli mortgages are typically for 15-30 years. The Bank of Israel regulates key terms: maximum LTV (75% for first property), PTI limits, and requires at least 1/3 of the loan in fixed or CPI-linked tracks.', 'Buying property', 'Shop multiple banks - rates can vary significantly. Use a mortgage advisor.', 'mortgage'),
('פריים', 'Prime', 'Prime Rate', 'The base interest rate banks charge, linked to Bank of Israel rate', 'Currently around 6%. Prime mortgages are calculated as Prime + margin (e.g., Prime - 0.5%). Very volatile - when BoI raises rates, your payment increases immediately.', 'Choosing mortgage tracks', 'Good for short-term loans but risky for 25+ year mortgages', 'mortgage'),
('מדד', 'Madad', 'CPI Index', 'Consumer Price Index - measures inflation', 'CPI-linked mortgages have lower nominal rates but the principal increases with inflation. If CPI rises 3% annually, your debt grows 3%. Called "Tzmuda" (indexed) loans.', 'Mortgage selection, new construction payments', 'In high inflation environments, non-indexed loans are often better despite higher rates', 'mortgage'),
('מס רכישה', 'Mas Rechisha', 'Purchase Tax', 'Tax paid by buyer on property purchase', 'Varies by buyer type: First-time buyers pay 0% up to ~2M ILS then graduated rates. Investors pay 8% from first shekel. Olim get special reduced rates for 7 years.', 'Buying property', 'Calculate your exact rate before making offers - it significantly affects total cost', 'tax'),
('מס שבח', 'Mas Shevach', 'Capital Gains Tax', 'Tax on profit when selling property', '25% on gains. Primary residence often exempt (up to 4.5M ILS every 4 years). Calculation includes inflation adjustments and improvement costs.', 'Selling property', 'Keep all renovation receipts - they reduce your taxable gain', 'tax'),
('ארנונה', 'Arnona', 'Property Tax/Municipal Tax', 'Annual tax paid to local municipality', 'Based on property size and location. Varies significantly by city. Paid directly to municipality, not included in mortgage.', 'Owning property', 'Budget 500-1500 ILS/month depending on city and apartment size', 'tax'),
('ועד בית', 'Vaad Bayit', 'Building Committee/HOA Fees', 'Monthly building maintenance fees', 'Covers cleaning, gardening, building insurance, elevator maintenance, reserve fund. Ranges from 150-800 ILS/month depending on building amenities.', 'Apartment ownership', 'Ask to see Vaad accounts - poorly managed buildings have hidden problems', 'property'),
('דירת גן', 'Dirat Gan', 'Garden Apartment', 'Ground floor apartment with private garden', 'Very desirable in Israel. Private outdoor space is rare. Usually 10-20% premium over regular apartments. Consider: privacy, garden maintenance costs, ground floor security.', 'Property search', 'Check if garden is registered in Tabu - some are "usage rights" only', 'property'),
('פנטהאוז', 'Penthouse', 'Penthouse', 'Top floor apartment, often with roof terrace', 'Premium apartments with views and outdoor space. Watch for: water damage history (top floor = first to leak), summer heat, elevator dependency.', 'Property search', 'Verify the roof terrace is legally permitted and registered', 'property'),
('תמא 38', 'TAMA 38', 'Urban Renewal/Strengthening', 'National program for earthquake-proofing old buildings', 'Buildings from before 1980 can be strengthened. Residents often get free renovations, extra rooms, or parking in exchange for letting developer add floors.', 'Buying in older buildings', 'TAMA 38 potential can significantly increase property value', 'property'),
('קבלן', 'Kablan', 'Developer/Contractor', 'Company building new residential projects', 'When buying from developer: check their track record, financial stability, get bank guarantees on deposits. New construction is regulated by Sale Law (Chok HaMechira).', 'New construction purchase', 'Research the Kablan online - check for lawsuits and complaints', 'legal'),
('דירה להשקעה', 'Dira LeHashkaa', 'Investment Property', 'Property purchased for rental income', 'Different tax treatment: 8% purchase tax, rental income taxed (3 methods), potential capital gains on sale. LTV limited to 50% for investment properties.', 'Investor purchases', 'Run real numbers including all costs - Israeli yields are relatively low', 'tax'),
('יועץ משכנתאות', 'Yoetz Mashkantaot', 'Mortgage Advisor/Broker', 'Professional who helps get best mortgage terms', 'Cost: 0.3-0.5% of loan or flat fee. Good advisors can save tens of thousands in interest. They know which banks suit your situation.', 'Getting a mortgage', 'A good advisor pays for themselves many times over', 'mortgage'),
('שמאי', 'Shamai', 'Appraiser', 'Professional who assesses property value', 'Required by bank before mortgage approval. Bank chooses the appraiser. Cost: 1500-3500 ILS. Appraisal determines maximum loan amount.', 'Mortgage process', 'If appraisal comes low, you may need larger down payment', 'mortgage'),
('עורך דין', 'Orech Din', 'Attorney/Lawyer', 'Legal professional handling transaction', 'Essential in Israeli real estate. Handles: contract review, due diligence, registration, tax filings. Cost: 0.5-1.5% + VAT.', 'Any property transaction', 'Use a real estate specialist, not your family lawyer', 'legal'),
('ייפוי כוח', 'Yipui Koach', 'Power of Attorney', 'Legal authorization to act on someone behalf', 'Required if buying from abroad or cannot attend signings. Must be notarized and apostilled for foreign documents.', 'Remote purchases', 'Limit the POA scope - dont give unlimited authority', 'legal'),
('נוטריון', 'Notarion', 'Notary', 'Official who certifies documents', 'Authenticates signatures, certifies copies. Required for POA, foreign documents. Different from lawyer (can be same person).', 'Document authentication', 'For foreign docs, check if apostille needed in addition to notarization', 'legal'),
('היתר בנייה', 'Heter Bniya', 'Building Permit', 'Official permission to construct or modify', 'Always verify construction is permitted. Unpermitted additions are common and problematic. Check with municipality.', 'Due diligence', 'Unpermitted construction can block sale or require demolition', 'legal'),
('חוק המכר', 'Chok HaMechira', 'Sale Law', 'Law protecting buyers from developers', 'Requires bank guarantees on deposits, defines warranty periods, mandates certain disclosures. Only applies to new construction from registered developers.', 'New construction', 'Ensure developer provides Sale Law guarantees - non-negotiable', 'legal'),
('הון עצמי', 'Hon Atzmi', 'Equity/Down Payment', 'Buyers own funds for purchase', 'Minimum 25% for first property, 30% for additional. Must be clean (not borrowed). Banks verify source of funds.', 'Mortgage application', 'Gifts from family are OK but need documentation', 'mortgage'),
('תשלומים לקבלן', 'Tashlumim LeKablan', 'Payment Schedule to Developer', 'Staged payments during construction', 'New construction typically: 15% at contract, then milestone payments during build, 10-15% at delivery. All indexed to building cost index.', 'New construction', 'Budget extra for index linkage - can add 5-10% to final price', 'property'),
('אחוזי בנייה', 'Achuzei Bniya', 'Building Rights Percentage', 'Permitted construction relative to land size', 'Determines how much can be built on a plot. Affects property value, especially for houses/land. TAMA 38 often adds building rights.', 'Property valuation', 'Check remaining building rights - can be valuable for expansion', 'property'),
('זכויות בנייה', 'Zchuyot Bniya', 'Building Rights', 'Legal right to construct on land', 'May be separate from land ownership. Some properties have limited or encumbered rights. Verify in planning authority.', 'Due diligence', 'Essential to check before buying land or planning renovation', 'legal'),
('מינהל מקרקעי ישראל', 'Minhal Mekarkei Yisrael', 'Israel Land Authority', 'Government body managing state-owned land', 'Much Israeli land is leased from ILA, not owned outright. Check if property is on ILA land - different rules apply.', 'Property ownership', 'ILA land has lease terms and may require consent for transactions', 'legal'),
('חכירה', 'Chakira', 'Lease/Leasehold', 'Long-term land lease from Israel Land Authority', 'Common in Israel. 49-98 year renewable leases. "Capitalized" leases function like ownership. Check lease terms carefully.', 'Property ownership', 'Most leases are capitalized and practically equivalent to ownership', 'legal'),
('היוון', 'Hiyun', 'Capitalization', 'Prepayment of land lease fees', 'One-time payment to ILA converting annual fees to ownership-like rights. Most modern properties are already capitalized.', 'ILA land purchases', 'Verify capitalization status before purchase', 'legal'),
('עמלת פירעון מוקדם', 'Amlat Peraon Mukdam', 'Prepayment Penalty', 'Fee for early mortgage repayment', 'Varies by track: Prime has none, fixed tracks have significant penalties. Consider this when choosing mortgage mix.', 'Mortgage selection', 'If you might sell early, avoid heavy fixed-rate allocation', 'mortgage'),
('יחס החזר מהכנסה', 'Yachas Hachzar MeHachnasa', 'Payment-to-Income Ratio (PTI)', 'Monthly payment as percentage of income', 'Bank of Israel caps at 40% of net income. Key affordability measure. Banks may require lower for safety.', 'Mortgage approval', 'Calculate honestly - stretching to 40% leaves no financial cushion', 'mortgage'),
('שיעור מימון', 'Shiur Mimun', 'Loan-to-Value (LTV)', 'Mortgage as percentage of property value', 'Regulated by BoI: 75% max for first property, 70% for upgraders, 50% for investors. Based on appraisal, not purchase price.', 'Mortgage limits', 'If appraisal is lower than price, you need more equity', 'mortgage'),
('בנק ישראל', 'Bank Yisrael', 'Bank of Israel', 'Central bank regulating mortgages', 'Sets interest rates, mortgage regulations, consumer protections. Key rules: LTV limits, PTI caps, track diversification requirements.', 'Understanding regulations', 'BoI rules protect you - understand and use them', 'mortgage');

-- ============================================
-- SEED DATA: Renovation Costs
-- ============================================
INSERT INTO public.renovation_costs (item_name, hebrew_name, cost_range_min, cost_range_max, unit, notes, category, quality_level) VALUES
-- Kitchen
('Kitchen Renovation - Basic', 'שיפוץ מטבח בסיסי', 35000, 55000, 'per_kitchen', 'Basic cabinets, standard countertops, replacing appliances', 'kitchen', 'basic'),
('Kitchen Renovation - Standard', 'שיפוץ מטבח סטנדרטי', 55000, 85000, 'per_kitchen', 'Quality cabinets, stone countertops, better appliances', 'kitchen', 'standard'),
('Kitchen Renovation - Premium', 'שיפוץ מטבח פרימיום', 85000, 150000, 'per_kitchen', 'Custom cabinets, premium stone, high-end appliances', 'kitchen', 'premium'),

-- Bathroom
('Bathroom Renovation - Basic', 'שיפוץ חדר אמבטיה בסיסי', 20000, 35000, 'per_bathroom', 'Basic fixtures, standard tiles, functional design', 'bathroom', 'basic'),
('Bathroom Renovation - Standard', 'שיפוץ חדר אמבטיה סטנדרטי', 35000, 55000, 'per_bathroom', 'Quality fixtures, better tiles, modern design', 'bathroom', 'standard'),
('Bathroom Renovation - Premium', 'שיפוץ חדר אמבטיה פרימיום', 55000, 90000, 'per_bathroom', 'Designer fixtures, luxury tiles, custom features', 'bathroom', 'premium'),

-- Flooring
('Flooring - Basic Tiles', 'ריצוף בסיסי', 150, 250, 'per_sqm', 'Basic ceramic tiles, standard installation', 'flooring', 'basic'),
('Flooring - Quality Tiles/Laminate', 'ריצוף איכותי', 250, 400, 'per_sqm', 'Porcelain tiles or quality laminate', 'flooring', 'standard'),
('Flooring - Premium', 'ריצוף פרימיום', 400, 700, 'per_sqm', 'Natural stone, hardwood, or designer tiles', 'flooring', 'premium'),

-- Painting
('Painting - Basic', 'צביעה בסיסית', 25, 40, 'per_sqm', 'Standard paint, basic prep work', 'painting', 'basic'),
('Painting - Standard', 'צביעה סטנדרטית', 40, 60, 'per_sqm', 'Quality paint, proper prep, some repairs', 'painting', 'standard'),
('Painting - Premium', 'צביעה פרימיום', 60, 100, 'per_sqm', 'Premium paint, full prep, wall repairs, special finishes', 'painting', 'premium'),

-- Electrical
('Electrical Update - Basic', 'שדרוג חשמל בסיסי', 8000, 15000, 'flat', 'Adding outlets, updating switches, basic panel check', 'electrical', 'basic'),
('Electrical Update - Standard', 'שדרוג חשמל סטנדרטי', 15000, 30000, 'flat', 'New panel, rewiring key areas, safety updates', 'electrical', 'standard'),
('Electrical Update - Full Rewire', 'חידוש חשמל מלא', 30000, 60000, 'flat', 'Complete rewiring, new panel, modern standards', 'electrical', 'premium'),

-- Plumbing
('Plumbing Update - Basic', 'שדרוג אינסטלציה בסיסי', 5000, 12000, 'flat', 'Fixing leaks, replacing fixtures, basic updates', 'plumbing', 'basic'),
('Plumbing Update - Standard', 'שדרוג אינסטלציה סטנדרטי', 12000, 25000, 'flat', 'Replacing old pipes, new fixtures, water heater', 'plumbing', 'standard'),
('Plumbing Update - Full Replacement', 'חידוש אינסטלציה מלא', 25000, 50000, 'flat', 'Complete replumb, modern materials, restructuring', 'plumbing', 'premium'),

-- Windows
('Windows - Basic Aluminum', 'חלונות אלומיניום בסיסי', 1500, 2500, 'per_unit', 'Standard aluminum windows', 'windows', 'basic'),
('Windows - Thermal Break', 'חלונות תרמי', 2500, 4000, 'per_unit', 'Energy efficient thermal break windows', 'windows', 'standard'),
('Windows - Premium', 'חלונות פרימיום', 4000, 7000, 'per_unit', 'High-end windows with enhanced features', 'windows', 'premium'),

-- General
('Full Renovation - Basic', 'שיפוץ כללי בסיסי', 2000, 3500, 'per_sqm', 'Cosmetic updates, basic finishes', 'general', 'basic'),
('Full Renovation - Standard', 'שיפוץ כללי סטנדרטי', 3500, 5500, 'per_sqm', 'Quality renovation with good finishes', 'general', 'standard'),
('Full Renovation - Premium', 'שיפוץ כללי פרימיום', 5500, 9000, 'per_sqm', 'High-end renovation with premium materials', 'general', 'premium'),

-- A/C
('Air Conditioning - Mini Split', 'מזגן מיני ספליט', 4000, 7000, 'per_unit', 'Single room unit installed', 'general', 'basic'),
('Air Conditioning - Multi Split', 'מזגן מולטי', 15000, 30000, 'flat', 'Central system for 3-4 rooms', 'general', 'standard'),
('Air Conditioning - VRF System', 'מערכת VRF', 40000, 80000, 'flat', 'Premium central system for large apartments', 'general', 'premium');

-- ============================================
-- SEED DATA: Historical Prices (Major Cities)
-- ============================================
INSERT INTO public.historical_prices (city, year, average_price, average_price_sqm, yoy_change_percent) VALUES
-- Tel Aviv
('Tel Aviv', 2015, 2850000, 42000, 8.5),
('Tel Aviv', 2016, 3100000, 45000, 8.8),
('Tel Aviv', 2017, 3350000, 48500, 8.1),
('Tel Aviv', 2018, 3500000, 50500, 4.5),
('Tel Aviv', 2019, 3600000, 52000, 2.9),
('Tel Aviv', 2020, 3750000, 54000, 4.2),
('Tel Aviv', 2021, 4200000, 60000, 12.0),
('Tel Aviv', 2022, 4800000, 68000, 14.3),
('Tel Aviv', 2023, 4950000, 70000, 3.1),
('Tel Aviv', 2024, 5100000, 72000, 3.0),

-- Jerusalem
('Jerusalem', 2015, 1850000, 28000, 5.5),
('Jerusalem', 2016, 1950000, 29500, 5.4),
('Jerusalem', 2017, 2050000, 31000, 5.1),
('Jerusalem', 2018, 2150000, 32500, 4.9),
('Jerusalem', 2019, 2250000, 34000, 4.7),
('Jerusalem', 2020, 2400000, 36000, 6.7),
('Jerusalem', 2021, 2700000, 40000, 12.5),
('Jerusalem', 2022, 3100000, 45000, 14.8),
('Jerusalem', 2023, 3300000, 47500, 6.5),
('Jerusalem', 2024, 3450000, 49000, 4.5),

-- Haifa
('Haifa', 2015, 1150000, 18500, 4.2),
('Haifa', 2016, 1200000, 19500, 4.3),
('Haifa', 2017, 1280000, 20500, 6.7),
('Haifa', 2018, 1350000, 21500, 5.5),
('Haifa', 2019, 1400000, 22500, 3.7),
('Haifa', 2020, 1480000, 24000, 5.7),
('Haifa', 2021, 1650000, 27000, 11.5),
('Haifa', 2022, 1850000, 30000, 12.1),
('Haifa', 2023, 1950000, 31500, 5.4),
('Haifa', 2024, 2050000, 33000, 5.1),

-- Herzliya
('Herzliya', 2015, 2650000, 38000, 7.5),
('Herzliya', 2016, 2900000, 41000, 9.4),
('Herzliya', 2017, 3100000, 44000, 6.9),
('Herzliya', 2018, 3250000, 46000, 4.8),
('Herzliya', 2019, 3400000, 48000, 4.6),
('Herzliya', 2020, 3600000, 51000, 5.9),
('Herzliya', 2021, 4100000, 58000, 13.9),
('Herzliya', 2022, 4700000, 66000, 14.6),
('Herzliya', 2023, 4900000, 68500, 4.3),
('Herzliya', 2024, 5050000, 70500, 3.1),

-- Ra''anana
('Raanana', 2015, 2400000, 35000, 6.8),
('Raanana', 2016, 2600000, 38000, 8.3),
('Raanana', 2017, 2800000, 41000, 7.7),
('Raanana', 2018, 2950000, 43000, 5.4),
('Raanana', 2019, 3100000, 45000, 5.1),
('Raanana', 2020, 3300000, 48000, 6.5),
('Raanana', 2021, 3750000, 54000, 13.6),
('Raanana', 2022, 4300000, 62000, 14.7),
('Raanana', 2023, 4500000, 64000, 4.7),
('Raanana', 2024, 4650000, 66000, 3.3),

-- Netanya
('Netanya', 2015, 1350000, 21000, 6.5),
('Netanya', 2016, 1450000, 22500, 7.4),
('Netanya', 2017, 1550000, 24000, 6.9),
('Netanya', 2018, 1650000, 25500, 6.5),
('Netanya', 2019, 1750000, 27000, 6.1),
('Netanya', 2020, 1900000, 29000, 8.6),
('Netanya', 2021, 2200000, 33000, 15.8),
('Netanya', 2022, 2550000, 38000, 15.9),
('Netanya', 2023, 2700000, 40000, 5.9),
('Netanya', 2024, 2800000, 41500, 3.7),

-- Beer Sheva
('Beer Sheva', 2015, 750000, 13500, 5.5),
('Beer Sheva', 2016, 800000, 14500, 6.7),
('Beer Sheva', 2017, 850000, 15500, 6.3),
('Beer Sheva', 2018, 900000, 16500, 5.9),
('Beer Sheva', 2019, 950000, 17500, 5.6),
('Beer Sheva', 2020, 1050000, 19000, 10.5),
('Beer Sheva', 2021, 1250000, 22000, 19.0),
('Beer Sheva', 2022, 1500000, 26000, 20.0),
('Beer Sheva', 2023, 1600000, 28000, 6.7),
('Beer Sheva', 2024, 1680000, 29500, 5.0),

-- Petah Tikva
('Petah Tikva', 2015, 1450000, 22000, 5.8),
('Petah Tikva', 2016, 1550000, 23500, 6.9),
('Petah Tikva', 2017, 1650000, 25000, 6.5),
('Petah Tikva', 2018, 1750000, 26500, 6.1),
('Petah Tikva', 2019, 1850000, 28000, 5.7),
('Petah Tikva', 2020, 2000000, 30000, 8.1),
('Petah Tikva', 2021, 2300000, 34000, 15.0),
('Petah Tikva', 2022, 2650000, 39000, 15.2),
('Petah Tikva', 2023, 2800000, 41000, 5.7),
('Petah Tikva', 2024, 2900000, 42500, 3.6),

-- Ashdod
('Ashdod', 2015, 1100000, 17500, 6.2),
('Ashdod', 2016, 1180000, 18800, 7.3),
('Ashdod', 2017, 1260000, 20000, 6.8),
('Ashdod', 2018, 1340000, 21200, 6.3),
('Ashdod', 2019, 1420000, 22500, 6.0),
('Ashdod', 2020, 1550000, 24500, 9.2),
('Ashdod', 2021, 1800000, 28000, 16.1),
('Ashdod', 2022, 2100000, 32500, 16.7),
('Ashdod', 2023, 2250000, 34500, 7.1),
('Ashdod', 2024, 2350000, 36000, 4.4),

-- Modiin
('Modiin', 2015, 1750000, 26000, 6.5),
('Modiin', 2016, 1880000, 28000, 7.4),
('Modiin', 2017, 2000000, 30000, 6.4),
('Modiin', 2018, 2120000, 32000, 6.0),
('Modiin', 2019, 2250000, 34000, 6.1),
('Modiin', 2020, 2450000, 37000, 8.9),
('Modiin', 2021, 2850000, 42000, 16.3),
('Modiin', 2022, 3300000, 48000, 15.8),
('Modiin', 2023, 3500000, 51000, 6.1),
('Modiin', 2024, 3650000, 53000, 4.3);