DROP FUNCTION IF EXISTS get_city_price_tiers(text, integer, integer);

CREATE FUNCTION get_city_price_tiers(
  p_city TEXT,
  p_rooms INTEGER DEFAULT NULL,
  p_months_back INTEGER DEFAULT 24
)
RETURNS TABLE(
  p33_price_sqm NUMERIC,
  p67_price_sqm NUMERIC,
  transaction_count INTEGER,
  tier_avg_standard NUMERIC,
  tier_avg_premium NUMERIC,
  tier_avg_luxury NUMERIC,
  tier_avg_price_standard NUMERIC,
  tier_avg_price_premium NUMERIC,
  tier_avg_price_luxury NUMERIC
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  v_p33 NUMERIC;
  v_p67 NUMERIC;
  v_count INTEGER;
  v_cutoff DATE;
  v_min_rooms INTEGER;
  v_max_rooms INTEGER;
BEGIN
  v_cutoff := CURRENT_DATE - (p_months_back || ' months')::INTERVAL;
  
  IF p_rooms IS NOT NULL THEN
    v_min_rooms := p_rooms - 1;
    v_max_rooms := p_rooms + 1;
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM sold_transactions st
  WHERE st.city = p_city
    AND st.price_per_sqm IS NOT NULL
    AND st.sold_date >= v_cutoff
    AND (p_rooms IS NULL OR (st.rooms BETWEEN v_min_rooms AND v_max_rooms));

  IF v_count < 20 THEN
    RETURN;
  END IF;

  SELECT
    percentile_cont(0.33) WITHIN GROUP (ORDER BY st.price_per_sqm),
    percentile_cont(0.67) WITHIN GROUP (ORDER BY st.price_per_sqm)
  INTO v_p33, v_p67
  FROM sold_transactions st
  WHERE st.city = p_city
    AND st.price_per_sqm IS NOT NULL
    AND st.sold_date >= v_cutoff
    AND (p_rooms IS NULL OR (st.rooms BETWEEN v_min_rooms AND v_max_rooms));

  RETURN QUERY
  SELECT
    v_p33 AS p33_price_sqm,
    v_p67 AS p67_price_sqm,
    v_count AS transaction_count,
    (SELECT AVG(s.price_per_sqm) FROM sold_transactions s
     WHERE s.city = p_city AND s.price_per_sqm IS NOT NULL AND s.sold_date >= v_cutoff
       AND (p_rooms IS NULL OR (s.rooms BETWEEN v_min_rooms AND v_max_rooms))
       AND s.price_per_sqm <= v_p33) AS tier_avg_standard,
    (SELECT AVG(s.price_per_sqm) FROM sold_transactions s
     WHERE s.city = p_city AND s.price_per_sqm IS NOT NULL AND s.sold_date >= v_cutoff
       AND (p_rooms IS NULL OR (s.rooms BETWEEN v_min_rooms AND v_max_rooms))
       AND s.price_per_sqm > v_p33 AND s.price_per_sqm <= v_p67) AS tier_avg_premium,
    (SELECT AVG(s.price_per_sqm) FROM sold_transactions s
     WHERE s.city = p_city AND s.price_per_sqm IS NOT NULL AND s.sold_date >= v_cutoff
       AND (p_rooms IS NULL OR (s.rooms BETWEEN v_min_rooms AND v_max_rooms))
       AND s.price_per_sqm > v_p67) AS tier_avg_luxury,
    (SELECT AVG(s.sold_price) FROM sold_transactions s
     WHERE s.city = p_city AND s.price_per_sqm IS NOT NULL AND s.sold_date >= v_cutoff
       AND (p_rooms IS NULL OR (s.rooms BETWEEN v_min_rooms AND v_max_rooms))
       AND s.price_per_sqm <= v_p33) AS tier_avg_price_standard,
    (SELECT AVG(s.sold_price) FROM sold_transactions s
     WHERE s.city = p_city AND s.price_per_sqm IS NOT NULL AND s.sold_date >= v_cutoff
       AND (p_rooms IS NULL OR (s.rooms BETWEEN v_min_rooms AND v_max_rooms))
       AND s.price_per_sqm > v_p33 AND s.price_per_sqm <= v_p67) AS tier_avg_price_premium,
    (SELECT AVG(s.sold_price) FROM sold_transactions s
     WHERE s.city = p_city AND s.price_per_sqm IS NOT NULL AND s.sold_date >= v_cutoff
       AND (p_rooms IS NULL OR (s.rooms BETWEEN v_min_rooms AND v_max_rooms))
       AND s.price_per_sqm > v_p67) AS tier_avg_price_luxury;
END;
$$;