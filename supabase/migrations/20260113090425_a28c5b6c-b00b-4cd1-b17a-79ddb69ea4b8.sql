-- Add core property fields that are standard on Israeli listing sites (Yad2, Madlan)

-- Entry/availability date - when the property is available for move-in
ALTER TABLE properties ADD COLUMN IF NOT EXISTS entry_date date;

-- Air conditioning type - important Israeli distinction
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ac_type text CHECK (ac_type IN ('none', 'split', 'central', 'mini_central'));

-- Monthly Va'ad Bayit (HOA) fee in ILS - agents usually know this
ALTER TABLE properties ADD COLUMN IF NOT EXISTS vaad_bayit_monthly integer;

-- Add comments for clarity
COMMENT ON COLUMN properties.entry_date IS 'Date property is available for move-in. NULL means immediate or not specified.';
COMMENT ON COLUMN properties.ac_type IS 'Air conditioning type: none, split (units), central, or mini_central';
COMMENT ON COLUMN properties.vaad_bayit_monthly IS 'Monthly building maintenance fee (Va''ad Bayit) in ILS';