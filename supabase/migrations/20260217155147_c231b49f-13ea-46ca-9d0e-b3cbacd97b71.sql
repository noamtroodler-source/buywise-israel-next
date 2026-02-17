
-- Function: grant +10 visibility credits when a blog post is approved
CREATE OR REPLACE FUNCTION public.grant_blog_approval_credits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entity_type text;
  v_entity_id uuid;
  v_agency_id uuid;
BEGIN
  -- Only fire when status changes TO 'approved'
  IF NEW.verification_status = 'approved' AND (OLD.verification_status IS DISTINCT FROM 'approved') THEN

    -- Resolve the author's billing entity
    IF NEW.author_type = 'agent' THEN
      SELECT agency_id INTO v_agency_id
      FROM public.agents
      WHERE id = NEW.author_profile_id;

      IF v_agency_id IS NOT NULL THEN
        v_entity_type := 'agency';
        v_entity_id := v_agency_id;
      ELSE
        -- Solo agent without agency – skip reward
        RETURN NEW;
      END IF;

    ELSIF NEW.author_type = 'agency' THEN
      v_entity_type := 'agency';
      v_entity_id := NEW.author_profile_id;

    ELSIF NEW.author_type = 'developer' THEN
      v_entity_type := 'developer';
      v_entity_id := NEW.author_profile_id;

    ELSE
      RETURN NEW;
    END IF;

    -- Grant 10 visibility credits expiring end of current month
    PERFORM public.record_credit_purchase(
      p_entity_type := v_entity_type,
      p_entity_id := v_entity_id,
      p_amount := 10,
      p_transaction_type := 'blog_reward',
      p_credit_type := 'visibility',
      p_reference_id := NEW.id,
      p_description := 'Blog approval reward: ' || LEFT(NEW.title, 80),
      p_expires_at := (date_trunc('month', now()) + interval '1 month' - interval '1 second')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on blog_posts
CREATE TRIGGER on_blog_approval
  AFTER UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_blog_approval_credits();
