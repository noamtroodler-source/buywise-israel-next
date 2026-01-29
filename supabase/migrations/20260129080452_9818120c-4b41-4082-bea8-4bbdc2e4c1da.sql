-- Add buyer email preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notify_email boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_price_drops boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_search_alerts boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_recommendations boolean DEFAULT false;

-- Track when alerts were last processed
ALTER TABLE public.search_alerts
ADD COLUMN IF NOT EXISTS last_sent_at timestamptz,
ADD COLUMN IF NOT EXISTS last_checked_at timestamptz;

-- Track when price drop emails were sent
ALTER TABLE public.price_drop_notifications
ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;