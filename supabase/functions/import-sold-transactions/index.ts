import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SoldTransaction {
  sold_price: number;
  sold_date: string;
  property_type?: string;
  rooms?: number;
  size_sqm?: number;
  floor?: number;
  year_built?: number;
  asset_condition?: string;
  is_new_construction?: boolean;
  address: string;
  city: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  gush_helka?: string;
  raw_data?: Record<string, unknown>;
}

interface ImportRequest {
  city: string;
  transactions: SoldTransaction[];
  source: "nadlan_gov_il" | "israel_tax_authority";
  autoGeocode?: boolean;
}

// Normalize Hebrew property types to English
function normalizePropertyType(type: string | undefined): string | null {
  if (!type) return null;
  
  const typeMap: Record<string, string> = {
    "דירה": "apartment",
    "דירת גן": "garden_apartment",
    "פנטהאוז": "penthouse",
    "דופלקס": "duplex",
    "בית פרטי": "house",
    "וילה": "villa",
    "קוטג'": "cottage",
    "דירת גג": "rooftop_apartment",
    "apartment": "apartment",
    "house": "house",
    "villa": "villa",
    "duplex": "duplex",
    "penthouse": "penthouse",
    "garden_apartment": "garden_apartment",
    "cottage": "cottage",
  };
  
  return typeMap[type.toLowerCase()] || type.toLowerCase();
}

// Normalize city names to match cities table
function normalizeCity(city: string): string {
  const cityMap: Record<string, string> = {
    "תל אביב": "Tel Aviv",
    "תל אביב יפו": "Tel Aviv",
    "תל-אביב": "Tel Aviv",
    "ירושלים": "Jerusalem",
    "חיפה": "Haifa",
    "רעננה": "Ra'anana",
    "הרצליה": "Herzliya",
    "נתניה": "Netanya",
    "אשדוד": "Ashdod",
    "באר שבע": "Beer Sheva",
    "רמת גן": "Ramat Gan",
    "פתח תקווה": "Petah Tikva",
    "מודיעין": "Modi'in",
    "מודיעין מכבים רעות": "Modi'in",
    "ראשון לציון": "Rishon LeZion",
    "כפר סבא": "Kfar Saba",
    "אילת": "Eilat",
    "אשקלון": "Ashkelon",
    "בית שמש": "Beit Shemesh",
    "גבעתיים": "Givatayim",
    "הוד השרון": "Hod HaSharon",
    "קיסריה": "Caesarea",
    "זכרון יעקב": "Zichron Ya'akov",
    "מעלה אדומים": "Ma'ale Adumim",
    "אפרת": "Efrat",
  };
  
  return cityMap[city] || city;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: ImportRequest = await req.json();
    const { city, transactions, source } = body;

    if (!city || !transactions || !source) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: city, transactions, source" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedCity = normalizeCity(city);
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];
    let minDate: string | null = null;
    let maxDate: string | null = null;

    // Process transactions in batches
    const batchSize = 50;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const records = batch.map((txn) => {
        // Track date range
        if (!minDate || txn.sold_date < minDate) minDate = txn.sold_date;
        if (!maxDate || txn.sold_date > maxDate) maxDate = txn.sold_date;

        return {
          sold_price: txn.sold_price,
          sold_date: txn.sold_date,
          property_type: normalizePropertyType(txn.property_type),
          rooms: txn.rooms,
          size_sqm: txn.size_sqm,
          floor: txn.floor,
          year_built: txn.year_built,
          asset_condition: txn.asset_condition,
          is_new_construction: txn.is_new_construction || false,
          address: txn.address,
          city: normalizedCity,
          neighborhood: txn.neighborhood,
          latitude: txn.latitude,
          longitude: txn.longitude,
          gush_helka: txn.gush_helka,
          source,
          raw_data: txn.raw_data,
          geocoded_at: txn.latitude && txn.longitude ? new Date().toISOString() : null,
          geocode_source: txn.latitude && txn.longitude ? "import" : null,
        };
      });

      // Use service role for inserting (bypasses RLS for admin operations)
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data, error } = await serviceClient
        .from("sold_transactions")
        .upsert(records, {
          onConflict: "address,city,sold_date,sold_price",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) {
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        imported += data?.length || 0;
      }
    }

    // Log the import
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const geocodedCount = transactions.filter(t => t.latitude && t.longitude).length;

    await serviceClient.from("sold_data_imports").insert({
      city: normalizedCity,
      source,
      records_imported: imported,
      records_geocoded: geocodedCount,
      records_failed: failed,
      date_range_start: minDate,
      date_range_end: maxDate,
      imported_by: userId,
      notes: errors.length > 0 ? errors.join("; ") : null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        city: normalizedCity,
        imported,
        failed,
        geocoded: geocodedCount,
        dateRange: { start: minDate, end: maxDate },
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Import error:", error);
    const message = error instanceof Error ? error.message : "Import failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
