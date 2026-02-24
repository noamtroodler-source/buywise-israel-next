import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { image_url, bucket, path } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    console.log("Enhancing image:", image_url.slice(0, 100));

    // Call Lovable AI image model to enhance the image
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Enhance this real estate property photo. Improve sharpness, color balance, brightness, and contrast to make it look professional and appealing for a property listing. Fix any color cast, brighten dark areas, and make the image look crisp and inviting. Keep the image realistic — do not add objects, change the room layout, or alter the property. Only improve the photographic quality.",
                },
                {
                  type: "image_url",
                  image_url: { url: image_url },
                },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI enhancement failed:", aiResponse.status, errText);

      // For rate limits or payment issues, return original
      if (aiResponse.status === 429 || aiResponse.status === 402) {
        return new Response(
          JSON.stringify({
            success: true,
            enhanced: false,
            reason: aiResponse.status === 429 ? "rate_limited" : "credits_exhausted",
            image_url: image_url,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const enhancedBase64 =
      aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!enhancedBase64) {
      console.log("No enhanced image returned, keeping original");
      return new Response(
        JSON.stringify({
          success: true,
          enhanced: false,
          reason: "no_image_returned",
          image_url: image_url,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If bucket+path provided, upload enhanced image to storage
    if (bucket && path) {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      // Convert base64 to binary
      const base64Data = enhancedBase64.replace(
        /^data:image\/\w+;base64,/,
        ""
      );
      const binaryData = Uint8Array.from(atob(base64Data), (c) =>
        c.charCodeAt(0)
      );

      const { error: uploadErr } = await sb.storage
        .from(bucket)
        .upload(path, binaryData, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadErr) {
        console.error("Upload error:", uploadErr);
        // Return original if upload fails
        return new Response(
          JSON.stringify({
            success: true,
            enhanced: false,
            reason: "upload_failed",
            image_url: image_url,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
      console.log("Enhanced image uploaded:", urlData?.publicUrl?.slice(0, 80));

      return new Response(
        JSON.stringify({
          success: true,
          enhanced: true,
          image_url: urlData?.publicUrl,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No bucket — return base64 directly
    return new Response(
      JSON.stringify({
        success: true,
        enhanced: true,
        image_url: enhancedBase64,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("enhance-image error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
