import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 10;
const MAX_IMAGES = 8;

async function pickBestCover(imageUrls: string[], apiKey: string): Promise<number> {
  const imageContent = imageUrls.map((url, i) => ({
    type: "image_url" as const,
    image_url: { url },
  }));

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a real estate photography expert. I'm showing you ${imageUrls.length} listing photos (indexed 0 to ${imageUrls.length - 1}). Pick the ONE best image for the listing cover photo. Prefer: exterior/facade shots, wide-angle views of living spaces, bright natural lighting, attractive staging. Avoid: bathrooms, close-ups of fixtures, construction/renovation shots, dark photos, floor plans. Reply with ONLY the number (0-${imageUrls.length - 1}), nothing else.`,
            },
            ...imageContent,
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const t = await response.text();
    throw new Error(`AI gateway ${response.status}: ${t}`);
  }

  const data = await response.json();
  const answer = data.choices?.[0]?.message?.content?.trim() || "0";
  const idx = parseInt(answer, 10);
  if (isNaN(idx) || idx < 0 || idx >= imageUrls.length) return 0;
  return idx;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const batch = parseInt(url.searchParams.get("batch") || "0", 10);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const JRE_AGENCY = "0eb2a33b-a768-4204-ba75-29de29d6da2a";
    const EREZ_AGENCY = "cf4682bd-2e0e-4d4f-b587-574fbc80e827";

    // Get all agent IDs for both agencies
    const { data: agents } = await sb
      .from("agents")
      .select("id")
      .in("agency_id", [JRE_AGENCY, EREZ_AGENCY]);

    const agentIds = agents?.map((a: any) => a.id) || [];

    // Get all properties with 2+ images
    const { data: properties, error } = await sb
      .from("properties")
      .select("id, images")
      .in("agent_id", agentIds)
      .eq("is_published", true)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Filter to those with 2+ images
    const eligible = (properties || []).filter(
      (p: any) => Array.isArray(p.images) && p.images.length >= 2
    );

    const start = batch * BATCH_SIZE;
    const slice = eligible.slice(start, start + BATCH_SIZE);

    if (slice.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No more properties to process",
          total_eligible: eligible.length,
          batch,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: any[] = [];

    for (const prop of slice) {
      const images: string[] = prop.images;
      const subset = images.slice(0, MAX_IMAGES);

      try {
        const bestIdx = await pickBestCover(subset, LOVABLE_API_KEY);

        if (bestIdx > 0) {
          // Move best image to front
          const reordered = [...images];
          const [best] = reordered.splice(bestIdx, 1);
          reordered.unshift(best);

          await sb
            .from("properties")
            .update({ images: reordered })
            .eq("id", prop.id);

          results.push({ id: prop.id, moved: bestIdx, status: "reordered" });
        } else {
          results.push({ id: prop.id, moved: 0, status: "already_best" });
        }
      } catch (e) {
        console.error(`Failed for ${prop.id}:`, e);
        results.push({ id: prop.id, status: "error", error: String(e) });
      }

      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 1500));
    }

    return new Response(
      JSON.stringify({
        batch,
        processed: results.length,
        total_eligible: eligible.length,
        remaining: Math.max(0, eligible.length - start - BATCH_SIZE),
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("select-best-covers error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
