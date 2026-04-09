/**
 * BuyWiseIsrael — Yad2 Retry Runner
 *
 * Runs every 30 minutes via pg_cron.
 * Processes the yad2_scrape_queue: fires staggered Yad2 scrapes,
 * detects CAPTCHA blocks, and schedules smart retries.
 *
 * Strategy:
 *   - Only runs during Israel's good scraping window (11 PM – 7 AM)
 *   - Processes up to 2 queue items per invocation (avoids edge fn timeout)
 *   - CAPTCHA block → retry in 90–150 min (up to max_attempts)
 *   - Real error → retry in 30–60 min (up to max_attempts)
 *   - Never increments agency_source.consecutive_failures for CAPTCHA
 *   - On success: marks done, updates agency_source.last_synced_at
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

const IMPORT_FN_URL = () =>
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-agency-listings`;
const SERVICE_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getIsraelHour(): number {
  const now = new Date();
  const month = now.getUTCMonth() + 1; // 1–12
  // Israel: UTC+3 in summer (Apr–Oct), UTC+2 in winter (Nov–Mar)
  const offset = month >= 4 && month <= 10 ? 3 : 2;
  return (now.getUTCHours() + offset) % 24;
}

function isGoodScrapingWindow(): boolean {
  const hour = getIsraelHour();
  // Good window: 11 PM (23) through 7 AM (7) Israel time
  return hour >= 23 || hour <= 7;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

async function callImport(body: Record<string, unknown>) {
  const res = await fetch(IMPORT_FN_URL(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`import-agency-listings ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

// Poll import_jobs until status is terminal or timeout reached
async function pollJobUntilDone(
  sb: ReturnType<typeof supabaseAdmin>,
  jobId: string,
  timeoutMs = 90_000
): Promise<{ status: string; failure_reason: string | null; total_urls: number }> {
  const deadline = Date.now() + timeoutMs;
  const POLL_INTERVAL = 6_000; // 6 seconds

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL));

    const { data: job } = await sb
      .from("import_jobs")
      .select("status, failure_reason, total_urls")
      .eq("id", jobId)
      .single();

    if (!job) continue;

    if (["ready", "completed", "failed"].includes(job.status)) {
      return {
        status: job.status,
        failure_reason: job.failure_reason ?? null,
        total_urls: job.total_urls ?? 0,
      };
    }
  }

  // Still discovering after timeout
  return { status: "timeout", failure_reason: null, total_urls: 0 };
}

// Run process_batch to completion (mirrors nightly-scrape-scheduler logic)
async function processJobToCompletion(jobId: string, maxBatches = 20): Promise<number> {
  let totalSucceeded = 0;

  for (let i = 0; i < maxBatches; i++) {
    const result = await callImport({ action: "process_batch", job_id: jobId });
    totalSucceeded += result.succeeded || 0;
    if (result.status === "completed" || (result.remaining || 0) === 0) break;
    await new Promise((r) => setTimeout(r, 2_000));
  }

  return totalSucceeded;
}

// ── Apify fallback ────────────────────────────────────────────────────────────

async function tryApifyFallback(
  sb: ReturnType<typeof supabaseAdmin>,
  item: {
    id: string;
    agency_source_id: string;
    agency_id: string;
    website_url: string;
    import_type: string;
  },
  lastJobId: string | null
) {
  const log = (msg: string) => console.log(`[Yad2Queue/Apify] ${item.website_url}: ${msg}`);

  // Mark Apify attempt so we don't retry again
  await sb.from("yad2_scrape_queue").update({
    apify_attempted: true,
    updated_at: new Date().toISOString(),
  }).eq("id", item.id);

  try {
    log("Firing Apify discover...");
    const discoverResult = await callImport({
      action: "discover",
      source_type: "yad2_apify",
      website_url: item.website_url,
      agency_id: item.agency_id,
      import_type: item.import_type,
    });

    if (discoverResult.error) throw new Error(discoverResult.error);

    const apifyJobId = discoverResult.job_id ?? null;
    if (!apifyJobId) {
      log("Apify returned no job — agency may have no listings");
      await sb.from("yad2_scrape_queue").update({
        status: "done",
        last_job_id: lastJobId,
        last_result: "empty",
        apify_result: "empty",
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      return;
    }

    log(`Apify job created: ${apifyJobId}, polling...`);
    const jobResult = await pollJobUntilDone(sb, apifyJobId, 120_000); // 2 min timeout for Apify

    if (jobResult.status === "failed" || jobResult.total_urls === 0) {
      const reason = jobResult.status === "failed" ? jobResult.failure_reason || "unknown" : "empty";
      log(`Apify ${reason === "empty" ? "returned 0 URLs" : `failed: ${reason}`}`);
      await sb.from("yad2_scrape_queue").update({
        status: "exhausted",
        last_job_id: lastJobId,
        last_result: "captcha",
        last_error: `Firecrawl CAPTCHA exhausted, Apify also ${reason}`,
        apify_result: `${reason === "empty" ? "empty" : `error: ${reason}`}`,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      return;
    }

    // Apify succeeded — process the listings
    log(`Apify discovery succeeded: ${jobResult.total_urls} URLs. Processing...`);
    const imported = await processJobToCompletion(apifyJobId);
    log(`Apify imported ${imported} listings`);

    await sb.from("yad2_scrape_queue").update({
      status: "done",
      last_job_id: apifyJobId,
      last_result: "success",
      listings_found: imported,
      apify_result: "success",
      updated_at: new Date().toISOString(),
    }).eq("id", item.id);

    await sb.from("agency_sources").update({
      last_synced_at: new Date().toISOString(),
      last_sync_job_id: apifyJobId,
      last_sync_listings_found: jobResult.total_urls,
      consecutive_failures: 0,
      last_failure_reason: null,
    }).eq("id", item.agency_source_id);

    log(`Done via Apify fallback! ${imported} listings imported`);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    log(`Apify fallback threw: ${errMsg}`);
    await sb.from("yad2_scrape_queue").update({
      status: "exhausted",
      last_result: "captcha",
      last_error: `Firecrawl CAPTCHA exhausted, Apify error: ${errMsg.slice(0, 400)}`,
      apify_result: `error: ${errMsg.slice(0, 200)}`,
      updated_at: new Date().toISOString(),
    }).eq("id", item.id);
  }
}

// ── Core queue item processor ─────────────────────────────────────────────────

async function processQueueItem(
  sb: ReturnType<typeof supabaseAdmin>,
  item: {
    id: string;
    agency_source_id: string;
    agency_id: string;
    website_url: string;
    import_type: string;
    attempt_number: number;
    max_attempts: number;
  }
) {
  const log = (msg: string) =>
    console.log(`[Yad2Queue] ${item.website_url} attempt=${item.attempt_number}: ${msg}`);

  // Mark as running
  await sb
    .from("yad2_scrape_queue")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", item.id);

  let jobId: string | null = null;

  try {
    // Fire the Yad2 discover
    log("Firing discover...");
    const discoverResult = await callImport({
      action: "discover",
      source_type: "yad2",
      website_url: item.website_url,
      agency_id: item.agency_id,
      import_type: item.import_type,
    });

    if (discoverResult.error) throw new Error(discoverResult.error);
    jobId = discoverResult.job_id ?? null;

    if (!jobId) {
      // No job created — nothing to scrape (agency has no listings or URL issue)
      log("No job created — possibly no listings found");
      await sb.from("yad2_scrape_queue").update({
        status: "done",
        last_result: "empty",
        last_error: "No job created",
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      return;
    }

    log(`Job created: ${jobId}, polling for completion...`);

    // Wait for background Yad2 discovery to finish (runs in EdgeRuntime.waitUntil)
    const jobResult = await pollJobUntilDone(sb, jobId);
    log(`Job result: status=${jobResult.status}, urls=${jobResult.total_urls}, reason=${jobResult.failure_reason}`);

    // ── CAPTCHA block ──
    if (jobResult.failure_reason === "captcha_blocked") {
      log("CAPTCHA blocked by ShieldSquare");

      if (item.attempt_number < item.max_attempts) {
        // Schedule retry in 90–150 min (stay within good scraping window)
        const retryMinutes = randomBetween(90, 150);
        await sb.from("yad2_scrape_queue").update({
          status: "pending",
          attempt_number: item.attempt_number + 1,
          scheduled_for: minutesFromNow(retryMinutes),
          last_job_id: jobId,
          last_result: "captcha",
          last_error: `CAPTCHA on attempt ${item.attempt_number}`,
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        log(`Retry scheduled in ${retryMinutes} min (attempt ${item.attempt_number + 1}/${item.max_attempts})`);
      } else {
        // All Firecrawl attempts exhausted via CAPTCHA — try Apify as fallback
        log(`All ${item.max_attempts} Firecrawl attempts CAPTCHA-blocked — trying Apify fallback`);
        await tryApifyFallback(sb, item, jobId);
      }
      return;
    }

    // ── Real error ──
    if (jobResult.status === "failed") {
      const errMsg = jobResult.failure_reason || "Unknown error";
      log(`Discover failed: ${errMsg}`);

      if (item.attempt_number < item.max_attempts) {
        const retryMinutes = randomBetween(30, 60);
        await sb.from("yad2_scrape_queue").update({
          status: "pending",
          attempt_number: item.attempt_number + 1,
          scheduled_for: minutesFromNow(retryMinutes),
          last_job_id: jobId,
          last_result: "error",
          last_error: errMsg,
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        log(`Retry scheduled in ${retryMinutes} min`);
      } else {
        await sb.from("yad2_scrape_queue").update({
          status: "exhausted",
          last_job_id: jobId,
          last_result: "error",
          last_error: errMsg,
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        // Count real errors toward consecutive_failures
        const { data: src } = await sb
          .from("agency_sources")
          .select("consecutive_failures, is_active")
          .eq("id", item.agency_source_id)
          .single();
        if (src) {
          const newCount = (src.consecutive_failures || 0) + 1;
          await sb.from("agency_sources").update({
            consecutive_failures: newCount,
            last_failure_reason: `Yad2 exhausted: ${errMsg}`.slice(0, 500),
            is_active: newCount >= 5 ? false : src.is_active,
          }).eq("id", item.agency_source_id);
        }
        log("Exhausted — real errors counted toward consecutive_failures");
      }
      return;
    }

    // ── Timeout (still discovering) ──
    if (jobResult.status === "timeout") {
      log("Job still discovering after 90s — leaving as running, will clean up next cycle");
      // Don't update status — leave as 'running', cleanup handles it
      return;
    }

    // ── Empty result (no new URLs) ──
    if (jobResult.total_urls === 0) {
      log("Discovery completed with 0 new URLs — agency may be up to date");
      await sb.from("yad2_scrape_queue").update({
        status: "done",
        last_job_id: jobId,
        last_result: "empty",
        listings_found: 0,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      // Still update last_synced_at so we know it ran
      await sb.from("agency_sources").update({
        last_synced_at: new Date().toISOString(),
        last_sync_job_id: jobId,
        last_sync_listings_found: 0,
        consecutive_failures: 0,
        last_failure_reason: null,
      }).eq("id", item.agency_source_id);
      return;
    }

    // ── Success: job ready, process listings ──
    log(`Discovery succeeded: ${jobResult.total_urls} new URLs. Processing...`);
    const imported = await processJobToCompletion(jobId);
    log(`Imported ${imported} listings`);

    await sb.from("yad2_scrape_queue").update({
      status: "done",
      last_job_id: jobId,
      last_result: "success",
      listings_found: imported,
      updated_at: new Date().toISOString(),
    }).eq("id", item.id);

    await sb.from("agency_sources").update({
      last_synced_at: new Date().toISOString(),
      last_sync_job_id: jobId,
      last_sync_listings_found: jobResult.total_urls,
      consecutive_failures: 0,
      last_failure_reason: null,
    }).eq("id", item.agency_source_id);

    log(`Done! ${imported} listings imported successfully`);

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Yad2Queue] Unexpected error for ${item.website_url}:`, errMsg);

    // Reset to pending for retry if attempts remain, otherwise mark failed
    if (item.attempt_number < item.max_attempts) {
      const retryMinutes = randomBetween(20, 40);
      await sb.from("yad2_scrape_queue").update({
        status: "pending",
        attempt_number: item.attempt_number + 1,
        scheduled_for: minutesFromNow(retryMinutes),
        last_job_id: jobId,
        last_result: "error",
        last_error: errMsg.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
    } else {
      await sb.from("yad2_scrape_queue").update({
        status: "failed",
        last_job_id: jobId,
        last_result: "error",
        last_error: errMsg.slice(0, 500),
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
    }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (
    token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") &&
    token !== Deno.env.get("CRON_SECRET")
  ) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = supabaseAdmin();
  const israelHour = getIsraelHour();
  const inWindow = isGoodScrapingWindow();

  // ── Time window check ────────────────────────────────────────────────────
  if (!inWindow) {
    console.log(`[Yad2Queue] Outside scraping window (Israel hour: ${israelHour}) — skipping`);
    return new Response(
      JSON.stringify({ skipped: true, reason: "outside_scraping_window", israel_hour: israelHour }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[Yad2Queue] Running — Israel hour: ${israelHour}, in good window`);

  // ── Cleanup: reset stuck 'running' items older than 15 minutes ──────────
  const stuckCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: stuckCount } = await sb
    .from("yad2_scrape_queue")
    .update({ status: "pending", updated_at: new Date().toISOString() })
    .eq("status", "running")
    .lt("updated_at", stuckCutoff)
    .select("*", { count: "exact", head: true });

  if (stuckCount && stuckCount > 0) {
    console.log(`[Yad2Queue] Reset ${stuckCount} stuck running items back to pending`);
  }

  // ── Fetch due queue items ─────────────────────────────────────────────────
  const now = new Date().toISOString();
  const { data: dueItems, error: queueErr } = await sb
    .from("yad2_scrape_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(2); // Max 2 per invocation — each can take up to 5 min

  if (queueErr) {
    console.error("[Yad2Queue] Failed to fetch queue:", queueErr.message);
    return new Response(
      JSON.stringify({ error: queueErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!dueItems?.length) {
    console.log("[Yad2Queue] No due items");
    return new Response(
      JSON.stringify({ processed: 0, message: "No due items" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[Yad2Queue] ${dueItems.length} item(s) due for processing`);

  // Return immediately, process in background (Yad2 discovery takes ~2–5 min)
  const backgroundWork = async () => {
    for (const item of dueItems) {
      try {
        await processQueueItem(sb, item);
      } catch (err) {
        console.error(`[Yad2Queue] processQueueItem threw for ${item.id}:`, err);
      }
      // Small gap between items
      await new Promise((r) => setTimeout(r, 3_000));
    }
    console.log("[Yad2Queue] Background processing complete");
  };

  // @ts-ignore — EdgeRuntime is available in Supabase edge functions
  EdgeRuntime.waitUntil(backgroundWork());

  return new Response(
    JSON.stringify({ processing: dueItems.length, items: dueItems.map((i) => i.website_url) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
