// Phase 4: audit-and-enrich-listings
// Runs a quality audit + auto-enrichment pass over all properties belonging to one agency.
// Background-executed via EdgeRuntime.waitUntil so admin UI doesn't block.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const BodySchema = z.object({
  agency_id: z.string().uuid(),
  property_ids: z.array(z.string().uuid()).optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
});

type Property = {
  id: string;
  description: string | null;
  ai_english_description: string | null;
  price: number | null;
  size_sqm: number | null;
  bedrooms: number | null;
  address: string | null;
  city: string | null;
  images: string[] | null;
  agent_id: string | null;
  year_built: number | null;
  condition: string | null;
  parking: number | null;
  source_last_checked_at: string | null;
  ai_suggestions: Record<string, unknown> | null;
};

type Agent = {
  id: string;
  name: string | null;
  phone: string | null;
};

const containsHebrew = (s: string | null | undefined) =>
  !!s && /[\u0590-\u05FF]/.test(s);

const looksLowQuality = (s: string | null | undefined) => {
  if (!s) return true;
  const trimmed = s.trim();
  if (trimmed.length < 60) return true;
  // mostly uppercase
  const letters = trimmed.replace(/[^A-Za-z]/g, "");
  if (letters.length > 20) {
    const upper = letters.replace(/[^A-Z]/g, "").length;
    if (upper / letters.length > 0.7) return true;
  }
  return false;
};

// Address contains a numeric house number (street + number)
const hasHouseNumber = (addr: string | null | undefined) => {
  if (!addr) return false;
  // Look for digits not part of a postal-like sequence; require ≥1 digit token
  return /\b\d{1,4}\b/.test(addr);
};

const normalizePhone = (p: string | null | undefined) =>
  (p || "").replace(/[^\d]/g, "").replace(/^972/, "0");

