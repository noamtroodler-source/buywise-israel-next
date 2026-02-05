-- Insert new expert-level property questions for different listing types and buyer profiles
-- These questions cover Israeli-specific concepts: Tofes 4/5, Mifrat Techni, Madad linkage, etc.

INSERT INTO public.property_questions (question_text, why_it_matters, category, priority, applies_to, buyer_relevance, is_active) VALUES

-- NEW CONSTRUCTION QUESTIONS
('Has the developer obtained the Tofes 4 occupancy permit yet?', 
 'You cannot legally move in until both Tofes 4 and Tofes 5 certificates are issued by the municipality.', 
 'construction', 10, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('What is included in the mifrat techni (technical specification)?', 
 'The specification defines finishes and materials — anything not listed costs extra. Compare carefully before signing.', 
 'construction', 9, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('Is the price linked to the Construction Cost Index (Madad)?', 
 'Your final price may be 5-15% higher than quoted if the index rises during the 2-3 year construction period.', 
 'pricing', 10, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('What warranty periods apply (Tekufat Bedek and Tekufat Achrayut)?', 
 '1-7 year defect inspection period (2 years plumbing, 5 years cracks, 7 years cladding), plus 3-year structural warranty. Report defects promptly.', 
 'construction', 8, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('What compensation applies if delivery is delayed beyond 30-60 days?', 
 'The 2022 Sale Law provides 100-150% of market rent for delays. Verify your contract includes this protection.', 
 'legal', 9, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('What is the developer''s track record with previous projects?', 
 'Check completion times and quality on prior developments. Ask for references from previous buyers.', 
 'construction', 7, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('Will I need to grant the developer irrevocable power of attorney?', 
 'Standard practice in Israel, but understand what you are authorizing before signing.', 
 'legal', 6, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('Has the building permit (Heiter Bniya) been issued yet?', 
 'Pre-sale projects without permits carry higher uncertainty — construction may be delayed or terms may change.', 
 'legal', 8, '{"is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

-- RESALE QUESTIONS
('Is this property registered in Tabu or through a housing company?', 
 'Tabu registration is the strongest ownership proof. Housing company registration may have limitations.', 
 'legal', 9, '{"is_resale": true}'::jsonb, '{"all": true}'::jsonb, true),

('Has the lawyer verified there are no liens or mortgages attached?', 
 'Outstanding debts can transfer to you or delay closing. Essential due diligence before deposit.', 
 'legal', 10, '{"is_resale": true}'::jsonb, '{"all": true}'::jsonb, true),

('Is there an active Pinui Binui (evacuation-reconstruction) plan for this building?', 
 'Major multi-year construction ahead — you may need to relocate during the process.', 
 'building', 8, '{"is_resale": true}'::jsonb, '{"all": true}'::jsonb, true),

('What is the betterment levy (hetel hashbacha) status?', 
 'Unpaid levies from zoning changes become the buyer''s responsibility at closing.', 
 'pricing', 7, '{"is_resale": true, "is_new_construction": true}'::jsonb, '{"all": true}'::jsonb, true),

('Has a certified engineer inspected the property?', 
 'Israeli properties are sold ''as is'' — your own inspection reveals hidden defects before you commit.', 
 'building', 8, '{"is_resale": true}'::jsonb, '{"all": true}'::jsonb, true),

-- RENTAL QUESTIONS
('Can I see the landlord''s proof of ownership or authorization to rent?', 
 'Verify the landlord has legal right to rent the property before signing any lease.', 
 'rental', 9, '{"listing_status": "for_rent"}'::jsonb, '{"all": true}'::jsonb, true),

('What is the security deposit structure and return timeline?', 
 'Cannot exceed 3 months'' rent by law. Landlord may hold deposit up to 60 days after lease ends.', 
 'rental', 8, '{"listing_status": "for_rent"}'::jsonb, '{"all": true}'::jsonb, true),

('Are there any restrictions on modifications, pets, or subletting?', 
 'Get it in writing before signing — verbal agreements are hard to enforce in disputes.', 
 'rental', 7, '{"listing_status": "for_rent"}'::jsonb, '{"all": true}'::jsonb, true),

('What notice period is required for early termination by either party?', 
 'Typically 60 days for tenant, 90 days for landlord — if an early termination clause exists at all.', 
 'rental', 7, '{"listing_status": "for_rent"}'::jsonb, '{"all": true}'::jsonb, true),

('Is the rent indexed to the Consumer Price Index (Madad)?', 
 'Many Israeli leases include annual rent increases tied to inflation — budget for 2-5% increases yearly.', 
 'rental', 8, '{"listing_status": "for_rent"}'::jsonb, '{"all": true}'::jsonb, true),

-- BUYER-TYPE SPECIFIC QUESTIONS
('Am I eligible for any double tax treaty benefits?', 
 'Israel has treaties with 50+ countries to avoid double taxation — you may offset Israeli taxes on home-country returns.', 
 'pricing', 7, '{"is_resale": true, "is_new_construction": true}'::jsonb, '{"foreign_buyer": true, "investor": true}'::jsonb, true),

('Am I still within the 7-year window for oleh purchase tax benefits?', 
 'Reduced rates (0.5% up to ₪6M) only valid for 7 years after aliyah date — verify your eligibility.', 
 'pricing', 9, '{"is_resale": true, "is_new_construction": true}'::jsonb, '{"oleh": true}'::jsonb, true),

('Do I need an Israeli Tax ID (Teudat Zehut) and local bank account?', 
 'Required for all property transactions and tax filings. Foreigners can open accounts but face additional scrutiny.', 
 'legal', 8, '{"is_resale": true, "is_new_construction": true}'::jsonb, '{"foreign_buyer": true}'::jsonb, true),

('Can the purchase be completed remotely with Power of Attorney?', 
 'Remote buying through POA is common for international buyers — your lawyer can represent you at signing.', 
 'legal', 6, '{"is_resale": true, "is_new_construction": true}'::jsonb, '{"foreign_buyer": true}'::jsonb, true),

('What LTV can I expect as a foreign buyer?', 
 'Banks typically offer 50% LTV to non-residents, up to 70% for strong profiles. Israeli residents can access up to 75%.', 
 'pricing', 7, '{"is_resale": true, "is_new_construction": true}'::jsonb, '{"foreign_buyer": true}'::jsonb, true);