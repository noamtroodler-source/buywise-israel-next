// Generates a warm, factual property description from extracted fields + photos.
// Admin-only. Returns { description: string }.
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are a bilingual Israeli real estate copywriter writing for English-speaking international buyers.
Voice: "Trusted Friend" — warm, plain, specific, no hype, no clichés, no emojis. Never invent facts.

Rules:
- Use ONLY facts present in the supplied fields, notes, and photos. If a fact isn't there, don't claim it.
- 3-4 short paragraphs, ~120-200 words total.
  1) Lead with the property + setting (type, neighborhood/city, what it feels like).
  2) Layout & key features (rooms, size, floor, balcony, parking, condition, AC, mamad, etc. — only what's known).
  3) What you see in the photos that the listing fields don't already say (light, finishes, view, kitchen style, balcony aspect). Stay factual.
  4) Optional closing line on who it suits (sale vs rent, family vs investor) — only if obvious from the data.
- Never mention price.
- Never use the words "luxury", "stunning", "dream", "must-see", "Anglo".
- British/American English is fine, just be consistent.
- Output PLAIN TEXT only (no markdown, no headings).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const fields = body.fields || {};
    const notes: string = (body.notes || "").toString().slice(0, 4000);
    const imageUrls: string[] = Array.isArray(body.image_urls) ? body.image_urls.slice(0, 12) : [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return new Response(JSON.stringify({ error: "AI service not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Compact known-fields summary
    const keep: Record<string, any> = {};
    for (const k of [
      "property_type","listing_status","city","neighborhood","address",
      "bedrooms","additional_rooms","bathrooms","size_sqm","floor","total_floors",
      "year_built","parking","condition","ac_type","vaad_bayit_monthly",
      "has_balcony","has_elevator","has_storage","features",
      "furnished_status","pets_policy","lease_term",
    ]) if (fields[k] !== undefined && fields[k] !== null && fields[k] !== "") keep[k] = fields[k];

    const userContent: any[] = [
      { type: "text", text: `Known fields (JSON):\n${JSON.stringify(keep, null, 2)}` },
    ];
    if (notes.trim()) userContent.push({ type: "text", text: `Extra notes / source text:\n${notes}` });
    for (const url of imageUrls) userContent.push({ type: "image_url", image_url: { url } });

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("AI gateway error", r.status, text);
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI description failed", detail: text }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const j = await r.json();
    const description = (j?.choices?.[0]?.message?.content || "").toString().trim();
    if (!description) return new Response(JSON.stringify({ error: "Empty response" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ description }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("ai-generate-description error", e);
    return new Response(JSON.stringify({ error: e?.message || "Unexpected error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
