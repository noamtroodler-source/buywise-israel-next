import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// City/neighborhood context for generating accurate, unique prompts
const cityContext: Record<string, { vibe: string; architecture: string; landscape: string }> = {
  "tel-aviv": { vibe: "cosmopolitan Bauhaus", architecture: "white Bauhaus buildings, modern glass towers, balconies with plants", landscape: "flat coastal, palm trees, Mediterranean sea" },
  "jerusalem": { vibe: "ancient stone holy city", architecture: "Jerusalem stone buildings, domed rooftops, arched windows", landscape: "hilltop terrain, pine trees, golden limestone" },
  "haifa": { vibe: "diverse port city on Mount Carmel", architecture: "terraced buildings climbing hillside, Bahai gardens influence", landscape: "steep hills, sea views, lush greenery, port" },
  "herzliya": { vibe: "upscale tech-hub coastal", architecture: "luxury villas, modern apartments, glass facades", landscape: "Mediterranean coast, marinas, manicured gardens" },
  "raanana": { vibe: "Anglo family suburb", architecture: "red-roofed villas, garden apartments, tree-lined streets", landscape: "flat green parks, playgrounds, quiet residential streets" },
  "netanya": { vibe: "affordable beachside Anglo community", architecture: "high-rise towers along cliffs, older apartment blocks", landscape: "dramatic coastal cliffs, long beaches, promenades" },
  "modiin": { vibe: "planned modern family city", architecture: "uniform new construction, organized neighborhoods, parks", landscape: "rolling Judean foothills, green spaces between developments" },
  "beit-shemesh": { vibe: "growing Anglo-religious community", architecture: "Jerusalem stone apartments, new construction, community buildings", landscape: "Judean hills, rocky terrain, pine forests, valleys" },
  "efrat": { vibe: "Anglo settlement community", architecture: "Jerusalem stone houses on hillsides, red roofs", landscape: "terraced Judean hills, vineyards, olive groves, panoramic views" },
  "ramat-gan": { vibe: "urban diamond exchange hub", architecture: "mix of old apartments and modern towers, Diamond Exchange skyline", landscape: "urban parks, National Park greenery, city skyline" },
  "ashdod": { vibe: "growing southern port city", architecture: "modern residential towers, planned neighborhoods", landscape: "flat coastal, sand dunes, industrial port area" },
  "ashkelon": { vibe: "ancient coastal southern city", architecture: "mix of new towers and older buildings, archaeological parks", landscape: "Mediterranean beaches, national park ruins, flat terrain" },
  "beer-sheva": { vibe: "Negev capital university city", architecture: "brutalist older sections, modern university campus, new developments", landscape: "arid desert periphery, wadis, flat Negev terrain" },
  "caesarea": { vibe: "exclusive luxury enclave", architecture: "luxury villas, gated communities, Roman ruins nearby", landscape: "Mediterranean coast, ancient aqueduct, golf courses, manicured" },
  "eilat": { vibe: "Red Sea resort town", architecture: "hotels, resort-style apartments, colorful buildings", landscape: "desert mountains meeting Red Sea, coral reefs, dramatic canyons" },
  "kfar-saba": { vibe: "established central suburb", architecture: "garden apartments, family villas, newer developments at edges", landscape: "flat Sharon plain, citrus grove heritage, parks" },
  "petah-tikva": { vibe: "historic first settlement now urban", architecture: "dense urban mix of old and new, commercial centers", landscape: "flat central plain, Yarkon river area" },
  "hod-hasharon": { vibe: "upscale Sharon suburb", architecture: "spacious villas, modern townhouses, green neighborhoods", landscape: "Sharon plain, parks, agricultural edges" },
  "hadera": { vibe: "developing northern Sharon town", architecture: "older center, new peripheral developments", landscape: "coastal plain, eucalyptus groves, Hadera river" },
  "givat-shmuel": { vibe: "compact central city near Tel Aviv", architecture: "rapidly densifying towers, small older homes being replaced", landscape: "flat urban, close to Ramat Gan parks" },
  "maale-adumim": { vibe: "suburban Jerusalem satellite", architecture: "Jerusalem stone houses, planned community layout", landscape: "dramatic Judean desert overlook, wadis, stark beauty" },
  "mevaseret-zion": { vibe: "green Jerusalem suburb", architecture: "hillside homes, Jerusalem stone, leafy gardens", landscape: "forested Jerusalem hills, pine trees, mountain views" },
  "pardes-hanna": { vibe: "rural-charm Sharon town", architecture: "moshava-style houses, older charming buildings, new edges", landscape: "agricultural Sharon plain, vineyards, rural character" },
  "zichron-yaakov": { vibe: "wine country heritage town", architecture: "historic stone buildings, First Aliyah architecture, boutique", landscape: "Mount Carmel ridge, winery views, Mediterranean panoramas" },
  "gush-etzion": { vibe: "hilltop settlement bloc", architecture: "Jerusalem stone community buildings, modest homes", landscape: "Judean mountain terrain, terraced hillsides, pastoral" },
};

