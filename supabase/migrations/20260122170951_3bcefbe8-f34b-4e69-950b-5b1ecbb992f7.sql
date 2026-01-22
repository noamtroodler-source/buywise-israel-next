-- Add agent_fee_required column for rental listings
ALTER TABLE properties 
ADD COLUMN agent_fee_required BOOLEAN DEFAULT NULL;