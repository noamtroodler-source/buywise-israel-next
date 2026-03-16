
CREATE POLICY "Admin can read all import jobs"
  ON public.import_jobs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can read all import job items"
  ON public.import_job_items FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
