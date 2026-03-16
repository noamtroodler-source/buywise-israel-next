import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find agencies with auto-sync enabled
    const { data: agencies, error: agencyErr } = await sb
      .from("agencies")
      .select("id, auto_sync_url, last_sync_at")
      .eq("auto_sync_enabled", true)
      .not("auto_sync_url", "is", null);

    if (agencyErr) throw new Error(`Failed to fetch agencies: ${agencyErr.message}`);
    if (!agencies || agencies.length === 0) {
      return new Response(JSON.stringify({ synced: 0, message: "No agencies with auto-sync enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Auto-sync: ${agencies.length} agencies to check`);
    let totalSynced = 0;

    for (const agency of agencies) {
      try {
        console.log(`Syncing agency ${agency.id}: ${agency.auto_sync_url}`);

        // Call the import function with discover action
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
              agency_id: agency.id,
              website_url: agency.auto_sync_url,
              import_type: "resale",
            }),
          }
        );

        const discoverData = await discoverRes.json();

        if (!discoverRes.ok || discoverData.error) {
          console.warn(`Sync discover failed for agency ${agency.id}: ${discoverData.error || discoverRes.status}`);
          continue;
        }

        const newUrls = discoverData.new_urls || 0;
        console.log(`Agency ${agency.id}: ${newUrls} new URLs found`);

        // If new URLs found, process them
        if (discoverData.job_id && newUrls > 0) {
          // Mark the job as incremental
          await sb.from("import_jobs").update({ is_incremental: true }).eq("id", discoverData.job_id);

          // Process all batches
          let remaining = newUrls;
          while (remaining > 0) {
            const processRes = await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/import-agency-listings`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "process_batch", job_id: discoverData.job_id }),
              }
            );

            const processData = await processRes.json();
            if (!processRes.ok || processData.error) {
              console.warn(`Sync process failed for agency ${agency.id}: ${processData.error || processRes.status}`);
              break;
            }

            remaining = processData.remaining || 0;
            totalSynced += processData.succeeded || 0;

            if (processData.status === "completed") break;
          }
        }

        // Update last_sync_at
        await sb.from("agencies").update({ last_sync_at: new Date().toISOString() }).eq("id", agency.id);
      } catch (err) {
        console.error(`Sync error for agency ${agency.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ synced: totalSynced, agencies_checked: agencies.length }),
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
