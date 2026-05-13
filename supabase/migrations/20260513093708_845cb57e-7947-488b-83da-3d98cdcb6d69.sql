ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS ai_buyer_takeaway TEXT,
  ADD COLUMN IF NOT EXISTS ai_buyer_takeaway_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ai_buyer_takeaway_input_hash TEXT;