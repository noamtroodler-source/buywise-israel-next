// Generates a warm, factual property description from extracted fields + photos.
// Admin-only. Returns { description: string }.
import { createClient } from "npm:@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM = `You are a bilingual Israeli real estate copywriter writing for English-speaking international buyers.
Voice: "Trusted Friend" — warm, plain, specific. No hype, no clichés, no emojis. Never invent facts.

ANTI-FABRICATION RULES (most important):
- Use ONLY facts that are (a) in the structured fields, (b) in the notes/source text, or (c) clearly visible in a property photo I gave you.
- A spec-sheet screenshot or floor plan does NOT count as a property photo — do not describe interior finishes from those.
- If a fact is not present in any of those three sources, you MUST NOT mention it.
- Specifically NEVER write any of the following unless explicitly supported:
  • "high ceilings" — only if a photo unambiguously shows tall ceilings, or notes say so
  • "abundant natural light" / "bright" / "sun-drenched" — only if photos clearly show it
  • "spacious" / "generous" — only if size_sqm is genuinely above average for its room count
  • "stunning views" / "panoramic" — only if a photo shows the view
  • "renovated" / "modern kitchen" / "designer finishes" — only if condition field says so or a photo clearly shows it
  • "quiet street" / "central location" / "vibrant neighborhood" — only if notes say so
  • "investment opportunity" / "rental potential" — never speculate
- If you're unsure whether a feature is real, leave it out. Shorter and accurate beats longer and embellished.
- Banned hype words always: "luxury", "stunning", "dream", "must-see", "rare opportunity", "lifestyle", "haven", "oasis", "boasts", "nestled", "Anglo".

STRUCTURE:
- 2-3 short paragraphs, 90-160 words total (shorter if there's little to say).
  1) What it is + where it is (type, neighborhood/city). Only literal facts.
  2) Layout & known features (rooms, size, floor, balcony, parking, condition, AC, mamad, vaad bayit — only what's in fields).
  3) Optional: one short observation from the actual photos (e.g. "the kitchen is open to the living area" — only if visible).
- Never mention price.
- Plain text only, no markdown, no headings, no bullet lists.`;

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
