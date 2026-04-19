// notify-source-failure — Sends agency-admin notifications when an agency_source
// has failed 3+ consecutive sync attempts. Idempotent: only notifies once per
// failure-streak by checking for an existing unread notification of the same source.
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

    const { data: failing, error } = await sb
      .from("agency_sources")
      .select("id, agency_id, source_type, source_url, consecutive_failures, last_failure_reason")
      .gte("consecutive_failures", 3)
      .eq("is_active", true);

    if (error) throw new Error(error.message);
    if (!failing || failing.length === 0) {
      return new Response(
        JSON.stringify({ notified: 0, message: "No failing sources" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let notified = 0;
    for (const src of failing) {
      if (!src.agency_id) continue;

      // Idempotency: skip if there's already an unread "source_failure" notification
      // for this source.
      const { data: existing } = await sb
        .from("agency_notifications")
        .select("id")
        .eq("agency_id", src.agency_id)
        .eq("type", "source_failure")
        .eq("is_read", false)
        .ilike("action_url", `%${src.id}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const title = `Source failing: ${src.source_type}`;
      const message = `${src.consecutive_failures} consecutive failures. Last error: ${
        (src.last_failure_reason || "unknown").slice(0, 140)
      }`;

      const { error: insErr } = await sb.from("agency_notifications").insert({
        agency_id: src.agency_id,
        type: "source_failure",
        title,
        message,
        action_url: `/agency/sources?source=${src.id}`,
      });
      if (!insErr) notified++;
    }

    return new Response(
      JSON.stringify({ notified, checked: failing.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-source-failure error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
