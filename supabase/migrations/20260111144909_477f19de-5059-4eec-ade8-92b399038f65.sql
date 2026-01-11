-- Add price alert columns to favorites table
ALTER TABLE favorites 
ADD COLUMN price_alert_enabled boolean DEFAULT true,
ADD COLUMN last_known_price numeric,
ADD COLUMN price_alert_threshold integer DEFAULT 0;

-- Create price drop notifications table
CREATE TABLE public.price_drop_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  previous_price numeric NOT NULL,
  new_price numeric NOT NULL,
  drop_percent numeric NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on price_drop_notifications
ALTER TABLE public.price_drop_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for price_drop_notifications
CREATE POLICY "Users can view their own notifications"
ON public.price_drop_notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.price_drop_notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.price_drop_notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.price_drop_notifications
FOR INSERT
WITH CHECK (true);

-- Create trigger function to detect price drops and notify users
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS TRIGGER AS $$
BEGIN
  -- When price decreases, create notifications for users who favorited this property
  IF NEW.price < OLD.price THEN
    INSERT INTO public.price_drop_notifications (user_id, property_id, previous_price, new_price, drop_percent)
    SELECT f.user_id, NEW.id, OLD.price, NEW.price, 
           ROUND(((OLD.price - NEW.price) / OLD.price * 100)::numeric, 1)
    FROM public.favorites f
    WHERE f.property_id = NEW.id 
      AND f.price_alert_enabled = true
      AND (f.price_alert_threshold = 0 OR 
           ((OLD.price - NEW.price) / OLD.price * 100) >= f.price_alert_threshold);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on properties table
CREATE TRIGGER trigger_price_drop_notification
AFTER UPDATE OF price ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.notify_price_drop();