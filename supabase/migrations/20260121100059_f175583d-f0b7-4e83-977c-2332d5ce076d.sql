-- Add exchange rate to calculator_constants
INSERT INTO calculator_constants (constant_key, category, value_numeric, label, description, source, source_url, is_current)
VALUES ('EXCHANGE_RATE_USD_ILS', 'general', 3.65, 'USD/ILS Exchange Rate', 'Default exchange rate for currency conversion', 'Bank of Israel', 'https://www.boi.org.il/en/markets/exchange-rates/', true)
ON CONFLICT (constant_key) WHERE is_current = true DO NOTHING;