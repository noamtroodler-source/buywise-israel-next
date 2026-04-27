/**
 * BuyWiseIsrael — Yad2 Retry Runner (Apify-First)
 *
 * Runs every 30 minutes via pg_cron.
 * Processes the yad2_scrape_queue using Apify as the primary scraping engine.
 * No scraping window restriction — Apify works 24/7.
 *
 * Strategy:
 *   - Uses Apify directly (no Firecrawl) — bypasses ShieldSquare/CAPTCHA
 *   - Processes up to 32 queue items per invocation (parallel groups of 8)
 *   - On failure → retry in 30–60 min (up to max_attempts)
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

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function getIsraelHour(): number {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const offset = month >= 4 && month <= 10 ? 3 : 2;
  return (now.getUTCHours() + offset) % 24;
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
  timeoutMs = 180_000 // 3 min — Apify runs take longer than Firecrawl
): Promise<{ status: string; failure_reason: string | null; total_urls: number }> {
  const deadline = Date.now() + timeoutMs;
  const POLL_INTERVAL = 8_000;

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

  return { status: "timeout", failure_reason: null, total_urls: 0 };
}

// Run process_batch to completion
async function processJobToCompletion(jobId: string, maxBatches = 30): Promise<number> {
  let totalSucceeded = 0;

  for (let i = 0; i < maxBatches; i++) {
    const result = await callImport({ action: "process_batch", job_id: jobId });
    totalSucceeded += result.succeeded || 0;
    if (result.status === "completed" || (result.remaining || 0) === 0) break;
    await new Promise((r) => setTimeout(r, 2_000));
  }

  return totalSucceeded;
}

// ── Core queue item processor (Apify-first) ───────────────────────────────────

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

  await sb
    .from("yad2_scrape_queue")
    .update({ status: "running", updated_at: new Date().toISOString() })
    .eq("id", item.id);

  let jobId: string | null = null;

  try {
    // Go directly to Apify — no Firecrawl, no CAPTCHA dance
    log("Firing Apify discover...");
    const discoverResult = await callImport({
      action: "discover",
      source_type: "yad2_apify",
      website_url: item.website_url,
      agency_id: item.agency_id,
      import_type: item.import_type,
    });

    if (discoverResult.error) throw new Error(discoverResult.error);
    jobId = discoverResult.job_id ?? null;

    if (!jobId) {
      log("No job created — no new listings found");
      await sb.from("yad2_scrape_queue").update({
        status: "done",
        last_result: "empty",
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      await sb.from("agency_sources").update({
        last_synced_at: new Date().toISOString(),
        last_sync_listings_found: discoverResult.total_discovered || 0,
        consecutive_failures: 0,
        last_failure_reason: null,
      }).eq("id", item.agency_source_id);
      return;
    }

    log(`Job created: ${jobId}, polling for completion...`);
    const jobResult = await pollJobUntilDone(sb, jobId);
    log(`Job result: status=${jobResult.status}, urls=${jobResult.total_urls}, reason=${jobResult.failure_reason}`);

    // ── Timeout ──
    if (jobResult.status === "timeout") {
      log("Job still running after 3min — will retry next cycle");
      await sb.from("yad2_scrape_queue").update({
        status: "pending",
        scheduled_for: minutesFromNow(10),
        last_job_id: jobId,
        last_error: "Apify timeout - will retry",
        updated_at: new Date().toISOString(),
      }).eq("id", item.id);
      return;
    }

    // ── Failure ──
    if (jobResult.status === "failed") {
      const errMsg = jobResult.failure_reason || "Unknown error";
      log(`Apify discover failed: ${errMsg}`);

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
        log("Exhausted after all attempts");
      }
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

// @ts-ignore — EdgeRuntime available in Supabase edge functions
declare const EdgeRuntime: { waitUntil(promise: Promise<any>): void };

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

  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  // ── Always clean up stuck items ──
  const stuckCutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: stuckCount } = await sb
    .from("yad2_scrape_queue")
    .update({ status: "pending", updated_at: new Date().toISOString() }, { count: "exact" })
    .eq("status", "running")
    .lt("updated_at", stuckCutoff);

  if (stuckCount && stuckCount > 0) {
    console.log(`[Yad2Queue] Reset ${stuckCount} stuck running items back to pending`);
  }

  // No scraping window restriction — Apify works 24/7
  console.log(`[Yad2Queue] Running — Israel hour: ${israelHour}, Apify mode (no window restriction)`);

  // ── Fetch due queue items ──
  const now = new Date().toISOString();

  // Check recent failure rates to skip consistently failing agencies
  const recentFailureCutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data: recentJobs } = await sb
    .from("import_jobs")
    .select("agency_id, total_urls, failed_count, processed_count")
    .gte("created_at", recentFailureCutoff)
    .eq("source_type", "yad2");

  const agencyJobStats = new Map<string, { total: number; failed: number; jobs: number }>();
  for (const j of (recentJobs || []) as any[]) {
    const stats = agencyJobStats.get(j.agency_id) || { total: 0, failed: 0, jobs: 0 };
    stats.total += j.total_urls || 0;
    stats.failed += j.failed_count || 0;
    stats.jobs += 1;
    agencyJobStats.set(j.agency_id, stats);
  }
  const highFailureAgencies = new Set<string>();
  for (const [agencyId, stats] of agencyJobStats) {
    if (stats.jobs >= 3 && stats.total > 0 && (stats.failed / stats.total) > 0.8) {
      highFailureAgencies.add(agencyId);
      console.log(`[Yad2Queue] Skipping agency ${agencyId} — ${stats.failed}/${stats.total} failures across ${stats.jobs} recent jobs`);
    }
  }

  const { data: dueItems, error: queueErr } = await sb
    .from("yad2_scrape_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(30); // Fetch extra to filter

  if (queueErr) {
    console.error("[Yad2Queue] Failed to fetch queue:", queueErr.message);
    return new Response(
      JSON.stringify({ error: queueErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

   // Filter and take up to 32 items per invocation
   const filteredItems = (dueItems || []).filter((item: any) => {
     if (highFailureAgencies.has(item.agency_id)) return false;
     return true;
   }).slice(0, 32);

  if (!filteredItems.length) {
    console.log("[Yad2Queue] No due items");
    return new Response(
      JSON.stringify({ processed: 0, message: "No due items" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log(`[Yad2Queue] ${filteredItems.length} item(s) due for processing`);

   // Process in background with parallel groups of 8 (32GB Apify plan)
   const backgroundWork = async () => {
     const PARALLEL = 8;
    for (let i = 0; i < filteredItems.length; i += PARALLEL) {
      const batch = filteredItems.slice(i, i + PARALLEL);
      console.log(`[Yad2Queue] Processing parallel batch ${Math.floor(i / PARALLEL) + 1}: ${batch.map((b: any) => b.website_url).join(", ")}`);

      await Promise.allSettled(
        batch.map((item: any) =>
          processQueueItem(sb, item).catch((err: any) =>
            console.error(`[Yad2Queue] processQueueItem threw for ${item.id}:`, err)
          )
        )
      );

      // Small gap between parallel groups
      if (i + PARALLEL < filteredItems.length) {
        await new Promise((r) => setTimeout(r, 3_000));
      }
    }
    console.log("[Yad2Queue] Background processing complete");
  };

  EdgeRuntime.waitUntil(backgroundWork());

  return new Response(
    JSON.stringify({ processing: filteredItems.length, items: filteredItems.map((i: any) => i.website_url) }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
