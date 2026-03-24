import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Neighborhood → street names mapping for Jerusalem
const NEIGHBORHOOD_STREETS: Record<string, string[]> = {
  "Old Katamon": ["Rachel Imenu", "Bruria", "Pierre Koenig", "HaPalmach", "Katamon"],
  "Baka": ["Derech Beit Lechem", "Yehuda", "Rivka", "Bethlehem Road"],
  "German Colony": ["Emek Refaim", "Lloyd George", "Rachel Imenu", "Cremieux"],
  "City Center": ["Jaffa", "King George", "Ben Yehuda", "HaNeviim", "Hillel"],
  "Rehavia": ["Azza", "Ramban", "Alfasi", "Keren Kayemet", "Ibn Ezra"],
  "French Hill": ["Levi Eshkol", "Churchill", "Ha'Universita"],
  "Arnona": ["Shalom Yehuda", "Haim Hazaz", "Arnona"],
  "Talbiya": ["Jabotinsky", "Dubnov", "Hovevei Tziyon", "Balfour"],
  "Mamilla": ["King Solomon", "Shlomtzion HaMalka", "Agron"],
  "Ramat Eshkol": ["Paran", "Levi Eshkol", "Sderot Ramat Eshkol"],
  "Musrara": ["HaAyin Het", "Shmuel HaNavi", "HaNeviim"],
  "Katamonim": ["San Martin", "Guatemala", "Katamon HaYeshana"],
  "Maalot Dafna": ["Bar Ilan", "Paran", "Shmuel HaNavi"],
  "Mekor Haim": ["Pierre Koenig", "Mekor Haim", "HaRakevet"],
  "Nachlaot": ["Agrippas", "Bezalel", "Nachlaot"],
  "Ein Kerem": ["Ein Kerem", "HaMaayan", "Ma'ayan"],
  "Kiryat Shmuel": ["Azza", "Radak", "Ussishkin"],
  "Neve Granot": ["Granot", "Haim Hazaz"],
  "Abu Tor": ["Derech Hevron", "Abu Tor"],
  "Har Nof": ["Katznelson", "Shmuel HaNavi", "Har Nof"],
  "Kiryat Moshe": ["Harav Herzog", "Kiryat Moshe"],
  "Givat Ram": ["Ruppin", "Kaplan"],
  "Nayot": ["Haim Hazaz", "Nayot"],
  "San Simon": ["Pierre Koenig", "San Simon"],
  "Talpiot": ["Derech Hevron", "Pierre Koenig", "HaGdud HaIvri"],
  "Givat Masua": ["Givat Masua", "HaShoshan"],
  "Pisgat Zeev": ["Moshe Dayan", "Neve Yaakov"],
  "Ramot": ["Golda Meir", "Sderot Ramot"],
  "Malha": ["Derech HaShalom", "Pat"],
  "Bayit VeGan": ["Bayit VeGan", "Uziel"],
  "Beit HaKerem": ["Beit HaKerem", "HaHagana"],
  "Old City": ["Jewish Quarter", "Old City"],
  "Sheikh Jarrah": ["Nablus Road", "Sheikh Jarrah"],
};

// Anglo neighborhoods that get sukkah_balcony
const ANGLO_NEIGHBORHOODS = [
  "Baka", "German Colony", "Old Katamon", "Rehavia", "Talbiya",
  "Arnona", "Katamon", "Katamonim", "French Hill", "Ramat Eshkol",
  "Maalot Dafna", "Nachlaot", "Kiryat Shmuel", "Har Nof",
];

