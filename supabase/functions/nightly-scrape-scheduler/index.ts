/**
 * BuyWiseIsrael — Nightly Scrape Scheduler
 *
 * Runs nightly (called by a Supabase cron job or manually).
 * For each active agency_source, triggers an import job
 * through the existing import-agency-listings pipeline.
 *
 * Pipeline:
 *   1. Load all active agency_sources ordered by priority
 *   2. For each source, call import-agency-listings?action=discover
 *   3. For each resulting job, call process_batch until done
 *   4. Update agency_sources with sync state
 *   5. Run freshness check on stale listings (not seen in 48h)
 *   6. Report summary
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

// Detect source type from URL pattern
function detectSourceType(url: string): "yad2" | "madlan" | "website" {
  if (url.includes("yad2.co.il")) return "yad2";
  if (url.includes("madlan.co.il")) return "madlan";
  return "website";
}

// Source type → import action routing
function getDiscoverAction(sourceType: string, websiteUrl: string): Record<string, unknown> {
  if (sourceType === "yad2") {
    return {
      action: "discover",
      source_type: "yad2",
      website_url: websiteUrl,
    };
  }
  if (sourceType === "madlan") {
    return {
      action: "discover",
      source_type: "madlan",
      website_url: websiteUrl,
    };
  }
  return {
    action: "discover",
    source_type: "website",
    website_url: websiteUrl,
  };
}

// Process a job to completion (with safety limit)
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

    // Small pause between batches to avoid rate limits
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { succeeded: totalSucceeded, failed: totalFailed, batches };
}

// Run freshness check — re-scrape listings not checked in 48h
async function runFreshnessCheck(sb: ReturnType<typeof supabaseAdmin>): Promise<{
  checked: number;
  removed: number;
  priceChanges: number;
}> {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // Get listings that need freshness check
  const { data: staleListings } = await sb
    .from("properties")
    .select("id, source_url, price")
    .not("source_url", "is", null)
    .eq("is_published", true)
    .or(`source_last_checked_at.is.null,source_last_checked_at.lt.${cutoff}`)
    .neq("source_status", "removed")
    .limit(100); // Process max 100 per nightly run

  if (!staleListings?.length) return { checked: 0, removed: 0, priceChanges: 0 };

  console.log(`Freshness check: ${staleListings.length} listings to check`);

  const items = staleListings.map((l: any) => ({
    property_id: l.id,
    source_url: l.source_url,
    current_price: l.price,
  }));

  // Use existing check_existing endpoint
  const result = await callImport({
    action: "check_existing",
    agency_id: "system",
    items,
  });

  return {
    checked: result.checked || 0,
    removed: result.removed?.length || 0,
    priceChanges: result.price_changes?.length || 0,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify this is an authorized call (cron or admin)
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
  const startTime = Date.now();
  const summary: Record<string, unknown> = {
    started_at: new Date().toISOString(),
    sources_processed: 0,
    sources_failed: 0,
    total_new_listings: 0,
    total_failed_listings: 0,
    freshness: null,
    errors: [] as string[],
  };

  try {
    // Load all active agency sources, ordered by priority then last synced
    const { data: sources, error: sourcesErr } = await sb
      .from("agency_sources")
      .select("*, agencies!inner(id, name, is_active)")
      .eq("is_active", true)
      .eq("agencies.is_active", true)
      .order("priority", { ascending: true })
      .order("last_synced_at", { ascending: true, nullsFirst: true });

    if (sourcesErr) throw new Error(`Failed to load agency sources: ${sourcesErr.message}`);
    if (!sources?.length) {
      return new Response(
        JSON.stringify({ ...summary, message: "No active agency sources configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Nightly scrape: ${sources.length} sources to process`);

    // Process each source
    for (const source of sources) {
      try {
        console.log(
          `Processing [${source.source_type}] ${source.source_url} (agency: ${source.agencies.name})`
        );

        const discoverBody = {
          ...getDiscoverAction(source.source_type, source.source_url),
          agency_id: source.agency_id,
          import_type: "resale",
        };

        const discoverResult = await callImport(discoverBody);

        if (discoverResult.error) {
          throw new Error(discoverResult.error);
        }

        let succeeded = 0;
        let failed = 0;

        if (discoverResult.job_id && (discoverResult.new_urls || 0) > 0) {
          // For Yad2 async jobs, wait for discovery to complete first
          if (discoverResult.started_async) {
            console.log(`Yad2 async discovery started for job ${discoverResult.job_id}, waiting...`);
            await new Promise((r) => setTimeout(r, 15000)); // Wait 15s for Yad2 discovery
          }

          const processResult = await processJobToCompletion(discoverResult.job_id);
          succeeded = processResult.succeeded;
          failed = processResult.failed;

          console.log(
            `  → ${succeeded} new listings imported, ${failed} failed`
          );
        } else {
          console.log(`  → No new URLs found`);
        }

        // Update source sync state
        await sb
          .from("agency_sources")
          .update({
            last_synced_at: new Date().toISOString(),
            last_sync_job_id: discoverResult.job_id || null,
            last_sync_listings_found: discoverResult.new_urls || 0,
            consecutive_failures: 0,
            last_failure_reason: null,
          })
          .eq("id", source.id);

        (summary.sources_processed as number)++;
        (summary.total_new_listings as number) += succeeded;
        (summary.total_failed_listings as number) += failed;
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`Source ${source.id} failed: ${errMsg}`);

        // Increment failure count; disable after 5 consecutive failures
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

        if (shouldDisable) {
          console.warn(
            `Source ${source.id} disabled after ${newFailureCount} consecutive failures`
          );
        }

        (summary.sources_failed as number)++;
        (summary.errors as string[]).push(
          `[${source.source_type}] ${source.source_url}: ${errMsg.slice(0, 200)}`
        );
      }

      // Pace between sources to avoid overwhelming APIs
      await new Promise((r) => setTimeout(r, 3000));
    }

    // Run freshness check after scraping
    try {
      const freshnessResult = await runFreshnessCheck(sb);
      summary.freshness = freshnessResult;
      console.log(
        `Freshness: checked=${freshnessResult.checked}, removed=${freshnessResult.removed}, price_changes=${freshnessResult.priceChanges}`
      );
    } catch (err: unknown) {
      console.error("Freshness check failed:", err);
      (summary.errors as string[]).push(`Freshness check failed: ${err instanceof Error ? err.message : String(err)}`);
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
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
