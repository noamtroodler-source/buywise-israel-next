
CREATE OR REPLACE FUNCTION public.get_city_price_tiers(
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
  tier_avg_luxury NUMERIC
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  WITH filtered AS (
    SELECT st.price_per_sqm
    FROM sold_transactions st
    WHERE st.city = p_city
      AND st.price_per_sqm IS NOT NULL
      AND st.sold_date >= (CURRENT_DATE - (p_months_back || ' months')::interval)
      AND (p_rooms IS NULL OR st.rooms BETWEEN (p_rooms - 1) AND (p_rooms + 1))
  ),
  thresholds AS (
    SELECT
      percentile_cont(0.33) WITHIN GROUP (ORDER BY price_per_sqm) AS p33,
      percentile_cont(0.67) WITHIN GROUP (ORDER BY price_per_sqm) AS p67,
      COUNT(*)::integer AS cnt
    FROM filtered
  )
  SELECT
    ROUND(t.p33::numeric, 0) AS p33_price_sqm,
    ROUND(t.p67::numeric, 0) AS p67_price_sqm,
    t.cnt AS transaction_count,
    ROUND((SELECT AVG(f.price_per_sqm) FROM filtered f WHERE f.price_per_sqm <= t.p33)::numeric, 0) AS tier_avg_standard,
    ROUND((SELECT AVG(f.price_per_sqm) FROM filtered f WHERE f.price_per_sqm > t.p33 AND f.price_per_sqm <= t.p67)::numeric, 0) AS tier_avg_premium,
    ROUND((SELECT AVG(f.price_per_sqm) FROM filtered f WHERE f.price_per_sqm > t.p67)::numeric, 0) AS tier_avg_luxury
  FROM thresholds t
  WHERE t.cnt >= 20;
$$;
