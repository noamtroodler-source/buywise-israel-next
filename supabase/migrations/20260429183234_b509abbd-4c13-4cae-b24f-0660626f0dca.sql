DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'email_send_log'
      AND policyname = 'Admins can read email send log'
  ) THEN
    CREATE POLICY "Admins can read email send log"
    ON public.email_send_log
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;