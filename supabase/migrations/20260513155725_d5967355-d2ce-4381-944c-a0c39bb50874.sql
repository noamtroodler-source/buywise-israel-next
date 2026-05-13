DO $$
DECLARE
  j RECORD;
BEGIN
  FOR j IN
    SELECT jobid, jobname
    FROM cron.job
    WHERE jobname IN ('nightly-scrape-scheduler', 'yad2-retry-runner')
       OR command ILIKE '%nightly-scrape-scheduler%'
       OR command ILIKE '%yad2-retry-runner%'
  LOOP
    PERFORM cron.unschedule(j.jobid);
    RAISE NOTICE 'Unscheduled cron job: % (id %)', j.jobname, j.jobid;
  END LOOP;
END $$;