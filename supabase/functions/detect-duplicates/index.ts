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

    let totalInserted = 0;

    // ─── PASS 1: Image pHash matching (existing) ─────────────────────────
    const { data: hashes, error: hashErr } = await supabase
      .from("image_hashes")
      .select("id, property_id, phash")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (hashErr) throw hashErr;

    if (hashes && hashes.length > 0) {
      const byProperty = new Map<string, { phash: string }[]>();
      for (const h of hashes) {
        if (!h.property_id) continue;
        const arr = byProperty.get(h.property_id) || [];
        arr.push({ phash: h.phash });
        byProperty.set(h.property_id, arr);
      }

      const propertyIds = [...byProperty.keys()];
      const phashPairs: { property_a: string; property_b: string; similarity_score: number }[] = [];

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
            const [pa, pb] =
              propertyIds[i] < propertyIds[j]
                ? [propertyIds[i], propertyIds[j]]
                : [propertyIds[j], propertyIds[i]];
            phashPairs.push({ property_a: pa, property_b: pb, similarity_score: bestDistance });
          }
        }
      }

      for (const pair of phashPairs) {
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
        if (!error) totalInserted++;
      }
    }

    // ─── PASS 2: Cross-source address + size + price matching ────────────
    // Fetch published properties with address data
    const { data: properties, error: propErr } = await supabase
      .from("properties")
      .select("id, address, city, neighborhood, price, size_sqm, bedrooms, import_source, latitude, longitude")
      .eq("is_published", true)
      .not("city", "is", null)
      .order("created_at", { ascending: false })
      .limit(2000);

    if (propErr) throw propErr;

    if (properties && properties.length > 1) {
      const crossSourcePairs: { property_a: string; property_b: string; similarity_score: number }[] = [];

      // Group by city + neighborhood for efficient comparison
      const byLocation = new Map<string, typeof properties>();
      for (const p of properties) {
        const key = `${(p.city || '').toLowerCase().trim()}::${(p.neighborhood || '').toLowerCase().trim()}`;
        const arr = byLocation.get(key) || [];
        arr.push(p);
        byLocation.set(key, arr);
      }

      for (const [, group] of byLocation) {
        if (group.length < 2) continue;

        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            const a = group[i];
            const b = group[j];

            // Skip if same import source (same scrape, not cross-source)
            // but still check if addresses match closely
            const score = calculateAddressMatchScore(a, b);
            if (score >= 70) {
              const [pa, pb] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
              crossSourcePairs.push({ property_a: pa, property_b: pb, similarity_score: score });
            }
          }
        }
      }

      for (const pair of crossSourcePairs) {
        const { error } = await supabase.from("duplicate_pairs").upsert(
          {
            property_a: pair.property_a,
            property_b: pair.property_b,
            detection_method: "cross_source",
            similarity_score: pair.similarity_score,
            status: "pending",
          },
          { onConflict: "property_a,property_b", ignoreDuplicates: true }
        );
        if (!error) totalInserted++;
      }

      console.log(`Cross-source scan: checked ${properties.length} properties, found ${crossSourcePairs.length} potential duplicates`);
    }

    return new Response(
      JSON.stringify({ inserted: totalInserted, phash_hashes: hashes?.length || 0, properties_checked: properties?.length || 0 }),
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

/**
 * Calculate match score (0-100) between two properties based on
 * address similarity, size proximity, and price proximity.
 */
function calculateAddressMatchScore(
  a: { address?: string; price?: number; size_sqm?: number; bedrooms?: number; latitude?: number; longitude?: number },
  b: { address?: string; price?: number; size_sqm?: number; bedrooms?: number; latitude?: number; longitude?: number },
): number {
  let score = 0;
  let factors = 0;

  // 1. Address similarity (normalized) — 40 points max
  if (a.address && b.address) {
    const addrA = normalizeAddress(a.address);
    const addrB = normalizeAddress(b.address);
    if (addrA === addrB && addrA.length > 3) {
      score += 40;
    } else if (addrA.length > 3 && addrB.length > 3) {
      // Check if one contains the other (partial match)
      if (addrA.includes(addrB) || addrB.includes(addrA)) {
        score += 25;
      }
    }
    factors++;
  }

  // 2. Coordinate proximity — 30 points max
  if (a.latitude && a.longitude && b.latitude && b.longitude) {
    const distMeters = haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    if (distMeters < 20) score += 30;      // Same building
    else if (distMeters < 50) score += 20;  // Very close
    else if (distMeters < 100) score += 10; // Nearby
    factors++;
  }

  // 3. Size match — 15 points max (within ±5 sqm)
  if (a.size_sqm && b.size_sqm) {
    const sizeDiff = Math.abs(a.size_sqm - b.size_sqm);
    if (sizeDiff === 0) score += 15;
    else if (sizeDiff <= 5) score += 12;
    else if (sizeDiff <= 10) score += 5;
    factors++;
  }

  // 4. Price match — 15 points max (within ±5%)
  if (a.price && b.price && a.price > 0 && b.price > 0) {
    const priceDiff = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
    if (priceDiff === 0) score += 15;
    else if (priceDiff <= 0.03) score += 12;
    else if (priceDiff <= 0.05) score += 8;
    else if (priceDiff <= 0.10) score += 3;
    factors++;
  }

  // 5. Bedroom match — bonus (if exact match with other signals)
  if (a.bedrooms != null && b.bedrooms != null && a.bedrooms === b.bedrooms) {
    score += 5;
  }

  // Require at least 2 matching factors for a meaningful score
  if (factors < 2) return 0;

  return Math.min(score, 100);
}

function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[,.\-\/\\'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(st|street|ave|avenue|rd|road|blvd|boulevard|apt|apartment|unit|floor|rehov|derech)\b/gi, '')
    .trim();
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
