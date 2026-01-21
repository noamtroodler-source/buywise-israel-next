-- Add missing status columns to agencies table to match developers/agents pattern
ALTER TABLE public.agencies 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Add check constraint for status
ALTER TABLE public.agencies 
ADD CONSTRAINT agencies_status_check 
CHECK (status IN ('pending', 'active', 'suspended'));

-- Migrate existing data: if is_verified = true, set status = 'active'
UPDATE public.agencies 
SET status = 'active', verification_status = 'approved', approved_at = updated_at
WHERE is_verified = true AND status = 'pending';

-- Update unverified agencies to have consistent pending status
UPDATE public.agencies 
SET status = 'pending', verification_status = 'pending'
WHERE is_verified = false OR is_verified IS NULL;