// Neighborhood-specific overrides for truly distinctive areas
const neighborhoodOverrides: Record<string, string> = {
  // Tel Aviv
  "tel-aviv:Neve Tzedek": "charming restored Ottoman-era lane with boutique galleries, low pastel buildings, bougainvillea, cobblestone",
  "tel-aviv:Florentin": "gritty urban street art covered walls, industrial-chic cafes, young creative energy, graffiti murals",
  "tel-aviv:Rothschild": "grand Bauhaus boulevard with white International Style buildings, wide tree-lined center promenade, outdoor cafes",
  "tel-aviv:Old Jaffa": "ancient stone port area, clock tower, narrow arched alleys, art galleries in old stone buildings, fishing boats",
  "tel-aviv:Sarona": "restored Templar colony stone buildings converted to upscale dining, modern glass towers behind heritage buildings",
  "tel-aviv:North Tel Aviv": "quiet leafy residential area, mature trees, garden apartments, family-oriented parks",
  "tel-aviv:Lev HaIr": "bustling city center, Dizengoff area, eclectic mix of Bauhaus and modern, busy commercial streets",
  "tel-aviv:Ramat Aviv": "upscale university district, wide boulevards, museum area, mature gardens, spacious apartments",
  "tel-aviv:HaTikva": "working-class market district, authentic Middle Eastern flavor, bustling shuk stalls, colorful signage",
  "tel-aviv:Kerem HaTeimanim": "intimate Yemenite quarter, narrow lanes, low traditional houses, authentic restaurants, close to Carmel Market",
  // Jerusalem
  "jerusalem:Old City": "ancient walled city, golden Dome of the Rock visible, stone arches, narrow market alleys, pilgrims",
  "jerusalem:Rehavia": "elegant tree-lined streets, Jerusalem stone garden apartments, intellectual heritage, quiet boulevards",
  "jerusalem:Talpiot": "commercial and residential mix, industrial area transitioning, views of desert hills",
  "jerusalem:German Colony": "restored Templar houses, charming stone facades, Emek Refaim cafe street, European character",
  "jerusalem:Nachlaot": "bohemian maze of tiny lanes, colorful doors, Ottoman-era courtyard houses, artistic community",
  "jerusalem:French Hill": "university-adjacent hilltop, panoramic views, modern apartment blocks, student energy",
  "jerusalem:Katamon": "established Anglo neighborhood, synagogues, stone buildings, tree-lined residential streets",
  "jerusalem:Baka": "gentrified old neighborhood, mix of old Arab houses and new buildings, trendy cafes",
  "jerusalem:Ramot": "large hilltop suburb, newer construction, family-oriented, panoramic city views",
  "jerusalem:Pisgat Ze'ev": "large northern suburb, affordable apartments, diverse community, hillside layout",
  "jerusalem:Arnona": "quiet residential, proximity to Haas Promenade, views of Old City, government area",
  "jerusalem:Armon HaNatziv": "elevated views of Temple Mount and desert, diplomatic quarter area, spacious",
  "jerusalem:Ein Kerem": "artistic village in a valley, church steeples, stone terraces, olive trees, springs",
  "jerusalem:Mamilla": "luxury area adjacent to Old City walls, upscale mall, boutique hotels, David Citadel view",
  "jerusalem:Givat Masua": "hilltop community, quiet residential, Jerusalem forest proximity",
  // Beit Shemesh
  "beit-shemesh:Ramat Beit Shemesh Alef": "Anglo religious community, organized streets, community feel, limestone buildings, parks",
  "beit-shemesh:Ramat Beit Shemesh Bet": "Haredi neighborhood, dense construction, community centers, modest limestone",
  "beit-shemesh:Ramat Beit Shemesh Gimel": "brand new development, construction cranes, fresh buildings on hillside, panoramic",
  "beit-shemesh:Ramat Beit Shemesh Dalet": "newest expansion, construction in progress, hilltop views, fresh infrastructure",
  "beit-shemesh:Old Beit Shemesh": "original town center, older buildings, established trees, local market feel",
  "beit-shemesh:Sheinfeld": "upscale Anglo enclave, spacious homes, gardens, quiet tree-lined streets",
  // Haifa
  "haifa:Carmel Center": "European-feel hilltop district, boutique shops, panoramic sea views, pine trees",
  "haifa:German Colony": "restored Templar stone buildings, Ben Gurion Boulevard, restaurants, Bahai Gardens above",
  "haifa:Hadar": "historic commercial center, dense urban, terraced streets, diverse architecture",
  "haifa:Neve Sha'anan": "university district on Carmel, academic campus, student housing, green hillside",
  "haifa:Bat Galim": "charming beachfront neighborhood, low buildings, promenade, sailing boats, Mediterranean",
  // Eilat
  "eilat:Coral Beach": "tropical resort area, Red Sea turquoise water, palm trees, snorkeling, desert mountains backdrop",
  "eilat:North Beach": "hotel strip, bustling promenade, restaurants, yachts, nightlife, desert-meets-sea",
  // Caesarea
  "caesarea:Aqueduct": "ancient Roman aqueduct on beach, luxury homes behind, historic meets modern",
  "caesarea:Golf Area": "manicured golf course, luxury villas, gated exclusivity, Mediterranean pines",
  // Ashkelon
  "ashkelon:Marina": "modern waterfront development, yacht harbor, luxury towers, sea promenade",
  "ashkelon:Afridar": "established neighborhood, older character, parks, close to beach, Anglo community",
  // Netanya
  "netanya:Galei Yam": "upscale beachfront, cliff-top luxury towers, dramatic sea views, promenades",
  "netanya:Old North": "Anglo hub, established residential, close to center, tree-lined streets",
  "netanya:Poleg": "new southern development, modern towers, commercial centers, young families",
  "netanya:Ir Yamim": "luxury coastal neighborhood, high-rises, sea views, premium infrastructure",
};

