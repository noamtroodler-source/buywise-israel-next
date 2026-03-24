

# Best Cover Photo Selection for JRE + Erez Listings

## Scope
- **142 listings** with multiple images (105 JRE + 37 Erez)
- Currently `images[0]` is used as cover photo everywhere in the UI
- Goal: Use AI vision to pick the most appealing photo and move it to position [0]

## Approach — Edge Function: `select-best-covers`

### How It Works
1. Query all properties for JRE (`0eb2a33b`) and Erez (`cf4682bd`) agencies that have 2+ images
2. For each property, send the image URLs to **Gemini 2.5 Flash** (vision-capable, fast, cost-efficient) with a prompt like:
   > "Which image would make the best real estate listing cover photo? Consider: exterior shots, bright lighting, wide angles, attractive staging, curb appeal. Return the index (0-based) of the best image."
3. If the best image isn't already at index 0, reorder the images array to put it first
4. Update the property record

### Batching Strategy
- Process 10 properties at a time to stay within edge function timeout
- Accept a `batch` query param (0, 1, 2, ...) so you can invoke it multiple times: ~15 invocations to cover all 142
- Each invocation processes 10 listings, evaluating up to 12 images per listing

### AI Prompt Design
Send up to 8 image URLs per property (skip if listing has 20+ images — just use first 8). Ask Gemini to pick the single best cover based on:
- Exterior/facade shots preferred over interior details
- Good lighting and composition
- Wide-angle views that show the full space
- Avoid close-ups of fixtures, bathrooms, or construction

## Files
1. **New**: `supabase/functions/select-best-covers/index.ts` — AI-powered cover selection
2. No frontend changes needed (already uses `images[0]`)

## Execution
Deploy, invoke ~15 times with incrementing batch param, verify cover photos improved, delete function.

