/**
 * BuyWiseIsrael — Nightly Scrape Scheduler
 *
 * Runs weekly (Friday 2 AM Israel time via pg_cron).
 *
 * Strategy:
 *   - Non-Yad2 sources (agency websites, Madlan): discover + import directly
 *   - Yad2 sources: enqueue to yad2_scrape_queue with staggered timing
 *     The yad2-retry-runner (every 30 min) handles actual scraping + retries
 *
 * This separation is critical because:
 *   - Yad2 discovery is async (EdgeRuntime.waitUntil) — no synchronous result
 *   - Yad2 is blocked by ShieldSquare — needs smart retries + CAPTCHA handling
 *   - Staggered timing prevents multiple agencies hitting Yad2 simultaneously
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
const YAD2_RUNNER_URL = () =>
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/yad2-retry-runner?force=true`;
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
  const day = d.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // offset to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Enqueue Yad2 sources into yad2_scrape_queue with staggered timing.
 * Uses UNIQUE(agency_source_id, week_start) so safe to call multiple times.
 */
async function enqueueYad2Sources(
  sb: ReturnType<typeof supabaseAdmin>,
  yad2Sources: any[]
): Promise<{ enqueued: number; skipped: number }> {
  const weekStart = getWeekStart(new Date());
  const BASE_GAP_MINUTES = 35;
  const JITTER_MINUTES = 20;

  let enqueued = 0;
  let skipped = 0;

  for (let i = 0; i < yad2Sources.length; i++) {
    const source = yad2Sources[i];
    // Stagger: first agency fires now, each subsequent one adds 35 + 0-20 min
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
        ignoreDuplicates: true, // Don't overwrite if already queued this week
      }
    );

    if (error) {
      console.warn(`Failed to enqueue Yad2 source ${source.id}: ${error.message}`);
      skipped++;
    } else {
      console.log(
        `Yad2 queued: ${source.source_url} (agency: ${source.agencies?.name}) in ${delayMinutes} min`
      );
      enqueued++;
    }
  }

  return { enqueued, skipped };
}

/** Process a non-Yad2 job to completion */
async function processJobToCompletion(jobId: string, maxBatches = 20): Promise<{
  succeeded: number;
  failed: number;
  batches: number;
}> {
  let totalSucceeded = 0;
  let totalFailed = 0;
  let batches = 0;

  for (let i = 0; i < maxBatches; i++) {
    const result = await callImport({ action: "process_batch", job_id: jobId });
    batches++;
    totalSucceeded += result.succeeded || 0;
    totalFailed += result.failed || 0;
    if (result.status === "completed" || (result.remaining || 0) === 0) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { succeeded: totalSucceeded, failed: totalFailed, batches };
}

/** Re-scrape listings not checked in 48h */
async function runFreshnessCheck(sb: ReturnType<typeof supabaseAdmin>): Promise<{
  checked: number;
  removed: number;
  priceChanges: number;
}> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: staleListings } = await sb
    .from("properties")
    .select("id, source_url, price")
    .not("source_url", "is", null)
    .eq("is_published", true)
    .or(`source_last_checked_at.is.null,source_last_checked_at.lt.${cutoff}`)
    .neq("source_status", "removed")
    .limit(100);

  if (!staleListings?.length) return { checked: 0, removed: 0, priceChanges: 0 };

  console.log(`Freshness check: ${staleListings.length} listings to check`);

  const items = staleListings.map((l: any) => ({
    property_id: l.id,
    source_url: l.source_url,
    current_price: l.price,
  }));

  const result = await callImport({ action: "check_existing", agency_id: "system", items });
  return {
    checked: result.checked || 0,
    removed: result.removed?.length || 0,
    priceChanges: result.price_changes?.length || 0,
  };
}

