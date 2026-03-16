import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GovMapTransaction {
  sold_price: number;
  sold_date: string;
  property_type: string | null;
  rooms: number | null;
  size_sqm: number | null;
  floor: number | null;
  address: string;
  city: string;
  neighborhood: string | null;
  gush_helka: string | null;
  deal_id: string | null;
  raw_data: Record<string, unknown>;
}

interface ImportRequest {
  transactions: GovMapTransaction[];
  batch_index?: number;
  total_batches?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

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
    const { transactions } = body;

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No transactions provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let imported = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process in sub-batches of 100
    const batchSize = 100;
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);

      const records = batch.map((txn) => ({
        sold_price: txn.sold_price,
        sold_date: txn.sold_date,
        property_type: txn.property_type,
        rooms: txn.rooms,
        size_sqm: txn.size_sqm,
        floor: txn.floor,
        address: txn.address,
        city: txn.city,
        neighborhood: txn.neighborhood,
        gush_helka: txn.gush_helka,
        deal_id: txn.deal_id,
        source: "govmap_gov_il",
        is_new_construction: false,
        raw_data: txn.raw_data,
        price_per_sqm: txn.size_sqm && txn.size_sqm > 0
          ? Math.round(txn.sold_price / txn.size_sqm)
          : null,
      }));

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
        skipped += batch.length - (data?.length || 0);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported,
        failed,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("GovMap import error:", error);
    const message = error instanceof Error ? error.message : "Import failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