async function callLovableAI(payload: unknown): Promise<any> {
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${text}`);
  }
  return await resp.json();
}

async function translateOrRewriteDescription(
  description: string | null,
  reasonHebrew: boolean,
  reasonLowQuality: boolean,
): Promise<string | null> {
  if (!description) return null;
  const system = reasonHebrew
    ? "You are a precise Hebrew→English real-estate translator. Translate the listing description into clear, natural English. Keep facts accurate. Do not invent details. Return only the translated description text."
    : "You rewrite low-quality real-estate listing descriptions into clear, professional English. Do not invent facts; only restructure and clean what is given. Return only the rewritten description text.";

  try {
    const json = await callLovableAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: system },
        { role: "user", content: description },
      ],
    });
    const text = json?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch (err) {
    console.error("translateOrRewriteDescription error:", err);
    return null;
  }
}

async function suggestMissingFields(prop: Property): Promise<Record<string, unknown> | null> {
  // Only suggest fields that are currently missing
  const missing: string[] = [];
  if (prop.year_built == null) missing.push("year_built");
  if (!prop.condition) missing.push("condition");
  if (prop.parking == null) missing.push("parking");
  if (missing.length === 0) return null;

  const photoSnippet = (prop.images || []).slice(0, 3);
  try {
    const json = await callLovableAI({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "You analyze a real-estate listing and propose plausible values for missing fields. Only propose values clearly supported by the description or photos. Use null when uncertain.",
        },
        {
          role: "user",
          content: JSON.stringify({
            description: prop.ai_english_description || prop.description,
            address: prop.address,
            city: prop.city,
            photo_urls: photoSnippet,
            missing_fields: missing,
          }),
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_fields",
            description: "Return suggested values for missing real-estate listing fields.",
            parameters: {
              type: "object",
              properties: {
                year_built: { type: ["integer", "null"] },
                condition: {
                  type: ["string", "null"],
                  enum: ["new", "renovated", "good", "needs_renovation", "shell", null],
                },
                parking: { type: ["integer", "null"] },
                confidence: { type: "string", enum: ["low", "medium", "high"] },
              },
              required: ["confidence"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_fields" } },
    });
    const args = json?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const parsed = JSON.parse(args);
    // Strip out fields the property already has
    const cleaned: Record<string, unknown> = {};
    for (const f of missing) {
      if (parsed[f] !== undefined && parsed[f] !== null) cleaned[f] = parsed[f];
    }
    if (Object.keys(cleaned).length === 0) return null;
    cleaned.confidence = parsed.confidence;
    cleaned.suggested_at = new Date().toISOString();
    return cleaned;
  } catch (err) {
    console.error("suggestMissingFields error:", err);
    return null;
  }
}

async function auditOne(
  supabase: any,
  prop: Property,
  agencyAgents: Agent[],
  cityAvg: Map<string, number>,
): Promise<{ score: number; status: "pending" | "flagged" | "reviewed" | "approved" }> {
  const flags: Array<{
    flag_type: string;
    severity: "critical" | "warning" | "info";
    message: string;
    auto_resolvable?: boolean;
  }> = [];
  const updates: Record<string, unknown> = {};

  // 1+2. Description: translate or rewrite
  const isHebrew = containsHebrew(prop.description) && !prop.ai_english_description;
  const lowQuality = looksLowQuality(prop.ai_english_description || prop.description);

  if (isHebrew) {
    const translated = await translateOrRewriteDescription(prop.description, true, false);
    if (translated) {
      updates.ai_english_description = translated;
    } else {
      flags.push({
        flag_type: "hebrew_only_description",
        severity: "warning",
        message: "Hebrew-only description; auto-translate failed.",
      });
    }
  } else if (lowQuality && (prop.description || prop.ai_english_description)) {
    const rewritten = await translateOrRewriteDescription(
      prop.ai_english_description || prop.description,
      false,
      true,
    );
    if (rewritten) updates.ai_english_description = rewritten;
  }

  // 3. Smart geocode hint (we don't actually geocode here — flag for later/manual)
  if (!hasHouseNumber(prop.address)) {
    flags.push({
      flag_type: "address_too_vague_for_geocode",
      severity: "warning",
      message: "Address lacks a numeric house number; cannot reliably geocode.",
    });
  }

  // 4. Suggest missing fields (stored, not auto-applied)
  const suggestions = await suggestMissingFields(prop);
  if (suggestions && Object.keys(suggestions).length > 0) {
    updates.ai_suggestions = { ...(prop.ai_suggestions || {}), ...suggestions };
  }

  // 5. Critical: missing core fields
  if (!prop.price || Number(prop.price) <= 0)
    flags.push({ flag_type: "missing_field", severity: "critical", message: "Missing price." });
  if (!prop.size_sqm || Number(prop.size_sqm) <= 0)
    flags.push({ flag_type: "missing_field", severity: "critical", message: "Missing size_sqm." });
  if (prop.bedrooms == null)
    flags.push({ flag_type: "missing_field", severity: "critical", message: "Missing bedrooms." });
  if (!prop.address)
    flags.push({ flag_type: "missing_field", severity: "critical", message: "Missing address." });

  // Warning: low photo count
  if (!prop.images || prop.images.length < 5) {
    flags.push({
      flag_type: "low_photo_count",
      severity: "warning",
      message: `Only ${prop.images?.length || 0} photos.`,
    });
  }

  // Warning: suspicious value (3x city median)
  if (prop.city && prop.price) {
    const avg = cityAvg.get(prop.city.toLowerCase());
    if (avg && Number(prop.price) > avg * 3) {
      flags.push({
        flag_type: "suspicious_value",
        severity: "warning",
        message: `Price ${Math.round(Number(prop.price)).toLocaleString()} is >3× city avg (${Math.round(avg).toLocaleString()}).`,
      });
    }
  }

  // Info: stale source (>90 days)
  if (prop.source_last_checked_at) {
    const ageDays =
      (Date.now() - new Date(prop.source_last_checked_at).getTime()) / 86_400_000;
    if (ageDays > 90) {
      flags.push({
        flag_type: "stale_source",
        severity: "info",
        message: `Source last checked ${Math.round(ageDays)} days ago.`,
      });
    }
  }

  // 6. Try to assign agent by phone match (fall back to name match)
  let assignedAgentId: string | null = prop.agent_id;
  if (!assignedAgentId && agencyAgents.length > 0) {
    // Phone is not on properties directly, so we rely on existing agent_id only.
    // (Phone-from-source matching would require import metadata; skip if unavailable.)
    // Name-match fallback is impossible without a candidate name on the property.
    // Therefore: leave unassigned.
  }

  if (!assignedAgentId) {
    flags.push({
      flag_type: "agent_unassigned",
      severity: "critical",
      message: "No agent assigned to this listing.",
    });
  }

  // 7. Compute score & status
  const critical = flags.filter((f) => f.severity === "critical").length;
  const warning = flags.filter((f) => f.severity === "warning").length;
  const info = flags.filter((f) => f.severity === "info").length;
  let score = 100 - critical * 25 - warning * 8 - info * 2;
  if (score < 0) score = 0;

  let status: "pending" | "flagged" | "reviewed" | "approved";
  if (critical > 0) status = "flagged";
  else if (warning > 0) status = "pending";
  else status = "approved";

  updates.quality_audit_score = score;
  updates.provisioning_audit_status = status;
  updates.last_audit_at = new Date().toISOString();

  // Persist updates
  const { error: upErr } = await supabase
    .from("properties")
    .update(updates)
    .eq("id", prop.id);
  if (upErr) console.error(`update property ${prop.id} error:`, upErr);

  // Replace flag set: clear unresolved, insert new
  await supabase
    .from("listing_quality_flags")
    .delete()
    .eq("property_id", prop.id)
    .is("resolved_at", null);

  if (flags.length > 0) {
    const { error: insErr } = await supabase.from("listing_quality_flags").insert(
      flags.map((f) => ({
        property_id: prop.id,
        flag_type: f.flag_type,
        severity: f.severity,
        message: f.message,
        auto_resolvable: f.auto_resolvable ?? false,
      })),
    );
    if (insErr) console.error(`insert flags ${prop.id} error:`, insErr);
  }

  return { score, status };
}

async function runAudit(agency_id: string, property_ids: string[] | undefined, limit: number) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Load roster
  const { data: agentsData } = await supabase
    .from("agents")
    .select("id, name, phone")
    .eq("agency_id", agency_id);
  const agencyAgents: Agent[] = (agentsData || []) as Agent[];

  // Load properties belonging to this agency (via agent_id, primary_agency_id, claimed_by_agency_id)
  let q = supabase
    .from("properties")
    .select(
      "id, description, ai_english_description, price, size_sqm, bedrooms, address, city, images, agent_id, year_built, condition, parking, source_last_checked_at, ai_suggestions",
    )
    .or(
      `primary_agency_id.eq.${agency_id},claimed_by_agency_id.eq.${agency_id},agent_id.in.(${agencyAgents.map((a) => `"${a.id}"`).join(",") || "NULL"})`,
    )
    .limit(limit);

  if (property_ids && property_ids.length > 0) {
    q = q.in("id", property_ids);
  }

  const { data: propsData, error: propsErr } = await q;
  if (propsErr) {
    console.error("load properties error:", propsErr);
    return;
  }
  const properties = (propsData || []) as Property[];

  // City averages (for suspicious_value)
  const cities = Array.from(new Set(properties.map((p) => p.city).filter(Boolean) as string[]));
  const cityAvg = new Map<string, number>();
  if (cities.length > 0) {
    const { data: cityRows } = await supabase
      .from("cities")
      .select("name, average_price, median_apartment_price")
      .in("name", cities);
    for (const c of cityRows || []) {
      const avg = (c as any).median_apartment_price || (c as any).average_price;
      if (avg) cityAvg.set((c as any).name.toLowerCase(), Number(avg));
    }
  }

  let processed = 0;
  let critical = 0;
  let warned = 0;
  let approved = 0;

  for (const p of properties) {
    try {
      const { status } = await auditOne(supabase, p, agencyAgents, cityAvg);
      processed++;
      if (status === "flagged") critical++;
      else if (status === "pending") warned++;
      else if (status === "approved") approved++;
    } catch (err) {
      console.error(`audit property ${p.id} error:`, err);
    }
  }

  // Audit log
  await supabase.from("agency_provisioning_audit").insert({
    action: "listings_audited",
    agency_id,
    metadata: {
      processed,
      critical,
      warned,
      approved,
      requested_limit: limit,
    },
  });

  console.log(
    `audit-and-enrich-listings done: agency=${agency_id} processed=${processed} critical=${critical} pending=${warned} approved=${approved}`,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // AuthN: must be admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin");
    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { agency_id, property_ids, limit } = parsed.data;

    // Background-execute so the admin UI gets an immediate response
    // @ts-ignore EdgeRuntime is provided by Supabase
    EdgeRuntime.waitUntil(runAudit(agency_id, property_ids, limit));

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Audit started in background. Refresh to see updated flags.",
        agency_id,
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("audit-and-enrich-listings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