// ── Main Handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const isServiceKey = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const isCronSecret = token === Deno.env.get("CRON_SECRET");

  // Also allow authenticated admin users (for the admin UI "Run full sync" button)
  let isAdminUser = false;
  if (!isServiceKey && !isCronSecret && token) {
    try {
      const sb = supabaseAdmin();
      const { data: { user } } = await sb.auth.getUser(token);
      if (user) {
        const { data: roleRow } = await sb
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        isAdminUser = !!roleRow;
      }
    } catch (_) { /* not a valid JWT */ }
  }

  if (!isServiceKey && !isCronSecret && !isAdminUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sb = supabaseAdmin();
  const startTime = Date.now();
  const summary: Record<string, unknown> = {
    started_at: new Date().toISOString(),
    yad2_enqueued: 0,
    yad2_skipped: 0,
    sources_processed: 0,
    sources_failed: 0,
    total_new_listings: 0,
    total_failed_listings: 0,
    freshness: null,
    errors: [] as string[],
  };

  try {
    // Load all active agency sources
    const { data: sources, error: sourcesErr } = await sb
      .from("agency_sources")
      .select("*, agencies(id, name)")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .order("last_synced_at", { ascending: true, nullsFirst: true });

    if (sourcesErr) throw new Error(`Failed to load agency sources: ${sourcesErr.message}`);
    if (!sources?.length) {
      return new Response(
        JSON.stringify({ ...summary, message: "No active agency sources configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Nightly scrape: ${sources.length} total sources`);

    // ── Split Yad2 vs non-Yad2 ───────────────────────────────────────────────
    const yad2Sources = sources.filter(
      (s: any) => detectSourceType(s.source_url) === "yad2"
    );
    const nonYad2Sources = sources.filter(
      (s: any) => detectSourceType(s.source_url) !== "yad2"
    );

    console.log(`  ${yad2Sources.length} Yad2 sources → queuing for retry-runner`);
    console.log(`  ${nonYad2Sources.length} non-Yad2 sources → direct scrape`);

    // ── Enqueue Yad2 sources then immediately kick the retry runner ──────────
    if (yad2Sources.length > 0) {
      // Clear any stale queue entries from this week first so we always get a fresh run
      await sb.from("yad2_scrape_queue").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const queueResult = await enqueueYad2Sources(sb, yad2Sources);
      summary.yad2_enqueued = queueResult.enqueued;
      summary.yad2_skipped = queueResult.skipped;
      console.log(
        `Yad2: ${queueResult.enqueued} enqueued, ${queueResult.skipped} skipped`
      );

      // Immediately trigger the retry runner with force=true so Yad2 runs NOW
      if (queueResult.enqueued > 0) {
        fetch(YAD2_RUNNER_URL(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_KEY()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }).then(() => console.log("yad2-retry-runner triggered"))
          .catch((e) => console.warn("Failed to trigger yad2-retry-runner:", e.message));
      }
    }

    // ── Direct scrape non-Yad2 sources ───────────────────────────────────────
    for (const source of nonYad2Sources) {
      const sourceType = detectSourceType(source.source_url);
      try {
        console.log(
          `Processing [${sourceType}] ${source.source_url} (agency: ${source.agencies.name})`
        );

        const discoverBody = {
          action: "discover",
          source_type: sourceType,
          website_url: source.source_url,
          agency_id: source.agency_id,
          import_type: source.import_type || "resale",
        };

        const discoverResult = await callImport(discoverBody);

        if (discoverResult.error) throw new Error(discoverResult.error);

        let succeeded = 0;
        let failed = 0;

        if (discoverResult.job_id && (discoverResult.new_urls || discoverResult.total_urls || 0) > 0) {
          const processResult = await processJobToCompletion(discoverResult.job_id);
          succeeded = processResult.succeeded;
          failed = processResult.failed;
          console.log(`  → ${succeeded} new listings imported, ${failed} failed`);
        } else {
          console.log(`  → No new URLs found`);
        }

        // Update source sync state — only reset consecutive_failures for real successes
        await sb.from("agency_sources").update({
          last_synced_at: new Date().toISOString(),
          last_sync_job_id: discoverResult.job_id || null,
          last_sync_listings_found: discoverResult.new_urls || discoverResult.total_urls || 0,
          consecutive_failures: 0,
          last_failure_reason: null,
        }).eq("id", source.id);

        (summary.sources_processed as number)++;
        (summary.total_new_listings as number) += succeeded;
        (summary.total_failed_listings as number) += failed;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Source ${source.id} failed: ${errMsg}`);

        const newFailureCount = (source.consecutive_failures || 0) + 1;
        const shouldDisable = newFailureCount >= 5;

        await sb.from("agency_sources").update({
          consecutive_failures: newFailureCount,
          last_failure_reason: errMsg.slice(0, 500),
          is_active: shouldDisable ? false : source.is_active,
        }).eq("id", source.id);

        if (shouldDisable) {
          console.warn(`Source ${source.id} disabled after ${newFailureCount} consecutive failures`);
        }

        (summary.sources_failed as number)++;
        (summary.errors as string[]).push(
          `[${sourceType}] ${source.source_url}: ${errMsg.slice(0, 200)}`
        );
      }

      // Pace between sources
      await new Promise((r) => setTimeout(r, 3000));
    }

    // ── Freshness check ───────────────────────────────────────────────────────
    try {
      const freshnessResult = await runFreshnessCheck(sb);
      summary.freshness = freshnessResult;
      console.log(
        `Freshness: checked=${freshnessResult.checked}, removed=${freshnessResult.removed}, price_changes=${freshnessResult.priceChanges}`
      );
    } catch (err: unknown) {
      console.error("Freshness check failed:", err);
      (summary.errors as string[]).push(
        `Freshness check failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    summary.completed_at = new Date().toISOString();
    summary.duration_seconds = Math.round((Date.now() - startTime) / 1000);

    console.log("Nightly scrape complete:", JSON.stringify(summary));

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error("Nightly scrape fatal error:", errMsg);
    return new Response(
      JSON.stringify({ ...summary, fatal_error: errMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
