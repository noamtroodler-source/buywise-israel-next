ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS premium_drivers TEXT[] NOT NULL DEFAULT '{}',
ADD COLUMN IF NOT EXISTS premium_explanation TEXT,
ADD COLUMN IF NOT EXISTS market_fit_status TEXT,
ADD COLUMN IF NOT EXISTS market_fit_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS market_fit_confirmed_by UUID,
ADD COLUMN IF NOT EXISTS market_fit_review_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_properties_premium_drivers
ON public.properties USING GIN (premium_drivers);

CREATE INDEX IF NOT EXISTS idx_properties_market_fit_status
ON public.properties (market_fit_status);

COMMENT ON COLUMN public.properties.premium_drivers IS 'Agency-confirmed drivers that may explain pricing above recorded comparable sales.';
COMMENT ON COLUMN public.properties.premium_explanation IS 'Short agency-written explanation for a feature-driven or unusual pricing premium.';
COMMENT ON COLUMN public.properties.market_fit_status IS 'Computed Market Fit state used to guide public market context and agency review workflows.';
COMMENT ON COLUMN public.properties.market_fit_confirmed_at IS 'Timestamp when premium context or Market Fit details were confirmed by the listing owner.';
COMMENT ON COLUMN public.properties.market_fit_confirmed_by IS 'User id of the person who confirmed the premium context or Market Fit details.';
COMMENT ON COLUMN public.properties.market_fit_review_reason IS 'Internal reason the listing needs or needed Market Fit review.';