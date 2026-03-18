import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch all image hashes
    const { data: hashes, error: hashErr } = await supabase
      .from("image_hashes")
      .select("id, property_id, phash")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (hashErr) throw hashErr;
    if (!hashes || hashes.length === 0) {
      return new Response(
        JSON.stringify({ inserted: 0, message: "No image hashes found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group hashes by property
    const byProperty = new Map<string, { phash: string }[]>();
    for (const h of hashes) {
      if (!h.property_id) continue;
      const arr = byProperty.get(h.property_id) || [];
      arr.push({ phash: h.phash });
      byProperty.set(h.property_id, arr);
    }

    const propertyIds = [...byProperty.keys()];
    const pairs: { property_a: string; property_b: string; similarity_score: number }[] = [];

    // Compare each property pair
    for (let i = 0; i < propertyIds.length; i++) {
      for (let j = i + 1; j < propertyIds.length; j++) {
        const hashesA = byProperty.get(propertyIds[i])!;
        const hashesB = byProperty.get(propertyIds[j])!;

        let bestDistance = 64;
        for (const a of hashesA) {
          for (const b of hashesB) {
            const d = hammingDistance(a.phash, b.phash);
            if (d < bestDistance) bestDistance = d;
          }
        }

        if (bestDistance <= 5) {
          // Ensure consistent ordering
          const [pa, pb] =
            propertyIds[i] < propertyIds[j]
              ? [propertyIds[i], propertyIds[j]]
              : [propertyIds[j], propertyIds[i]];
          pairs.push({ property_a: pa, property_b: pb, similarity_score: bestDistance });
        }
      }
    }

    // Insert new pairs (skip existing)
    let inserted = 0;
    for (const pair of pairs) {
      const { error } = await supabase.from("duplicate_pairs").upsert(
        {
          property_a: pair.property_a,
          property_b: pair.property_b,
          detection_method: "phash",
          similarity_score: pair.similarity_score,
          status: "pending",
        },
        { onConflict: "property_a,property_b", ignoreDuplicates: true }
      );
      if (!error) inserted++;
    }

    return new Response(
      JSON.stringify({ inserted, total_candidates: pairs.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("detect-duplicates error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const va = parseInt(a[i], 16);
    const vb = parseInt(b[i], 16);
    let xor = va ^ vb;
    while (xor) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}
