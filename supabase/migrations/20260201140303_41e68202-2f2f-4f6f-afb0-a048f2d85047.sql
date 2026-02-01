-- Add buyer_relevance column to property_questions table
ALTER TABLE public.property_questions 
ADD COLUMN IF NOT EXISTS buyer_relevance JSONB DEFAULT NULL;

COMMENT ON COLUMN public.property_questions.buyer_relevance IS 
'Buyer type targeting: buyer_types (array), residency_status (array), purchase_purpose (array), is_universal (bool)';

-- Update existing questions to be universal (they apply to everyone)
UPDATE public.property_questions
SET buyer_relevance = jsonb_build_object('is_universal', true)
WHERE buyer_relevance IS NULL;

-- Insert buyer-specific questions for FIRST-TIME BUYERS
INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, is_active, applies_to, buyer_relevance)
VALUES 
  ('What purchase tax (mas rechisha) will I owe on this property?', 'First-time buyers get significant tax exemptions — knowing the threshold matters', 'pricing', 92, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["first_time", "upgrader"], "is_universal": false}'),
  ('Is the building''s reserve fund sufficient for upcoming maintenance?', 'New buyers often underestimate building maintenance costs', 'building', 75, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["first_time"], "is_universal": false}');

-- Insert questions for OLEH HADASH
INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, is_active, applies_to, buyer_relevance)
VALUES 
  ('Am I eligible for the reduced oleh tax rate, and what documentation is needed?', 'Olim get 0.5% tax rate up to ₪6M for 7 years after aliyah', 'pricing', 94, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["oleh"], "residency_status": ["oleh_hadash"], "is_universal": false}'),
  ('Can I complete the purchase with an Israeli lawyer who speaks English?', 'Language barriers can complicate legal processes — English-speaking lawyers help', 'legal', 80, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["oleh", "foreign"], "residency_status": ["oleh_hadash", "non_resident"], "is_universal": false}');

-- Insert questions for INVESTORS
INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, is_active, applies_to, buyer_relevance)
VALUES 
  ('What''s the expected rental yield for this property?', 'Investment properties should be evaluated by rental income potential', 'pricing', 93, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["investor"], "purchase_purpose": ["investment"], "is_universal": false}'),
  ('Are there any rental restrictions or HOA rules about short-term rentals?', 'Some buildings prohibit Airbnb or short-term leasing', 'legal', 85, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["investor"], "purchase_purpose": ["investment"], "is_universal": false}'),
  ('What are the capital gains tax implications if I sell within 4 years?', 'Selling within the "cooling period" has different tax treatment', 'legal', 84, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["investor", "upgrader"], "is_universal": false}');

-- Insert questions for FOREIGN BUYERS
INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, is_active, applies_to, buyer_relevance)
VALUES 
  ('Can I complete the purchase remotely, or do I need to be in Israel?', 'Some transactions require physical presence for signing', 'legal', 86, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["foreign"], "residency_status": ["non_resident"], "is_universal": false}'),
  ('Will I need to open an Israeli bank account?', 'Mortgage and payment processing often require local banking', 'legal', 83, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["foreign"], "residency_status": ["non_resident"], "is_universal": false}'),
  ('Can I rent this property out while living abroad?', 'Non-resident landlords face specific tax and management considerations', 'legal', 82, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["investor", "foreign"], "residency_status": ["non_resident"], "is_universal": false}');

-- Insert questions for UPGRADERS
INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, is_active, applies_to, buyer_relevance)
VALUES 
  ('Will purchasing this property affect my first-apartment tax exemption?', 'Timing the sale of your current property matters for tax exemptions', 'pricing', 91, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["upgrader"], "is_universal": false}'),
  ('What''s the timeline if I need to sell my current property first?', 'Coordinating two transactions requires careful planning', 'legal', 79, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["upgrader"], "is_universal": false}');

-- Insert questions for RENTERS
INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, is_active, applies_to, buyer_relevance)
VALUES 
  ('How is the rent indexed? (Madad / CPI linkage)', 'Indexed rent can increase significantly over time — know the formula', 'rental', 93, true, '{"listing_status": ["for_rent"]}', '{"buyer_types": ["renter"], "is_universal": false}'),
  ('Is the landlord open to a longer lease term for stability?', 'Longer leases provide housing security but less flexibility', 'rental', 88, true, '{"listing_status": ["for_rent"]}', '{"buyer_types": ["renter"], "is_universal": false}'),
  ('What happens to my deposit if the landlord sells the property?', 'Ownership changes can affect your deposit security', 'rental', 85, true, '{"listing_status": ["for_rent"]}', '{"buyer_types": ["renter"], "is_universal": false}'),
  ('Can I make minor modifications to the apartment (painting, shelving)?', 'Understanding modification rules avoids deposit disputes', 'rental', 78, true, '{"listing_status": ["for_rent"]}', '{"buyer_types": ["renter"], "is_universal": false}'),
  ('What''s the landlord''s policy on lease renewal and rent increases?', 'Knowing renewal terms helps you plan your stay', 'rental', 87, true, '{"listing_status": ["for_rent"]}', '{"buyer_types": ["renter"], "is_universal": false}'),
  ('What happens if I need to break the lease early?', 'Early termination clauses vary — some charge penalties, others allow subletting', 'rental', 84, true, '{"listing_status": ["for_rent"]}', '{"buyer_types": ["renter"], "is_universal": false}');

-- Insert questions for PROJECTS (new construction)
INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, is_active, applies_to, buyer_relevance)
VALUES 
  ('What''s the payment schedule and can I negotiate terms?', 'New construction payments are typically staged — knowing the schedule helps with planning', 'construction', 94, true, '{"listing_status": ["for_sale"]}', '{"buyer_types": ["first_time", "oleh"], "is_universal": false}'),
  ('Is the bank guarantee returned if the project is delayed significantly?', 'Buyer protections vary by developer — understand your guarantees', 'construction', 92, true, '{"listing_status": ["for_sale"]}', '{"is_universal": true}');