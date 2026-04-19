// notify-source-failure — Sends agency-admin notifications (in-app + email)
// when an agency_source has failed 3+ consecutive sync attempts.
// Idempotent: only notifies once per failure-streak by checking for an existing
// unread notification of the same source.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SOURCE_LABELS: Record<string, string> = {
  yad2: "Yad2",
  madlan: "Madlan",
  website: "Agency Website",
};

async function sendFailureEmail(
  toEmail: string,
  agencyName: string,
  sourceType: string,
  sourceUrl: string,
  failures: number,
  lastError: string,
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("Email skipped: RESEND_API_KEY or LOVABLE_API_KEY missing");
    return false;
  }

  const label = SOURCE_LABELS[sourceType] || sourceType;
  const subject = `⚠️ ${label} listing source needs attention — ${agencyName}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #111;">
      <h2 style="font-size: 20px; margin: 0 0 16px;">A listing source needs your attention</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #333;">
        Hi ${agencyName},
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #333;">
        Your <strong>${label}</strong> source has failed to sync <strong>${failures} times in a row</strong>. We've paused alerts to avoid spam — please check the source URL or update it.
      </p>
      <div style="background: #f6f7f9; border-left: 3px solid #e11d48; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Source URL</div>
        <a href="${sourceUrl}" style="color: #2563eb; word-break: break-all; font-size: 13px;">${sourceUrl}</a>
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin: 12px 0 4px;">Last error</div>
        <code style="font-size: 12px; color: #111;">${lastError}</code>
      </div>
      <a href="https://buywise-israel-next.lovable.app/agency/sources"
         style="display: inline-block; background: #111; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px;">
        Manage sources
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        You're receiving this because you're listed as the admin for ${agencyName}.
      </p>
    </div>
  `;

  try {
    const res = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "BuyWise Israel <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`Resend send failed (${res.status}): ${text.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Resend error:", err instanceof Error ? err.message : err);
    return false;
  }
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

    const { data: failing, error } = await sb
      .from("agency_sources")
      .select("id, agency_id, source_type, source_url, consecutive_failures, last_failure_reason")
      .gte("consecutive_failures", 3)
      .eq("is_active", true);

    if (error) throw new Error(error.message);
    if (!failing || failing.length === 0) {
      return new Response(
        JSON.stringify({ notified: 0, emailed: 0, message: "No failing sources" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let notified = 0;
    let emailed = 0;

    for (const src of failing) {
      if (!src.agency_id) continue;

      // Idempotency: skip if there's already an unread "source_failure" notification
      const { data: existing } = await sb
        .from("agency_notifications")
        .select("id")
        .eq("agency_id", src.agency_id)
        .eq("type", "source_failure")
        .eq("is_read", false)
        .ilike("action_url", `%${src.id}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Look up agency for email + name
      const { data: agency } = await sb
        .from("agencies")
        .select("name, email, notify_email")
        .eq("id", src.agency_id)
        .maybeSingle();

      const label = SOURCE_LABELS[src.source_type] || src.source_type;
      const title = `Source failing: ${label}`;
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

      // Send email if agency has one and notifications are enabled
      if (agency?.email && agency.notify_email !== false) {
        const ok = await sendFailureEmail(
          agency.email,
          agency.name || "your agency",
          src.source_type,
          src.source_url,
          src.consecutive_failures,
          src.last_failure_reason || "unknown",
        );
        if (ok) emailed++;
      }
    }

    return new Response(
      JSON.stringify({ notified, emailed, checked: failing.length }),
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
