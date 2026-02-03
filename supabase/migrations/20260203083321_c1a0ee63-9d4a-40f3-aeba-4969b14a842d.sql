-- Add center coordinates to cities table for map centering
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS center_lat NUMERIC,
ADD COLUMN IF NOT EXISTS center_lng NUMERIC;

-- Update existing cities with approximate center coordinates
UPDATE public.cities SET
  center_lat = CASE slug
    WHEN 'tel-aviv' THEN 32.0853
    WHEN 'jerusalem' THEN 31.7683
    WHEN 'haifa' THEN 32.7940
    WHEN 'raanana' THEN 32.1847
    WHEN 'herzliya' THEN 32.1656
    WHEN 'netanya' THEN 32.3215
    WHEN 'petah-tikva' THEN 32.0841
    WHEN 'kfar-saba' THEN 32.1750
    WHEN 'hod-hasharon' THEN 32.1544
    WHEN 'rehovot' THEN 31.8928
    WHEN 'rishon-lezion' THEN 31.9730
    WHEN 'ashdod' THEN 31.8044
    WHEN 'beer-sheva' THEN 31.2518
    WHEN 'modiin' THEN 31.8979
    WHEN 'givatayim' THEN 32.0717
    WHEN 'ramat-gan' THEN 32.0680
    WHEN 'bat-yam' THEN 32.0231
    WHEN 'holon' THEN 32.0105
    WHEN 'nahariya' THEN 33.0055
    WHEN 'eilat' THEN 29.5577
    ELSE NULL
  END,
  center_lng = CASE slug
    WHEN 'tel-aviv' THEN 34.7818
    WHEN 'jerusalem' THEN 35.2137
    WHEN 'haifa' THEN 34.9896
    WHEN 'raanana' THEN 34.8714
    WHEN 'herzliya' THEN 34.8467
    WHEN 'netanya' THEN 34.8532
    WHEN 'petah-tikva' THEN 34.8878
    WHEN 'kfar-saba' THEN 34.9069
    WHEN 'hod-hasharon' THEN 34.8958
    WHEN 'rehovot' THEN 34.8113
    WHEN 'rishon-lezion' THEN 34.7925
    WHEN 'ashdod' THEN 34.6553
    WHEN 'beer-sheva' THEN 34.7915
    WHEN 'modiin' THEN 35.0104
    WHEN 'givatayim' THEN 34.8121
    WHEN 'ramat-gan' THEN 34.8241
    WHEN 'bat-yam' THEN 34.7517
    WHEN 'holon' THEN 34.7728
    WHEN 'nahariya' THEN 35.0974
    WHEN 'eilat' THEN 34.9519
    ELSE NULL
  END
WHERE center_lat IS NULL;