import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── PURE-JS AVERAGE HASH (aHash) ──────────────────────────────────────────
// Resize image to 8x8 grayscale using nearest-neighbor sampling, then produce
// a 64-bit perceptual fingerprint. Visually similar images (resized,
// recompressed, watermarked) yield hashes with low Hamming distance.

/** Decode JPEG/PNG/WebP to raw RGBA pixels using ImageMagick WASM */
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
} from "npm:@imagemagick/magick-wasm@0.0.30";

let wasmReady = false;

async function ensureWasm() {
  if (!wasmReady) {
    await initializeImageMagick(
      new URL("https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.30/dist/magick.wasm")
    );
    wasmReady = true;
  }
}

/** Compute average hash (aHash) – returns 16-char hex string (64-bit). */
function computeAHash(pixels: Uint8Array, width: number, height: number, channels: number): string {
  // Convert to 8x8 grayscale using nearest-neighbor sampling
  const gray8x8 = new Float64Array(64);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const srcX = Math.floor((x / 8) * width);
      const srcY = Math.floor((y / 8) * height);
      const idx = (srcY * width + srcX) * channels;
      // Luminance: 0.299R + 0.587G + 0.114B
      const r = pixels[idx] || 0;
      const g = pixels[idx + 1] || 0;
      const b = pixels[idx + 2] || 0;
      gray8x8[y * 8 + x] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
  }

  // Compute mean
  let sum = 0;
  for (let i = 0; i < 64; i++) sum += gray8x8[i];
  const mean = sum / 64;

  // Build 64-bit hash: 1 if pixel >= mean, 0 otherwise
  // Encode as 16-char hex
  let hex = "";
  for (let i = 0; i < 64; i += 4) {
    let nibble = 0;
    for (let b = 0; b < 4; b++) {
      if (gray8x8[i + b] >= mean) nibble |= (1 << (3 - b));
    }
    hex += nibble.toString(16);
  }
  return hex;
}

/** Compute SHA-256 of raw bytes, return hex string. */
async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_url, property_id, store } = await req.json();
    if (!image_url) throw new Error("image_url is required");

    // Download image
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);

    const imgBytes = new Uint8Array(await imgRes.arrayBuffer());

    // Skip very large images (>10MB)
    if (imgBytes.byteLength > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ success: false, reason: "too_large" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute SHA-256
    const sha256 = await computeSha256(imgBytes.buffer);

    // Compute aHash using ImageMagick for pixel access
    await ensureWasm();

    let phash = "0000000000000000";
    ImageMagick.read(imgBytes, (image) => {
      const w = image.width;
      const h = image.height;
      // Get raw RGBA pixels
      image.write(MagickFormat.Rgba, (rgba) => {
        phash = computeAHash(new Uint8Array(rgba), w, h, 4);
      });
    });

    // Optionally store in image_hashes table
    if (store && property_id) {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await sb.from("image_hashes").upsert(
        { property_id, image_url, sha256, phash },
        { onConflict: "image_url" }
      );
    }

    // Find similar images if requested
    let similar: any[] = [];
    if (store && property_id) {
      const sb = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      const { data } = await sb.rpc("find_similar_images", {
        p_phash: phash,
        p_threshold: 5,
        p_exclude_property_id: property_id,
        p_limit: 5,
      });
      similar = data || [];
    }

    return new Response(
      JSON.stringify({ success: true, sha256, phash, similar }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("compute-image-hash error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
