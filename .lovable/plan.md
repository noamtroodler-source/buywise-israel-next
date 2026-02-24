

# Tighten AI Image Enhancement Prompt

## Overview
Update the image enhancement prompt in the edge function to strictly limit corrections to **technical photo quality only** — the digital equivalent of Lightroom Auto-Enhance. No content changes, no HDR look, no "AI feel."

## Changes

### File: `supabase/functions/enhance-image/index.ts`

Replace the current open-ended prompt with a strict technical-correction-only prompt that:

- Limits to: white balance, exposure, sharpness, noise reduction, lens distortion
- Explicitly forbids: adding/removing objects, changing colors of walls/surfaces, sky replacement, HDR effects, saturation boosting beyond natural levels
- Anchors output with: "The result must be indistinguishable from a well-shot photo of the exact same scene"
- Keeps the tone realistic and natural — as if a professional photographer took the same photo with better equipment and lighting

### New prompt (replacing the current one):
> "Apply only technical photo corrections to this real estate image. Allowed adjustments: white balance correction, exposure/brightness normalization, sharpness enhancement, noise reduction, and minor lens distortion correction. Do NOT add, remove, or move any objects. Do NOT change wall colors, floor materials, or surface finishes. Do NOT replace or enhance the sky. Do NOT apply HDR effects or boost saturation beyond natural levels. Do NOT make rooms appear larger or alter geometry. The result must look like the same photo taken with a better camera and proper lighting — indistinguishable from reality."

No other files need to change — the prompt is the only thing controlling the AI's behavior.

