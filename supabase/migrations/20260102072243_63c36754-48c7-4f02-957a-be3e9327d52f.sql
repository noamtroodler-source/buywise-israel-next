-- Add rental document checklist items
INSERT INTO public.document_checklist_items (document_name_english, document_name_hebrew, transliteration, stage, required_for, is_critical, where_to_get, typical_timeline, notes, sort_order)
VALUES
-- Pre-Search stage for rentals
('Identity Document', 'תעודת זהות', 'Teudat Zehut', 'rental_search', ARRAY['israeli'], true, 'Ministry of Interior', 'Already have', 'Israeli ID card', 1),
('Passport', 'דרכון', 'Darkon', 'rental_search', ARRAY['oleh', 'foreign'], true, 'Home country / Israeli office', 'Already have', 'Valid passport required', 2),
('Proof of Income', 'אישור הכנסה', 'Ishur Hachnasa', 'rental_search', ARRAY['all'], true, 'Employer or accountant', '1-3 days', 'Last 3 payslips or accountant letter', 3),
('Bank Statements', 'דפי חשבון בנק', 'Dapei Cheshbon Bank', 'rental_search', ARRAY['all'], false, 'Your bank', 'Same day', 'Last 3 months, shows steady income', 4),
('Employment Letter', 'אישור עבודה', 'Ishur Avoda', 'rental_search', ARRAY['all'], false, 'Employer HR', '1-3 days', 'Confirms position and salary', 5),
('Reference Letter', 'מכתב המלצה', 'Michtav Hamlatza', 'rental_search', ARRAY['all'], false, 'Previous landlord', '1-5 days', 'From previous landlord in Israel', 6),

-- Guarantor stage for rentals
('Guarantor ID', 'תעודת זהות ערב', 'Teudat Zehut Arev', 'rental_guarantor', ARRAY['all'], true, 'Guarantor provides', 'Same day', 'Israeli citizen with steady income required', 10),
('Guarantor Proof of Income', 'אישור הכנסה ערב', 'Ishur Hachnasa Arev', 'rental_guarantor', ARRAY['all'], true, 'Guarantor employer', '1-3 days', 'Must show sufficient income to cover rent', 11),
('Guarantor Employment Letter', 'אישור עבודה ערב', 'Ishur Avoda Arev', 'rental_guarantor', ARRAY['all'], false, 'Guarantor employer', '1-3 days', 'Confirms guarantor employment status', 12),
('Bank Guarantee', 'ערבות בנקאית', 'Arvut Bankeit', 'rental_guarantor', ARRAY['foreign'], false, 'Israeli bank', '1-2 weeks', 'Alternative to personal guarantor for foreigners', 13),

-- Contract stage for rentals
('Lease Agreement', 'חוזה שכירות', 'Choze Sechirut', 'rental_contract', ARRAY['all'], true, 'Landlord/Agent provides', 'Same day', 'Review carefully before signing', 20),
('Property Condition Report', 'פרוטוקול מסירה', 'Protokol Mesira', 'rental_contract', ARRAY['all'], true, 'Create with landlord', 'At handover', 'Document all existing damage with photos', 21),
('Post-Dated Checks', 'צקים דחויים', 'Chekim Dechuyim', 'rental_contract', ARRAY['all'], true, 'Your bank', '1-5 days', 'Standard in Israel: 12 checks for full year', 22),
('Security Deposit', 'פיקדון', 'Pikadon', 'rental_contract', ARRAY['all'], true, 'Your funds', 'Same day', 'Typically 1-2 months rent', 23),
('First Month Rent', 'שכירות חודש ראשון', 'Sechirut Chodesh Rishon', 'rental_contract', ARRAY['all'], true, 'Your funds', 'Same day', 'Due at contract signing', 24),

-- Move-in stage for rentals
('Utility Registration', 'רישום חשמל ומים', 'Rishum Chashmal VeMayim', 'rental_movein', ARRAY['all'], true, 'Electric/Water company', '1-3 days', 'Transfer to your name', 30),
('Arnona Registration', 'רישום ארנונה', 'Rishum Arnona', 'rental_movein', ARRAY['all'], true, 'Municipality', '1 week', 'Property tax - tenant usually pays', 31),
('Internet/Cable Setup', 'אינטרנט וטלוויזיה', 'Internet VeTelevisia', 'rental_movein', ARRAY['all'], false, 'Provider of choice', '1-2 weeks', 'Schedule installation early', 32),
('Contents Insurance', 'ביטוח תכולה', 'Bituach Techula', 'rental_movein', ARRAY['all'], false, 'Insurance company', '1-2 days', 'Recommended for your belongings', 33),
('Vaad Bayit Contact', 'פרטי ועד בית', 'Pratei Vaad Bayit', 'rental_movein', ARRAY['all'], false, 'Landlord provides', 'Same day', 'Building committee for maintenance fees', 34);