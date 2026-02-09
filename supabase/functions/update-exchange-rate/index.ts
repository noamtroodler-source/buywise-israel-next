import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch live rate from Frankfurter API (free, ECB data)
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=ILS");
    
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status}`);
    }
    
    const data = await response.json();
    const rate = data.rates?.ILS;

    if (!rate || typeof rate !== "number") {
      throw new Error("Invalid rate received from API");
    }

    console.log(`Fetched exchange rate: 1 USD = ${rate} ILS`);

    // Update database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("calculator_constants")
      .update({
        value_numeric: rate,
        updated_at: new Date().toISOString(),
      })
      .eq("constant_key", "EXCHANGE_RATE_USD_ILS")
      .eq("is_current", true);

    if (error) {
      console.error("Database update error:", error);
      throw error;
    }

    console.log("Exchange rate updated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        rate, 
        updated_at: new Date().toISOString(),
        source: "Frankfurter API (ECB)"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exchange rate update failed:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
