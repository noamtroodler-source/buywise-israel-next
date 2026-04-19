// send-conflict-digest — sends ONE summary email per agency listing all
// pending cross-agency conflicts they're involved in. Designed to be called
// by sync-agency-listings at the end of a nightly run so agencies get one
// digest instead of N separate notifications.
//
// Idempotency: tracks the last digest timestamp per agency on
// agencies.last_conflict_digest_at and only includes conflicts created
// since then. If no new conflicts since the last digest, skips the send.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConflictRow {
  id: string;
  similarity_score: number;
  existing_property_id: string;
  existing_agency_id: string | null;
  attempted_agency_id: string;
  attempted_source_url: string;
  match_details: Record<string, unknown> | null;
  created_at: string;
}

interface AgencyRow {
  id: string;
  name: string;
  email: string | null;
  notify_email: boolean | null;
  last_conflict_digest_at: string | null;
}

async function sendDigestEmail(
  toEmail: string,
  agencyName: string,
  conflicts: Array<ConflictRow & { otherAgencyName: string; propertyTitle: string }>,
): Promise<boolean> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
    console.warn("send-conflict-digest: missing RESEND_API_KEY/LOVABLE_API_KEY — skipping send");
    return false;
  }

  const subject = `${conflicts.length} new ${conflicts.length === 1 ? "listing conflict" : "listing conflicts"} need your review`;

  const rows = conflicts
    .map((c) => {
      const m = (c.match_details || {}) as Record<string, unknown>;
      const propLine = c.propertyTitle ||
        `${m.address || "Unknown address"}${m.city ? ", " + m.city : ""}`;
      return `
        <tr>
          <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 13px;">
            <div style="font-weight: 500; color: #0f172a;">${propLine}</div>
            <div style="color: #64748b; font-size: 12px; margin-top: 2px;">
              vs <strong>${c.otherAgencyName}</strong> · ${c.similarity_score}% match
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; color: #111;">
      <h2 style="font-size: 20px; margin: 0 0 12px;">Daily conflict digest — ${agencyName}</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #475569;">
        We detected <strong>${conflicts.length} ${conflicts.length === 1 ? "new listing conflict" : "new listing conflicts"}</strong> involving your agency during the last sync.
        Review and confirm ownership for each — or mark them as legitimate co-listings.
      </p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 8px; overflow: hidden;">
        <tbody>${rows}</tbody>
      </table>
      <a href="https://buywise-israel-next.lovable.app/agency/conflicts?tab=cross-agency"
         style="display: inline-block; background: #0f172a; color: #fff; padding: 12px 22px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 500; margin-top: 8px;">
        Review all conflicts →
      </a>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 32px; line-height: 1.6;">
        You're getting this because you're listed as the admin for ${agencyName}. We bundle conflicts into one daily digest to keep your inbox quiet.
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
        from: "BuyWise <onboarding@resend.dev>",
        to: [toEmail],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.warn(`Digest email send failed ${res.status}:`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Digest email send error:", err);
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

    // Optional: caller can scope to a specific agency. If absent, scan all
    // agencies with pending conflicts since their last digest.
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const targetAgencyId: string | undefined = body?.agency_id;

    // Fetch all PENDING conflicts (we'll filter per-agency by last_digest_at below)
    let query = sb
      .from("cross_agency_conflicts")
      .select("id, similarity_score, existing_property_id, existing_agency_id, attempted_agency_id, attempted_source_url, match_details, created_at")
      .eq("status", "pending");

    if (targetAgencyId) {
      query = query.or(`existing_agency_id.eq.${targetAgencyId},attempted_agency_id.eq.${targetAgencyId}`);
    }

    const { data: conflicts, error: cErr } = await query.limit(500);
    if (cErr) throw new Error(`Failed to fetch conflicts: ${cErr.message}`);
    if (!conflicts || conflicts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending conflicts", digests_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group conflicts by each involved agency (an agency can appear on either side)
    const byAgency = new Map<string, ConflictRow[]>();
    for (const c of conflicts as ConflictRow[]) {
      for (const aid of [c.existing_agency_id, c.attempted_agency_id]) {
        if (!aid) continue;
        if (targetAgencyId && aid !== targetAgencyId) continue;
        const arr = byAgency.get(aid) || [];
        arr.push(c);
        byAgency.set(aid, arr);
      }
    }

    if (byAgency.size === 0) {
      return new Response(
        JSON.stringify({ message: "No agencies to notify", digests_sent: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load all involved agencies (and the "other" agency on each conflict for naming)
    const allAgencyIds = Array.from(
      new Set(
        conflicts.flatMap((c) => [c.existing_agency_id, c.attempted_agency_id]).filter(Boolean)
      )
    );
    const { data: agencies } = await sb
      .from("agencies")
      .select("id, name, email, notify_email, last_conflict_digest_at")
      .in("id", allAgencyIds as string[]);
    const agencyMap = new Map<string, AgencyRow>();
    for (const a of (agencies || []) as AgencyRow[]) agencyMap.set(a.id, a);

    // Load property titles in one shot
    const propIds = Array.from(new Set(conflicts.map((c) => c.existing_property_id)));
    const { data: props } = await sb
      .from("properties")
      .select("id, title, address, city")
      .in("id", propIds);
    const propMap = new Map<string, { title: string }>();
    for (const p of props || []) {
      propMap.set(p.id, {
        title: p.title || `${p.address || ""}${p.city ? ", " + p.city : ""}` || "Untitled",
      });
    }

    let digestsSent = 0;
    const skipped: string[] = [];

    for (const [agencyId, agencyConflicts] of byAgency) {
      const agency = agencyMap.get(agencyId);
      if (!agency || !agency.email || agency.notify_email === false) {
        skipped.push(agencyId);
        continue;
      }

      // Filter to only conflicts created AFTER this agency's last digest timestamp
      const lastDigest = agency.last_conflict_digest_at
        ? new Date(agency.last_conflict_digest_at).getTime()
        : 0;
      const newConflicts = agencyConflicts.filter(
        (c) => new Date(c.created_at).getTime() > lastDigest
      );
      if (newConflicts.length === 0) {
        skipped.push(agencyId);
        continue;
      }

      // Annotate each conflict with the OTHER agency name + property title
      const annotated = newConflicts.map((c) => {
        const otherId = c.existing_agency_id === agencyId
          ? c.attempted_agency_id
          : c.existing_agency_id;
        const other = otherId ? agencyMap.get(otherId) : null;
        const prop = propMap.get(c.existing_property_id);
        return {
          ...c,
          otherAgencyName: other?.name || "Unknown agency",
          propertyTitle: prop?.title || "Untitled listing",
        };
      });

      const sent = await sendDigestEmail(agency.email, agency.name, annotated);

      if (sent) {
        digestsSent++;
        // Stamp the agency so we don't include these conflicts in the next digest
        await sb
          .from("agencies")
          .update({ last_conflict_digest_at: new Date().toISOString() })
          .eq("id", agencyId);
      }
    }

    return new Response(
      JSON.stringify({
        agencies_evaluated: byAgency.size,
        digests_sent: digestsSent,
        skipped: skipped.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-conflict-digest error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
