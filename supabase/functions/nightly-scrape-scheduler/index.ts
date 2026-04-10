/**
 * BuyWiseIsrael — Nightly Scrape Scheduler
 *
 * Runs weekly (Friday 2 AM Israel time via pg_cron).
 *
 * Strategy:
 *   - Non-Yad2 sources (agency websites, Madlan): fire as background tasks via EdgeRuntime.waitUntil
 *   - Yad2 sources: enqueue to yad2_scrape_queue with staggered timing
 *     The yad2-retry-runner (every 30 min) handles actual scraping + retries
 *
 * Returns in seconds — all heavy work runs in the background.
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function supabaseAdmin() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

const IMPORT_FN_URL = () => `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-agency-listings`;
const YAD2_RUNNER_URL = () => `${Deno.env.get("SUPABASE_URL")}/functions/v1/yad2-retry-runner?force=true`;
const SERVICE_KEY = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callImport(body: Record<string, unknown>) {
  const res = await fetch(IMPORT_FN_URL(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

function detectSourceType(url: string): "yad2" | "madlan" | "website" {
  if (url.includes("yad2.co.il")) return "yad2";
  if (url.includes("madlan.co.il")) return "madlan";
  return "website";
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** ISO week start (Monday) for a given date */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0];
}

async function enqueueYad2Sources(
  sb: ReturnType<typeof supabaseAdmin>,
  yad2Sources: any[],
): Promise<{ enqueued: number; skipped: number }> {
  const weekStart = getWeekStart(new Date());
  const BASE_GAP_MINUTES = 35;
  const JITTER_MINUTES = 20;

  let enqueued = 0;
  let skipped = 0;

  for (let i = 0; i < yad2Sources.length; i++) {
    const source = yad2Sources[i];
    const delayMinutes = i * (BASE_GAP_MINUTES + randomBetween(0, JITTER_MINUTES));
    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();

    const { error } = await sb.from("yad2_scrape_queue").upsert(
      {
        agency_source_id: source.id,
        agency_id: source.agency_id,
        website_url: source.source_url,
        import_type: source.import_type || "resale",
        status: "pending",
        scheduled_for: scheduledFor,
        attempt_number: 1,
        max_attempts: 3,
        week_start: weekStart,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "agency_source_id,week_start",
        ignoreDuplicates: true,
      },
    );

    if (error) {
      console.warn(`Failed to enqueue Yad2 source ${source.id}: ${error.message}`);
      skipped++;
    } else {
      console.log(`Yad2 queued: ${source.source_url} (agency: ${source.agencies?.name}) in ${delayMinutes} min`);
      enqueued++;
    }
  }

  return { enqueued, skipped };
}

/**
 * Process a single non-Yad2 source end-to-end in the background.
 * Discover → process all batches → update agency_sources.
 */
