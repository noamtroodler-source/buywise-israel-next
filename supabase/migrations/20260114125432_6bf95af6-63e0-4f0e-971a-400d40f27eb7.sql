-- Add missing Herzliya monthly data for July 2024 - April 2025
INSERT INTO public.market_data (city, year, month, average_price_sqm, data_type)
VALUES
  ('Herzliya', 2024, 7, 40400, 'monthly'),
  ('Herzliya', 2024, 8, 40600, 'monthly'),
  ('Herzliya', 2024, 9, 40800, 'monthly'),
  ('Herzliya', 2024, 10, 41000, 'monthly'),
  ('Herzliya', 2024, 11, 41200, 'monthly'),
  ('Herzliya', 2024, 12, 41500, 'monthly'),
  ('Herzliya', 2025, 1, 42000, 'monthly'),
  ('Herzliya', 2025, 2, 42500, 'monthly'),
  ('Herzliya', 2025, 3, 43000, 'monthly'),
  ('Herzliya', 2025, 4, 43500, 'monthly');