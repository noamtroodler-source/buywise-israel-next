import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PAGE_SIZE = 1000;
const AUTO_MERGE_THRESHOLD = 90;
const PRICE_TOLERANCE = 0.03;

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
    let autoMerged = 0;

    // ─── Load existing pairs to skip ─────────────────────────────────
    const existingPairs = new Set<string>();
    {
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const { data } = await supabase
          .from("duplicate_pairs")
          .select("property_a, property_b")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
        if (data && data.length > 0) {
          for (const p of data) {
            const key = p.property_a < p.property_b
              ? `${p.property_a}::${p.property_b}`
              : `${p.property_b}::${p.property_a}`;
            existingPairs.add(key);
          }
          hasMore = data.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }
    }
    console.log(`Loaded ${existingPairs.size} existing pairs to skip`);

    // ─── PASS 1: Image pHash matching ────────────────────────────────
    const { data: hashes, error: hashErr } = await supabase
      .from("image_hashes")
      .select("id, property_id, phash")
      .order("created_at", { ascending: false })
      .limit(5000);

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
          const [pa, pb] = propertyIds[i] < propertyIds[j]
            ? [propertyIds[i], propertyIds[j]]
            : [propertyIds[j], propertyIds[i]];

          if (existingPairs.has(`${pa}::${pb}`)) continue;

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
      console.log(`pHash scan: ${phashPairs.length} new pairs from ${propertyIds.length} properties`);
    }

    // ─── PASS 2: Cross-source address + coordinate + size + price ────
    // Paginate through ALL published properties
    const allProperties: any[] = [];
    {
      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("properties")
          .select("id, address, city, neighborhood, price, size_sqm, bedrooms, import_source, latitude, longitude, data_quality_score")
          .eq("is_published", true)
          .not("city", "is", null)
          .order("id")
          .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

        if (error) throw error;
        if (data && data.length > 0) {
          allProperties.push(...data);
          hasMore = data.length === PAGE_SIZE;
          page++;
        } else {
          hasMore = false;
        }
      }
    }
    console.log(`Loaded ${allProperties.length} published properties for cross-source scan`);

    if (allProperties.length > 1) {
      const crossSourcePairs: { property_a: string; property_b: string; similarity_score: number; bedrooms_match: boolean; price_within_3: boolean; same_city: boolean }[] = [];

      // Group by city + neighborhood for efficient comparison
      const byLocation = new Map<string, typeof allProperties>();
      for (const p of allProperties) {
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

            const [pa, pb] = a.id < b.id ? [a.id, b.id] : [b.id, a.id];
            if (existingPairs.has(`${pa}::${pb}`)) continue;

            const score = calculateAddressMatchScore(a, b);
            if (score >= 70) {
              const bedroomsMatch = a.bedrooms != null && b.bedrooms != null && a.bedrooms === b.bedrooms;
              const priceWithin3 = a.price && b.price && a.price > 0 && b.price > 0 &&
                Math.abs(a.price - b.price) / Math.max(a.price, b.price) <= PRICE_TOLERANCE;
              const sameCity = (a.city || '').toLowerCase() === (b.city || '').toLowerCase();

              crossSourcePairs.push({
                property_a: pa,
                property_b: pb,
                similarity_score: score,
                bedrooms_match: bedroomsMatch,
                price_within_3: !!priceWithin3,
                same_city: sameCity,
              });
            }
          }
        }
      }

      // Process pairs: auto-merge high confidence, or insert for manual review
      for (const pair of crossSourcePairs) {
        const shouldAutoMerge = pair.similarity_score >= AUTO_MERGE_THRESHOLD
          && pair.bedrooms_match
          && pair.price_within_3
          && pair.same_city;

        if (shouldAutoMerge) {
          // Find winner by data_quality_score
          const propA = allProperties.find(p => p.id === pair.property_a);
          const propB = allProperties.find(p => p.id === pair.property_b);
          const scoreA = propA?.data_quality_score ?? 0;
          const scoreB = propB?.data_quality_score ?? 0;
          const winnerId = scoreA >= scoreB ? pair.property_a : pair.property_b;
          const loserId = winnerId === pair.property_a ? pair.property_b : pair.property_a;

          // Insert pair first
          const { data: insertedPair } = await supabase.from("duplicate_pairs").upsert(
            {
              property_a: pair.property_a,
              property_b: pair.property_b,
              detection_method: "cross_source",
              similarity_score: pair.similarity_score,
              status: "pending",
            },
            { onConflict: "property_a,property_b", ignoreDuplicates: true }
          ).select("id").single();

          if (insertedPair) {
            // Auto-merge
            const { error: mergeErr } = await supabase.rpc("merge_properties", {
              p_winner_id: winnerId,
              p_loser_id: loserId,
              p_pair_id: insertedPair.id,
              p_admin_id: null, // system auto-merge
            });
            if (!mergeErr) {
              autoMerged++;
            } else {
              console.error(`Auto-merge failed for pair ${insertedPair.id}:`, mergeErr.message);
            }
            totalInserted++;
          }
        } else {
          // Insert for manual review
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
      }

      console.log(`Cross-source scan: checked ${allProperties.length} properties, found ${crossSourcePairs.length} potential duplicates, auto-merged ${autoMerged}`);
    }

    return new Response(
      JSON.stringify({
        inserted: totalInserted,
        auto_merged: autoMerged,
        phash_hashes: hashes?.length || 0,
        properties_checked: allProperties.length,
        existing_pairs_skipped: existingPairs.size,
      }),
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

function calculateAddressMatchScore(
  a: { address?: string; price?: number; size_sqm?: number; bedrooms?: number; latitude?: number; longitude?: number },
  b: { address?: string; price?: number; size_sqm?: number; bedrooms?: number; latitude?: number; longitude?: number },
): number {
  let score = 0;
  let factors = 0;

  // 1. Address similarity — 40 points max
  if (a.address && b.address) {
    const addrA = normalizeAddress(a.address);
    const addrB = normalizeAddress(b.address);
    if (addrA === addrB && addrA.length > 3) {
      score += 40;
    } else if (addrA.length > 3 && addrB.length > 3) {
      if (addrA.includes(addrB) || addrB.includes(addrA)) {
        score += 25;
      }
    }
    factors++;
  }

  // 2. Coordinate proximity — 30 points max
  if (a.latitude && a.longitude && b.latitude && b.longitude) {
    const distMeters = haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
    if (distMeters < 20) score += 30;
    else if (distMeters < 50) score += 20;
    else if (distMeters < 100) score += 10;
    factors++;
  }

  // 3. Size match — 15 points max
  if (a.size_sqm && b.size_sqm) {
    const sizeDiff = Math.abs(a.size_sqm - b.size_sqm);
    if (sizeDiff === 0) score += 15;
    else if (sizeDiff <= 5) score += 12;
    else if (sizeDiff <= 10) score += 5;
    factors++;
  }

  // 4. Price match — 15 points max
  if (a.price && b.price && a.price > 0 && b.price > 0) {
    const priceDiff = Math.abs(a.price - b.price) / Math.max(a.price, b.price);
    if (priceDiff === 0) score += 15;
    else if (priceDiff <= 0.03) score += 12;
    else if (priceDiff <= 0.05) score += 8;
    else if (priceDiff <= 0.10) score += 3;
    factors++;
  }

  // 5. Bedroom match — bonus
  if (a.bedrooms != null && b.bedrooms != null && a.bedrooms === b.bedrooms) {
    score += 5;
  }

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