function buildPrompt(citySlug: string, neighborhood: string): string {
  const city = cityContext[citySlug];
  const overrideKey = `${citySlug}:${neighborhood}`;
  const override = neighborhoodOverrides[overrideKey];

  const baseStyle = "Warm watercolor and gouache illustration style, soft golden hour Mediterranean light, inviting residential scene, architectural detail, gentle color palette with warm ochres and soft blues, no people, no text, no logos, clean composition, slightly elevated perspective";

  if (override) {
    return `${baseStyle}. Scene: ${override}. Location feel: ${neighborhood} neighborhood in Israel.`;
  }

  if (city) {
    return `${baseStyle}. Scene: A residential street in ${neighborhood}, showing ${city.architecture}. Landscape: ${city.landscape}. Atmosphere: ${city.vibe} character. Location feel: ${neighborhood} neighborhood in Israel.`;
  }

  return `${baseStyle}. Scene: A Mediterranean residential street in ${neighborhood}, Israel. White and cream stone buildings, balconies, local vegetation, warm sunlight.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batch_size = 5, city_slug } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Get pending neighborhoods
    let query = sb
      .from("neighborhood_illustrations")
      .select("*")
      .eq("status", "pending")
      .limit(batch_size);

    if (city_slug) {
      query = query.eq("city_slug", city_slug);
    }

    const { data: pending, error: fetchErr } = await query;
    if (fetchErr) throw fetchErr;
    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending illustrations", remaining: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count remaining
    const { count: remaining } = await sb
      .from("neighborhood_illustrations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    const results: Array<{ neighborhood: string; city: string; status: string; error?: string }> = [];

    for (const item of pending) {
      try {
        // Mark as processing
        await sb
          .from("neighborhood_illustrations")
          .update({ status: "processing" })
          .eq("id", item.id);

        const prompt = buildPrompt(item.city_slug, item.neighborhood_name);

        // Generate image via Lovable AI Gateway
        const aiResponse = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${lovableKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image-preview",
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              modalities: ["image", "text"],
            }),
          }
        );

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          throw new Error(`AI API error ${aiResponse.status}: ${errText}`);
        }

        const aiData = await aiResponse.json();
        const imageBase64 =
          aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageBase64) {
          throw new Error("No image returned from AI");
        }

        // Extract base64 data
        const base64Data = imageBase64.replace(
          /^data:image\/\w+;base64,/,
          ""
        );
        const binaryData = Uint8Array.from(atob(base64Data), (c) =>
          c.charCodeAt(0)
        );

        // Upload to storage
        const storagePath = `${item.city_slug}/${item.neighborhood_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-+$/, "")}.jpg`;

        const { error: uploadErr } = await sb.storage
          .from("neighborhood-illustrations")
          .upload(storagePath, binaryData, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        const {
          data: { publicUrl },
        } = sb.storage
          .from("neighborhood-illustrations")
          .getPublicUrl(storagePath);

        // Update record
        await sb
          .from("neighborhood_illustrations")
          .update({
            status: "completed",
            image_url: publicUrl,
            storage_path: storagePath,
            prompt_used: prompt,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.push({
          neighborhood: item.neighborhood_name,
          city: item.city_slug,
          status: "completed",
        });

        console.log(`✅ Generated: ${item.city_slug}/${item.neighborhood_name}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(
          `❌ Failed: ${item.city_slug}/${item.neighborhood_name}: ${errorMsg}`
        );

        await sb
          .from("neighborhood_illustrations")
          .update({
            status: "failed",
            prompt_used: buildPrompt(item.city_slug, item.neighborhood_name),
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.push({
          neighborhood: item.neighborhood_name,
          city: item.city_slug,
          status: "failed",
          error: errorMsg,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        remaining: (remaining || 0) - results.length,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
