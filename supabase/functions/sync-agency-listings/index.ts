// sync-agency-listings — Multi-source nightly sync (Phase 3)
// Iterates active rows in agency_sources by content priority (Website → Madlan → Yad2),
// processes them sequentially per agency so agency-owned content becomes the base record,
// and tracks per-source health (consecutive_failures, last_failure_reason).
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOURCE_RANK: Record<string, number> = {
  website: 1,
  madlan: 2,
  yad2: 3,
};

function detectSourceType(url: string): "yad2" | "madlan" | "website" {
  const u = url.toLowerCase();
  if (u.includes("yad2.co.il")) return "yad2";
  if (u.includes("madlan.co.il")) return "madlan";
  return "website";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Pull all active sources, ordered by agency then source priority
    const { data: sources, error: srcErr } = await sb
      .from("agency_sources")
      .select("id, agency_id, source_type, source_url, priority, consecutive_failures")
      .eq("is_active", true)
      .order("agency_id", { ascending: true })
      .order("priority", { ascending: true });

    if (srcErr) throw new Error(`Failed to fetch agency_sources: ${srcErr.message}`);
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active sources found", sources_processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by agency so we process each agency's sources sequentially
    const byAgency = new Map<string, typeof sources>();
    for (const s of sources) {
      if (!s.agency_id) continue;
      const arr = byAgency.get(s.agency_id) || [];
      arr.push(s);
      byAgency.set(s.agency_id, arr);
    }

    // Sort each agency's sources by content priority (website → madlan → yad2)
    for (const [aid, arr] of byAgency) {
      arr.sort((a, b) => {
        const rankA = SOURCE_RANK[a.source_type] ?? 99;
        const rankB = SOURCE_RANK[b.source_type] ?? 99;
        return rankA - rankB;
      });
      byAgency.set(aid, arr);
    }

    console.log(`Auto-sync: ${byAgency.size} agencies, ${sources.length} total active sources`);

    let totalNewListings = 0;
    let sourcesProcessed = 0;
    let sourcesFailed = 0;

    for (const [agencyId, agencySources] of byAgency) {
      // Sequential per agency — website first, then Madlan/Yad2 enrichment
      for (const source of agencySources) {
        sourcesProcessed++;
        try {
          console.log(
            `Syncing source ${source.id} (${source.source_type}) for agency ${agencyId}`
          );

          // ─── Discover ─────────────────────────────────────────────
          const discoverRes = await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-agency-listings`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "discover",
                agency_id: agencyId,
                website_url: source.source_url,
                source_type: source.source_type,
                import_type: "both",
              }),
            }
          );

          const discoverData = await discoverRes.json();

          if (!discoverRes.ok || discoverData.error) {
            const reason = discoverData.error || `HTTP ${discoverRes.status}`;
            const newFailureCount = (source.consecutive_failures ?? 0) + 1;
            // Auto-pause sources after 5+ consecutive failures so we stop wasting
            // scrape cycles on dead URLs. Agency admin gets notified separately.
            const shouldAutoPause = newFailureCount >= 5;
            await sb
              .from("agency_sources")
              .update({
                consecutive_failures: newFailureCount,
                last_failure_reason: String(reason).slice(0, 500),
                is_active: shouldAutoPause ? false : undefined,
                notes: shouldAutoPause
                  ? `Auto-paused after ${newFailureCount} consecutive failures on ${new Date().toISOString().slice(0, 10)}. Last error: ${String(reason).slice(0, 200)}`
                  : undefined,
                updated_at: new Date().toISOString(),
              })
              .eq("id", source.id);
            sourcesFailed++;
            if (shouldAutoPause) {
              console.warn(`Auto-paused source ${source.id} after ${newFailureCount} failures: ${reason}`);
            } else {
              console.warn(`Discover failed for source ${source.id} (${newFailureCount}/5): ${reason}`);
            }
            continue;
          }

          const newUrls = discoverData.new_urls || 0;
          const jobId = discoverData.job_id;

          // ─── Process batch(es) ────────────────────────────────────
          let succeededThisSource = 0;
          if (jobId && newUrls > 0) {
            await sb
              .from("import_jobs")
              .update({ is_incremental: true })
              .eq("id", jobId);

            let remaining = newUrls;
            let safety = 0;
            while (remaining > 0 && safety < 50) {
              safety++;
              const processRes = await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-agency-listings`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ action: "process_batch", job_id: jobId }),
                }
              );

              const processData = await processRes.json();
              if (!processRes.ok || processData.error) {
                console.warn(
                  `Process batch failed for source ${source.id}: ${processData.error || processRes.status}`
                );
                break;
              }
              succeededThisSource += processData.succeeded || 0;
              remaining = processData.remaining || 0;
              if (processData.status === "completed") break;
            }
          }

          totalNewListings += succeededThisSource;

          // ─── Mark source healthy ──────────────────────────────────
          await sb
            .from("agency_sources")
            .update({
              consecutive_failures: 0,
              last_failure_reason: null,
              last_synced_at: new Date().toISOString(),
              last_sync_job_id: jobId || null,
              last_sync_listings_found: succeededThisSource,
              updated_at: new Date().toISOString(),
            })
            .eq("id", source.id);
        } catch (err) {
          sourcesFailed++;
          const reason = err instanceof Error ? err.message : String(err);
          const newFailureCount = (source.consecutive_failures ?? 0) + 1;
          const shouldAutoPause = newFailureCount >= 5;
          console.error(`Source ${source.id} error (${newFailureCount}/5):`, reason);
          await sb
            .from("agency_sources")
            .update({
              consecutive_failures: newFailureCount,
              last_failure_reason: reason.slice(0, 500),
              is_active: shouldAutoPause ? false : undefined,
              notes: shouldAutoPause
                ? `Auto-paused after ${newFailureCount} consecutive failures on ${new Date().toISOString().slice(0, 10)}. Last error: ${reason.slice(0, 200)}`
                : undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", source.id);
        }
      }

      // Update agency's overall last_sync timestamp
      await sb
        .from("agencies")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", agencyId);
    }

    // ─── Notify on broken sources (3+ consecutive failures) ─────────
    try {
      await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-source-failure`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
    } catch (err) {
      console.warn("notify-source-failure invocation failed:", err);
    }

    // ─── Send ONE conflict digest per agency (replaces per-conflict spam) ─
    try {
      const digestRes = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-conflict-digest`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );
      const digestJson = await digestRes.json().catch(() => ({}));
      console.log("Conflict digest result:", digestJson);
    } catch (err) {
      console.warn("send-conflict-digest invocation failed:", err);
    }

    return new Response(
      JSON.stringify({
        agencies_processed: byAgency.size,
        sources_processed: sourcesProcessed,
        sources_failed: sourcesFailed,
        total_new_listings: totalNewListings,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("sync-agency-listings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
