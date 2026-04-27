import { createClient } from "npm:@supabase/supabase-js@2";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
} from "npm:@imagemagick/magick-wasm@0.0.30";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SIZES = [
  { name: "thumb", width: 300 },
  { name: "medium", width: 800 },
  { name: "full", width: 1600 },
] as const;

const MIN_DIMENSION = 200;
const MAX_SOURCE_BYTES = 5 * 1024 * 1024; // 5MB

let wasmInitialized = false;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source_url, bucket, base_path } = await req.json();
    if (!source_url || !bucket || !base_path) {
      throw new Error("source_url, bucket, and base_path are required");
    }

    // Download source image
    const imgRes = await fetch(source_url);
    if (!imgRes.ok) {
      throw new Error(`Failed to fetch source image: ${imgRes.status}`);
    }

    const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

    // Skip if too large for edge function memory
    if (imgBytes.byteLength > MAX_SOURCE_BYTES) {
      console.log(`Image too large (${imgBytes.byteLength} bytes), skipping optimization`);
      return new Response(
        JSON.stringify({ success: true, optimized: false, reason: "too_large", urls: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize ImageMagick WASM (once per cold start)
    if (!wasmInitialized) {
      await initializeImageMagick(
        new URL("https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.30/dist/magick.wasm")
      );
      wasmInitialized = true;
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const urls: Record<string, string> = {};

    ImageMagick.read(imgBytes, (image) => {
      const origWidth = image.width;
      const origHeight = image.height;

      // Validate minimum dimensions
      if (origWidth < MIN_DIMENSION || origHeight < MIN_DIMENSION) {
        throw new Error(`Image too small: ${origWidth}x${origHeight}`);
      }

      for (const size of SIZES) {
        // Don't upscale — only resize if image is wider than target
        if (origWidth > size.width) {
          const geometry = new MagickGeometry(size.width, 0);
          geometry.ignoreAspectRatio = false;
          image.resize(geometry);
        }

        image.write(MagickFormat.WebP, (data) => {
          const path = `${base_path}/${size.name}.webp`;
          // Store for upload after we exit the callback
          urls[size.name] = path;

          // We need to upload synchronously-ish, so we'll collect the data
          const buffer = new Uint8Array(data);
          // Store buffer for async upload below
          (urls as any)[`_buf_${size.name}`] = buffer;
        });

        // Reset to original size for next variant
        if (origWidth > size.width) {
          image.resize(new MagickGeometry(origWidth, origHeight));
        }
      }
    });

    // Upload all variants
    const uploadResults: Record<string, string> = {};
    for (const size of SIZES) {
      const path = urls[size.name];
      const buffer = (urls as any)[`_buf_${size.name}`] as Uint8Array;
      if (!path || !buffer) continue;

      const { error: uploadErr } = await sb.storage
        .from(bucket)
        .upload(path, buffer, { contentType: "image/webp", upsert: true });

      if (uploadErr) {
        console.error(`Upload error for ${size.name}:`, uploadErr.message);
        continue;
      }

      const { data: urlData } = sb.storage.from(bucket).getPublicUrl(path);
      if (urlData?.publicUrl) {
        uploadResults[size.name] = urlData.publicUrl;
      }
    }

    // Need at least the medium variant to consider it successful
    if (!uploadResults.medium) {
      return new Response(
        JSON.stringify({ success: true, optimized: false, reason: "upload_failed", urls: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Optimized image: ${Object.keys(uploadResults).length} variants created`);

    return new Response(
      JSON.stringify({ success: true, optimized: true, urls: uploadResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("optimize-image error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        optimized: false,
        reason: error instanceof Error ? error.message : "Unknown error",
        urls: null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
