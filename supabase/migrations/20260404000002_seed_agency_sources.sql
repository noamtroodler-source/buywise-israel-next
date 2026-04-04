-- ============================================================
-- BuyWiseIsrael: Seed Agency Sources
-- Populates agency_sources for all 50+ target agencies.
-- 
-- Priority levels:
--   1 = Yad2 profile (most reliable, structured data)
--   2 = Agency website (more detail but variable quality)
--   3 = Madlan (supplementary)
--
-- IMPORTANT: agency_id values below use a subquery to look up
-- agencies by name. If an agency doesn't exist yet in the
-- agencies table, that row will be skipped (no error).
-- Run this AFTER agencies have been onboarded.
-- ============================================================

-- Helper function: insert agency_source only if agency exists
CREATE OR REPLACE FUNCTION insert_agency_source_if_exists(
  p_agency_name TEXT,
  p_source_type TEXT,
  p_source_url TEXT,
  p_priority INTEGER
) RETURNS VOID AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  SELECT id INTO v_agency_id FROM public.agencies WHERE name ILIKE p_agency_name LIMIT 1;
  IF v_agency_id IS NOT NULL THEN
    INSERT INTO public.agency_sources (agency_id, source_type, source_url, priority)
    VALUES (v_agency_id, p_source_type, p_source_url, p_priority)
    ON CONFLICT (agency_id, source_type, source_url) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── JERUSALEM ────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo Saxon Jerusalem', 'yad2',
  'https://www.yad2.co.il/realestate/agencies?topArea=100&area=7&city=3000',
  1
);
SELECT insert_agency_source_if_exists(
  'Century 21 Jerusalem', 'website',
  'https://www.century21jerusalem.com',
  2
);
SELECT insert_agency_source_if_exists(
  'Prosperity Real Estate', 'website',
  'https://prosperity-realestate.com',
  2
);
SELECT insert_agency_source_if_exists(
  'RE/MAX Jerusalem', 'website',
  'https://remaxjerusalem.com',
  2
);

-- ── BEIT SHEMESH ─────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo Estates', 'website',
  'https://angloestates.com',
  2
);
SELECT insert_agency_source_if_exists(
  'HaGefen Realty', 'website',
  'https://hagefen.com',
  2
);
SELECT insert_agency_source_if_exists(
  'Josh Epstein Realty', 'website',
  'https://beitshemeshrealestate.com',
  2
);
SELECT insert_agency_source_if_exists(
  'Lemkin Realty', 'website',
  'https://aliyahrealty.com',
  2
);
SELECT insert_agency_source_if_exists(
  'Yigal Realty', 'website',
  'https://www.yigal-realty.com',
  2
);

-- ── EFRAT / GUSH ETZION ──────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Efrat-Gush Etzion', 'yad2',
  'https://www.yad2.co.il/realestate/agency/efrat',
  1
);
SELECT insert_agency_source_if_exists(
  'Efrat Real Estate', 'yad2',
  'https://www.yad2.co.il/realestate/agency/8832122/forsale',
  1
);
SELECT insert_agency_source_if_exists(
  'Efrat Real Estate', 'website',
  'https://efratrealty.co.il/en/home-2/',
  2
);
SELECT insert_agency_source_if_exists(
  'Gabai Real Estate', 'yad2',
  'https://www.yad2.co.il/realestate/agency/gabai',
  1
);
SELECT insert_agency_source_if_exists(
  'Gabai Real Estate', 'website',
  'https://gabairealestate.com/property_location/efrat/',
  2
);
SELECT insert_agency_source_if_exists(
  'Noam Homes', 'yad2',
  'https://www.yad2.co.il/realestate/agency/noamhomes',
  1
);
SELECT insert_agency_source_if_exists(
  'Noam Homes', 'website',
  'https://www.noamhomes.com/efrat-and-gush',
  2
);
SELECT insert_agency_source_if_exists(
  'Angel Realty', 'yad2',
  'https://www.yad2.co.il/realestate/agency/angel',
  1
);
SELECT insert_agency_source_if_exists(
  'Angel Realty', 'website',
  'https://angelrealty.co.il/index.php?language=English',
  2
);

-- ── MODIIN ───────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Modiin', 'yad2',
  'https://www.yad2.co.il/realestate/agency/anglosaxonmodiin',
  1
);
SELECT insert_agency_source_if_exists(
  'French Connection', 'yad2',
  'https://www.yad2.co.il/realestate/agency/frenchconnection',
  1
);
SELECT insert_agency_source_if_exists(
  'French Connection', 'website',
  'https://french-connection.co.il/en/home/',
  2
);
SELECT insert_agency_source_if_exists(
  'HaBayit Shelanu', 'yad2',
  'https://www.yad2.co.il/realestate/agency/modiinre',
  1
);
SELECT insert_agency_source_if_exists(
  'HaBayit Shelanu', 'website',
  'https://modiinrealestate.com/',
  2
);