// Avg price/sqm by neighborhood for zero-price fixes
const NEIGHBORHOOD_PRICE_SQM: Record<string, number> = {
  "Mamilla": 37000,
  "Nachlaot": 44000,
  "City Center": 48000,
  "Arnona": 28000,
  "Rehavia": 45000,
  "German Colony": 42000,
  "Old Katamon": 35000,
  "Baka": 38000,
  "Talbiya": 50000,
  "French Hill": 25000,
  "Ramat Eshkol": 22000,
  "Kiryat Shmuel": 40000,
  "Musrara": 30000,
  "Talpiot": 26000,
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getStreetForProperty(neighborhood: string, propertyId: string): string {
  const streets = NEIGHBORHOOD_STREETS[neighborhood] || NEIGHBORHOOD_STREETS["City Center"];
  const idx = hashCode(propertyId) % streets.length;
  return streets[idx];
}

function getHouseNumber(propertyId: string): number {
  const h = hashCode(propertyId + "house");
  return 2 + (h % 60) * 2; // Even numbers 2-120
}

function getFloor(propertyType: string, sizeSqm: number | null, propertyId: string): { floor: number; totalFloors: number } {
  if (propertyType === "garden_apartment") return { floor: 0, totalFloors: 3 };
  if (propertyType === "house" || propertyType === "cottage") return { floor: 0, totalFloors: 2 };
  if (propertyType === "duplex") return { floor: 0, totalFloors: 3 };
  if (propertyType === "penthouse") {
    const f = sizeSqm && sizeSqm > 200 ? 10 + (hashCode(propertyId) % 3) : 6 + (hashCode(propertyId) % 4);
    return { floor: f, totalFloors: f };
  }
  // Regular apartment
  const f = 2 + (hashCode(propertyId + "floor") % 4); // 2-5
  return { floor: f, totalFloors: f + 2 };
}

function getBathrooms(bedrooms: number): number {
  if (bedrooms <= 2) return 1;
  if (bedrooms <= 4) return 2;
  if (bedrooms <= 6) return 3;
  return 4;
}

function getParking(propertyType: string, sizeSqm: number | null, price: number): number {
  if (price > 12000000) return 2;
  if (["penthouse", "house", "cottage", "garden_apartment", "duplex"].includes(propertyType)) return 1;
  if (sizeSqm && sizeSqm >= 100) return 1;
  if (price > 8000000) return 1;
  return 0;
}

function getFeatures(
  propertyType: string,
  bedrooms: number,
  neighborhood: string,
  price: number,
  floor: number,
  existingFeatures: string[] | null
): string[] {
  const feats = new Set(existingFeatures || []);
  
  // Baseline
  feats.add("elevator");
  feats.add("mamad/safe_room");
  
  // Type-based
  if (propertyType === "penthouse") {
    feats.add("rooftop");
    feats.add("panoramic_view");
  }
  if (propertyType === "garden_apartment") {
    feats.add("garden");
  }
  if (bedrooms >= 3) {
    feats.add("storage");
  }
  
  // Anglo neighborhoods
  if (ANGLO_NEIGHBORHOODS.some(n => neighborhood?.toLowerCase().includes(n.toLowerCase()))) {
    feats.add("sukkah_balcony");
  }
  
  // Luxury
  if (price > 10000000) {
    feats.add("underfloor_heating");
  }
  
  // High floor
  if (floor >= 6) {
    feats.add("city_view");
  }
  
  return Array.from(feats);
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

    const AGENCY_ID = "0eb2a33b-a768-4204-ba75-29de29d6da2a";

    // Get all agents for this agency
    const { data: agents } = await sb
      .from("agents")
      .select("id")
      .eq("agency_id", AGENCY_ID);

    const agentIds = agents?.map((a: any) => a.id) || [];
    if (agentIds.length === 0) {
      return new Response(JSON.stringify({ error: "No agents found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all properties for this agency
    const { data: properties, error: propErr } = await sb
      .from("properties")
      .select("*")
      .in("agent_id", agentIds);

    if (propErr) throw propErr;
    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ error: "No properties found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${properties.length} JRE properties to enrich`);

    let updated = 0;
    let pricesFixed = 0;
    let addressesAdded = 0;

    for (const prop of properties) {
      const updates: Record<string, any> = {};
      const neighborhood = prop.neighborhood || "City Center";
      const propertyType = prop.property_type || "apartment";
      const bedrooms = prop.bedrooms || 3;
      const sizeSqm = prop.size_sqm;

      // 1. Fix zero prices
      let price = prop.price || 0;
      if (price === 0 && sizeSqm) {
        const avgPriceSqm = NEIGHBORHOOD_PRICE_SQM[neighborhood] || 30000;
        price = Math.round((avgPriceSqm * sizeSqm) / 50000) * 50000;
        updates.price = price;
        pricesFixed++;
      }

      // 2. Add address if missing
      if (!prop.address || prop.address.trim() === "" || prop.address === "Jerusalem") {
        const street = getStreetForProperty(neighborhood, prop.id);
        const houseNum = getHouseNumber(prop.id);
        updates.address = `${street} ${houseNum}, Jerusalem`;
        addressesAdded++;
      }

      // 3. Bathrooms
      if (!prop.bathrooms || prop.bathrooms === 0) {
        updates.bathrooms = getBathrooms(bedrooms);
      }

      // 4. Additional rooms
      if (prop.additional_rooms == null) {
        updates.additional_rooms = bedrooms >= 3 ? 2 : 1;
      }

      // 5. AC type
      if (!prop.ac_type) {
        updates.ac_type = (propertyType === "penthouse" || price > 10000000) ? "central" : "split";
      }

      // 6. Parking
      if (prop.parking === 0 || prop.parking == null) {
        updates.parking = getParking(propertyType, sizeSqm, price);
      }

      // 7. Floor
      if (prop.floor == null) {
        const { floor, totalFloors } = getFloor(propertyType, sizeSqm, prop.id);
        updates.floor = floor;
        updates.total_floors = totalFloors;
      }

      // 8. Features
      const floorVal = updates.floor ?? prop.floor ?? 2;
      updates.features = getFeatures(
        propertyType, bedrooms, neighborhood, price, floorVal, prop.features
      );

      // 9. Publish
      updates.is_published = true;

      // 10. City
      if (!prop.city || prop.city.trim() === "") {
        updates.city = "Jerusalem";
      }

      // Apply updates
      const { error: updateErr } = await sb
        .from("properties")
        .update(updates)
        .eq("id", prop.id);

      if (updateErr) {
        console.error(`Failed to update ${prop.id}: ${updateErr.message}`);
      } else {
        updated++;
      }
    }

    return new Response(
      JSON.stringify({
        total: properties.length,
        updated,
        prices_fixed: pricesFixed,
        addresses_added: addressesAdded,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("enrich-jre-listings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
