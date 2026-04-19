import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conflict_id } = await req.json();
    if (!conflict_id) {
      return new Response(JSON.stringify({ error: "conflict_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load conflict + both agencies
    const { data: conflict, error: cErr } = await supabase
      .from("cross_agency_conflicts")
      .select("*")
      .eq("id", conflict_id)
      .single();

    if (cErr || !conflict) {
      return new Response(JSON.stringify({ error: "Conflict not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load both agencies
    const agencyIds = [conflict.existing_agency_id, conflict.attempted_agency_id].filter(Boolean);
    const { data: agencies } = await supabase
      .from("agencies")
      .select("id, name, email, notify_email")
      .in("id", agencyIds);

    const existingAgency = agencies?.find((a) => a.id === conflict.existing_agency_id);
    const attemptedAgency = agencies?.find((a) => a.id === conflict.attempted_agency_id);

    // Load existing property for context
    const { data: property } = await supabase
      .from("properties")
      .select("address, city, price, bedrooms, size_sqm")
      .eq("id", conflict.existing_property_id)
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error("Missing Resend credentials — skipping email send");
      return new Response(JSON.stringify({ ok: false, reason: "missing_credentials" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const matchDetails = (conflict.match_details || {}) as Record<string, unknown>;
    const propLine = property
      ? `${property.address || ""}, ${property.city || ""} — ${property.bedrooms ?? "?"}br / ${property.size_sqm ?? "?"}sqm / ₪${(property.price || 0).toLocaleString()}`
      : `${matchDetails.address || ""}, ${matchDetails.city || ""}`;

    const emailsSent: string[] = [];

    // Email to EXISTING agency (the owner)
    if (existingAgency?.email && existingAgency.notify_email !== false) {
      const html = `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0F172A; margin-bottom: 16px;">⚠️ Listing ownership conflict</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${existingAgency.name},
          </p>
          <p style="color: #475569; line-height: 1.6;">
            Another agency (<strong>${attemptedAgency?.name || "Unknown"}</strong>) just attempted to import a listing that matches one of yours on BuyWise.
          </p>
          <div style="background: #F1F5F9; border-left: 4px solid #3B82F6; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #0F172A;">Disputed listing:</strong><br/>
            <span style="color: #475569;">${propLine}</span><br/>
            <span style="color: #94A3B8; font-size: 13px;">Match confidence: ${conflict.similarity_score}/100</span>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            We've blocked the duplicate import. Please review the conflict and confirm ownership — or mark it as a co-listing if you both legitimately represent it.
          </p>
          <a href="https://buywise-israel-next.lovable.app/agency/conflicts?tab=cross-agency" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 8px;">
            Review conflict
          </a>
          <p style="color: #94A3B8; font-size: 13px; margin-top: 32px; line-height: 1.6;">
            BuyWise — Cross-agency duplicate detection
          </p>
        </div>
      `;
      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "BuyWise <notifications@buywise-israel-next.lovable.app>",
          to: [existingAgency.email],
          subject: `Ownership conflict on ${matchDetails.address || "a listing"}`,
          html,
        }),
      });
      if (res.ok) emailsSent.push(existingAgency.email);
      else console.error(`Failed to email existing agency:`, await res.text());
    }

    // Email to ATTEMPTED agency (the importer)
    if (attemptedAgency?.email && attemptedAgency.notify_email !== false) {
      const html = `
        <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #0F172A; margin-bottom: 16px;">Import skipped: listing already on platform</h2>
          <p style="color: #475569; line-height: 1.6;">
            Hi ${attemptedAgency.name},
          </p>
          <p style="color: #475569; line-height: 1.6;">
            A listing you tried to import is already published on BuyWise by another agency (<strong>${existingAgency?.name || "Unknown"}</strong>). We've skipped the import to prevent a duplicate.
          </p>
          <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; margin: 20px 0; border-radius: 4px;">
            <strong style="color: #0F172A;">Listing:</strong><br/>
            <span style="color: #475569;">${propLine}</span><br/>
            <span style="color: #94A3B8; font-size: 13px;">Source URL: ${conflict.attempted_source_url}</span>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            If you believe this listing belongs to you (e.g., transferred client, exclusive listing), please review the conflict so our team can resolve it.
          </p>
          <a href="https://buywise-israel-next.lovable.app/agency/conflicts?tab=cross-agency" style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-top: 8px;">
            Review conflict
          </a>
          <p style="color: #94A3B8; font-size: 13px; margin-top: 32px; line-height: 1.6;">
            BuyWise — Cross-agency duplicate detection
          </p>
        </div>
      `;
      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "BuyWise <notifications@buywise-israel-next.lovable.app>",
          to: [attemptedAgency.email],
          subject: `Listing import skipped — already on BuyWise`,
          html,
        }),
      });
      if (res.ok) emailsSent.push(attemptedAgency.email);
      else console.error(`Failed to email attempted agency:`, await res.text());
    }

    return new Response(
      JSON.stringify({ ok: true, emails_sent: emailsSent, conflict_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("notify-cross-agency-conflict error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