async function processSourceInBackground(source: any): Promise<void> {
  const sb = supabaseAdmin();
  const sourceType = detectSourceType(source.source_url);

  try {
    console.log(`[BG] Processing [${sourceType}] ${source.source_url} (agency: ${source.agencies?.name})`);

    // 1. Discover
    const discoverResult = await callImport({
      action: "discover",
      source_type: sourceType,
      website_url: source.source_url,
      agency_id: source.agency_id,
      import_type: source.import_type || "resale",
    });

    if (discoverResult.error) throw new Error(discoverResult.error);

    let succeeded = 0;
    let failed = 0;

    // 2. Process all batches (import-agency-listings self-chains, but kick off the first batch)
    if (discoverResult.job_id && (discoverResult.new_urls || discoverResult.total_urls || 0) > 0) {
      // Fire the first batch — import-agency-listings will self-chain remaining batches
      const processResult = await callImport({ action: "process_batch", job_id: discoverResult.job_id });
      succeeded = processResult.succeeded || 0;
      failed = processResult.failed || 0;
      console.log(`[BG] ${source.source_url}: first batch ${succeeded} ok, ${failed} failed, ${processResult.remaining || 0} remaining (self-chaining)`);
    } else {
      console.log(`[BG] ${source.source_url}: No new URLs found`);
    }

    // 3. Update agency_sources
    await sb
      .from("agency_sources")
      .update({
        last_synced_at: new Date().toISOString(),
        last_sync_job_id: discoverResult.job_id || null,
        last_sync_listings_found: discoverResult.new_urls || discoverResult.total_urls || 0,
        consecutive_failures: 0,
        last_failure_reason: null,
      })
      .eq("id", source.id);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[BG] Source ${source.id} failed: ${errMsg}`);

    const newFailureCount = (source.consecutive_failures || 0) + 1;
    const shouldDisable = newFailureCount >= 5;

    await sb
      .from("agency_sources")
      .update({
        consecutive_failures: newFailureCount,
        last_failure_reason: errMsg.slice(0, 500),
        is_active: shouldDisable ? false : source.is_active,
      })
      .eq("id", source.id);
  }
}

/**
 * Stall recovery: find import_jobs with pending items that haven't been
 * updated in 10+ minutes and re-fire process_batch for them.
 */
async function runStallRecovery(): Promise<void> {
  const sb = supabaseAdmin();
  try {
    const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Find jobs that still have pending items
    const { data: stalledJobs } = await sb
      .from("import_jobs")
      .select("id, last_heartbeat")
      .eq("status", "processing")
      .lt("last_heartbeat", cutoff)
      .limit(20);

    if (!stalledJobs?.length) {
      console.log("[BG] Stall recovery: no stalled jobs found");
      return;
    }

    console.log(`[BG] Stall recovery: ${stalledJobs.length} stalled jobs, re-triggering`);

    for (const job of stalledJobs) {
      try {
        await fetch(IMPORT_FN_URL(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_KEY()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "process_batch", job_id: job.id }),
        });
        console.log(`[BG] Re-triggered batch for stalled job ${job.id}`);
      } catch (e) {
        console.warn(`[BG] Failed to re-trigger job ${job.id}:`, e);
      }
      // Small delay between re-triggers
      await new Promise(r => setTimeout(r, 1000));
    }
  } catch (err) {
    console.error("[BG] Stall recovery error:", err);
  }
}

/**
 * Run freshness check for stale listings in the background.
 */
async function runFreshnessCheckInBackground(): Promise<void> {
  const sb = supabaseAdmin();
  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const { data: staleListings } = await sb
      .from("properties")
      .select("id, source_url, price")
      .not("source_url", "is", null)
      .eq("is_published", true)
      .or(`source_last_checked_at.is.null,source_last_checked_at.lt.${cutoff}`)
      .neq("source_status", "removed")
      .limit(100);

    if (!staleListings?.length) {
      console.log("[BG] Freshness check: 0 stale listings");
      return;
    }

    console.log(`[BG] Freshness check: ${staleListings.length} listings to check`);

    const items = staleListings.map((l: any) => ({
      property_id: l.id,
      source_url: l.source_url,
      current_price: l.price,
    }));

    const result = await callImport({ action: "check_existing", agency_id: "system", items });
    console.log(
      `[BG] Freshness: checked=${result.checked || 0}, removed=${result.removed?.length || 0}, price_changes=${result.price_changes?.length || 0}`,
    );
  } catch (err: unknown) {
    console.error("[BG] Freshness check failed:", err);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const isServiceKey = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isCronSecret = token === Deno.env.get("CRON_SECRET");

  let isAdminUser = false;
  if (!isServiceKey && !isCronSecret && token) {
    try {
      const sb = supabaseAdmin();
      const {
        data: { user },
      } = await sb.auth.getUser(token);
      if (user) {
        const { data: roleRow } = await sb
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        isAdminUser = !!roleRow;
      }
    } catch (_) {
      /* not a valid JWT */
    }
  }

  if (!isServiceKey && !isCronSecret && !isAdminUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = supabaseAdmin();
  const summary: Record<string, unknown> = {
    started_at: new Date().toISOString(),
    yad2_enqueued: 0,
    yad2_skipped: 0,
    non_yad2_fired: 0,
    freshness_fired: true,
    mode: "background",
  };

  try {
    const { data: sources, error: sourcesErr } = await sb
      .from("agency_sources")
      .select("*, agencies(id, name)")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .order("last_synced_at", { ascending: true, nullsFirst: true });

    if (sourcesErr) throw new Error(`Failed to load agency sources: ${sourcesErr.message}`);
    if (!sources?.length) {
      return new Response(JSON.stringify({ ...summary, message: "No active agency sources configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Nightly scrape: ${sources.length} total sources`);

    const yad2Sources = sources.filter((s: any) => detectSourceType(s.source_url) === "yad2");
    const nonYad2Sources = sources.filter((s: any) => detectSourceType(s.source_url) !== "yad2");

    console.log(`  ${yad2Sources.length} Yad2 sources → queuing for retry-runner`);
    console.log(`  ${nonYad2Sources.length} non-Yad2 sources → firing as background tasks`);

    // ── Yad2: enqueue for retry-runner ──
    if (yad2Sources.length > 0) {
      await sb.from("yad2_scrape_queue").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const queueResult = await enqueueYad2Sources(sb, yad2Sources);
      summary.yad2_enqueued = queueResult.enqueued;
      summary.yad2_skipped = queueResult.skipped;
      console.log(`Yad2: ${queueResult.enqueued} enqueued, ${queueResult.skipped} skipped`);

      if (queueResult.enqueued > 0) {
        fetch(YAD2_RUNNER_URL(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_KEY()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        })
          .then(() => console.log("yad2-retry-runner triggered"))
          .catch((e) => console.warn("Failed to trigger yad2-retry-runner:", e.message));
      }
    }

    // ── Non-Yad2: fire in throttled waves to avoid Firecrawl rate limits ──
    const WAVE_SIZE = 10;
    const WAVE_DELAY_MS = 3000;

    EdgeRuntime.waitUntil(
      (async () => {
        for (let i = 0; i < nonYad2Sources.length; i += WAVE_SIZE) {
          const wave = nonYad2Sources.slice(i, i + WAVE_SIZE);
          console.log(`[BG] Firing wave ${Math.floor(i / WAVE_SIZE) + 1}: ${wave.length} sources (${i + 1}–${i + wave.length} of ${nonYad2Sources.length})`);
          await Promise.allSettled(wave.map((s: any) => processSourceInBackground(s)));
          if (i + WAVE_SIZE < nonYad2Sources.length) {
            await new Promise((r) => setTimeout(r, WAVE_DELAY_MS));
          }
        }
        console.log(`[BG] All ${nonYad2Sources.length} non-Yad2 sources processed`);

        // Wait 10 min then run stall recovery for any orphaned batches
        await new Promise((r) => setTimeout(r, 10 * 60 * 1000));
        await runStallRecovery();
      })()
    );
    summary.non_yad2_fired = nonYad2Sources.length;

    // ── Freshness check: also background ──
    EdgeRuntime.waitUntil(runFreshnessCheckInBackground());

    console.log(`Nightly scrape: returning immediately. ${nonYad2Sources.length} background tasks fired.`);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Nightly scrape fatal error:", errMsg);
    return new Response(JSON.stringify({ ...summary, fatal_error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
