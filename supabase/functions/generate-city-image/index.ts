import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cityName, citySlug, highlights } = await req.json();

    if (!cityName || !citySlug) {
      return new Response(
        JSON.stringify({ error: "City name and slug are required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if city already has an AI-generated hero image
    const { data: city } = await supabase
      .from("cities")
      .select("hero_image")
      .eq("slug", citySlug)
      .single();

    if (city?.hero_image?.includes("data:image")) {
      // Already has AI-generated image, return it
      return new Response(
        JSON.stringify({ imageUrl: city.hero_image }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate abstract artistic image prompt based on city
    const highlightText = highlights?.length > 0 ? highlights.join(", ") : "";
    const prompt = `Abstract artistic painting representing ${cityName}, Israel. Style: bold brushstrokes, vibrant colors, textured oil painting effect. Mood inspired by ${highlightText || "Mediterranean vibes, urban energy, warm sunlight"}. Abstract expressionist style with hints of the city's character. Dominant colors should evoke the essence of ${cityName}. Ultra high resolution, artistic, painterly, impressionistic.`;

    console.log("Generating image with prompt:", prompt);

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI Gateway error:", error);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      throw new Error("No image generated");
    }

    // Save the generated image to the city record
    const { error: updateError } = await supabase
      .from("cities")
      .update({ hero_image: imageUrl })
      .eq("slug", citySlug);

    if (updateError) {
      console.error("Failed to save image to database:", updateError);
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating city image:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