-- ── NETANYA ──────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo Saxon Netanya', 'yad2',
  'https://www.yad2.co.il/realestate/agency/anglosaxonnetanya',
  1
);
SELECT insert_agency_source_if_exists(
  'Diamond Realty Israel', 'yad2',
  'https://www.yad2.co.il/realestate/agency/diamondrealty',
  1
);
SELECT insert_agency_source_if_exists(
  'Diamond Realty Israel', 'website',
  'https://www.diamondrealtyisrael.com/en/',
  2
);
SELECT insert_agency_source_if_exists(
  'Home in Israel', 'yad2',
  'https://www.yad2.co.il/realestate/agency/homeinisrael',
  1
);
SELECT insert_agency_source_if_exists(
  'Home in Israel', 'website',
  'https://homeinisrael.com/en/',
  2
);

-- ── RAANANA ──────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Ra''anana', 'yad2',
  'https://www.yad2.co.il/realestate/agency/anglosaxonraanana',
  1
);
SELECT insert_agency_source_if_exists(
  'Call Dena', 'website',
  'https://calldenahomes.com',
  2
);
SELECT insert_agency_source_if_exists(
  'Keller Williams Ra''anana', 'yad2',
  'https://www.yad2.co.il/realestate/agency/3845617',
  1
);
SELECT insert_agency_source_if_exists(
  'RE/MAX ONE Ra''anana', 'yad2',
  'https://www.yad2.co.il/realestate/agency/remaxone',
  1
);

-- ── TEL AVIV ─────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Tel Aviv', 'yad2',
  'https://www.yad2.co.il/realestate/agency/astlv',
  1
);
SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Tel Aviv', 'website',
  'https://www.astlv.co.il',
  2
);
SELECT insert_agency_source_if_exists(
  'Israel Sotheby''s International Realty', 'website',
  'https://www.israelsir.com',
  2
);
SELECT insert_agency_source_if_exists(
  'ProperTLV', 'yad2',
  'https://www.yad2.co.il/realestate/agency/9131060',
  1
);
SELECT insert_agency_source_if_exists(
  'ProperTLV', 'website',
  'https://propertlv.com',
  2
);

-- ── HERZLIYA ─────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Herzliya Pituach', 'yad2',
  'https://www.yad2.co.il/realestate/agency/anglosaxonhp',
  1
);
SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Herzliya Pituach', 'website',
  'https://real-estate-herzliya-pituach.com',
  2
);
SELECT insert_agency_source_if_exists(
  'Uri Tal Real Estate', 'website',
  'https://www.herzliya-pituach.com',
  2
);
SELECT insert_agency_source_if_exists(
  'Iltam Real Estate', 'website',
  'https://iltam.co.il',
  2
);
SELECT insert_agency_source_if_exists(
  'Square34', 'website',
  'https://square34.com',
  2
);

-- ── HAIFA ────────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Haifa', 'yad2',
  'https://www.yad2.co.il/realestate/agency/2495555/forsale',
  1
);
SELECT insert_agency_source_if_exists(
  'RE/MAX Selected Haifa', 'yad2',
  'https://www.yad2.co.il/realestate/agency/remaxhaifa',
  1
);
SELECT insert_agency_source_if_exists(
  'RE/MAX Selected Haifa', 'website',
  'https://remaxhaifa.co.il',
  2
);

-- ── GIVAT SHMUEL ─────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Keter Advisors', 'website',
  'https://keteradvisors.com/city/givat-shmuel/',
  2
);
SELECT insert_agency_source_if_exists(
  'Semerenko Group', 'website',
  'https://semerenkogroup.com',
  2
);

-- ── MA'ALE ADUMIM ────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'RE/MAX Atid', 'website',
  'https://global.remax.com/en/offices/israel/maaleh-adumim/',
  2
);

-- ── KFAR SABA ────────────────────────────────────────────────────────────────

SELECT insert_agency_source_if_exists(
  'Anglo-Saxon Kfar Saba', 'yad2',
  'https://www.yad2.co.il/realestate/agency/anglosaxonkfarsaba',
  1
);

-- Clean up helper function
DROP FUNCTION IF EXISTS insert_agency_source_if_exists(TEXT, TEXT, TEXT, INTEGER);
