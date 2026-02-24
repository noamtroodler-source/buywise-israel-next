import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ─── DISCOVER ───────────────────────────────────────────────────────────────

async function handleDiscover(body: any) {
  const { agency_id, website_url } = body;
  if (!agency_id || !website_url) throw new Error("agency_id and website_url required");

  const sb = supabaseAdmin();

  // Verify agency exists
  const { data: agency, error: agencyErr } = await sb
    .from("agencies")
    .select("id, admin_user_id")
    .eq("id", agency_id)
    .single();
  if (agencyErr || !agency) throw new Error("Agency not found");

  // 1. Firecrawl MAP — discover all URLs
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");

  let formattedUrl = website_url.trim();
  if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;

  console.log("Mapping URL:", formattedUrl);
  const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: formattedUrl, limit: 500, includeSubdomains: false }),
  });

  const mapData = await mapRes.json();
  if (!mapRes.ok) throw new Error(`Firecrawl MAP failed: ${JSON.stringify(mapData)}`);

  const allUrls: string[] = mapData.links || mapData.data || [];
  if (allUrls.length === 0) throw new Error("No URLs discovered on this website");

  console.log(`Discovered ${allUrls.length} total URLs`);

  // 2. AI filter — which are listing or project pages?
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const filterPrompt = `You are analyzing URLs from a real estate agency website. 
Given this list of URLs, identify which ones are individual property/listing detail pages OR project/development pages (not category pages, contact pages, about pages, blog posts, etc.).

Look for URL patterns that suggest individual listings, such as:
- URLs containing property IDs, slugs, or numeric identifiers
- URLs with paths like /property/, /listing/, /נכס/, /דירה/, etc.
- URLs that look like they point to a single property page

Also look for project/development pages:
- URLs with paths like /project/, /פרויקט/, /development/, /בנייה-חדשה/, /new-construction/
- URLs that point to a new construction development page

Return ONLY the listing and project URLs as a JSON array of strings. If unsure about a URL, exclude it.

URLs to analyze:
${allUrls.join("\n")}`;

  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: filterPrompt }],
      tools: [
        {
          type: "function",
          function: {
            name: "return_listing_urls",
            description: "Return the filtered listing and project URLs",
            parameters: {
              type: "object",
              properties: {
                listing_urls: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of URLs that are individual listing or project pages",
                },
              },
              required: ["listing_urls"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "return_listing_urls" } },
    }),
  });

  if (!aiRes.ok) {
    const errText = await aiRes.text();
    console.error("AI filter error:", aiRes.status, errText);
    throw new Error(`AI filtering failed (${aiRes.status})`);
  }

  const aiData = await aiRes.json();
  let listingUrls: string[] = [];

  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const parsed = JSON.parse(toolCall.function.arguments);
    listingUrls = parsed.listing_urls || [];
  }

  if (listingUrls.length === 0) {
    // Fallback: if AI returned nothing, use all URLs (let process_batch handle non-listings)
    console.log("AI returned 0 listing URLs, using all discovered URLs as fallback");
    listingUrls = allUrls.slice(0, 100); // Cap at 100
  }

  console.log(`AI identified ${listingUrls.length} listing URLs`);

  // 3. Create import_job
  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .insert({
      agency_id,
      website_url: formattedUrl,
      status: "ready",
      total_urls: listingUrls.length,
      discovered_urls: allUrls,
    })
    .select("id")
    .single();
  if (jobErr) throw new Error(`Failed to create import job: ${jobErr.message}`);

  // 4. Create import_job_items
  const items = listingUrls.map((url) => ({
    job_id: job.id,
    url,
    status: "pending",
  }));

  const { error: itemsErr } = await sb.from("import_job_items").insert(items);
  if (itemsErr) throw new Error(`Failed to create job items: ${itemsErr.message}`);

  return { job_id: job.id, total_listings: listingUrls.length, total_discovered: allUrls.length };
}

// ─── PROCESS BATCH ──────────────────────────────────────────────────────────

async function handleProcessBatch(body: any) {
  const { job_id } = body;
  if (!job_id) throw new Error("job_id required");

  const sb = supabaseAdmin();
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY")!;
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  // Get job details
  const { data: job, error: jobErr } = await sb
    .from("import_jobs")
    .select("*, agencies!inner(id, admin_user_id)")
    .eq("id", job_id)
    .single();
  if (jobErr || !job) throw new Error("Import job not found");

  // Get next 10 pending items
  const { data: pendingItems, error: itemsErr } = await sb
    .from("import_job_items")
    .select("*")
    .eq("job_id", job_id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(10);
  if (itemsErr) throw new Error(`Failed to fetch pending items: ${itemsErr.message}`);

  if (!pendingItems || pendingItems.length === 0) {
    // Mark job as completed
    await sb.from("import_jobs").update({ status: "completed" }).eq("id", job_id);
    return { processed: 0, succeeded: 0, failed: 0, remaining: 0, status: "completed" };
  }

  // Update job status
  await sb.from("import_jobs").update({ status: "processing" }).eq("id", job_id);

  // Get first agent for this agency (to assign listings)
  const { data: agents } = await sb
    .from("agents")
    .select("id")
    .eq("agency_id", job.agency_id)
    .limit(1);
  const agentId = agents?.[0]?.id || null;

  let succeeded = 0;
  let failed = 0;

  for (const item of pendingItems) {
    try {
      // Mark as processing
      await sb.from("import_job_items").update({ status: "processing" }).eq("id", item.id);

      // 1. Scrape the page
      console.log(`Scraping: ${item.url}`);
      const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: item.url,
          formats: ["markdown", "links"],
          onlyMainContent: true,
        }),
      });

      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) {
        const statusCode = scrapeRes.status;
        if (statusCode === 404 || statusCode === 410) {
          await sb.from("import_job_items").update({ status: "skipped", error_message: `Page not found (${statusCode})` }).eq("id", item.id);
          failed++;
          continue;
        }
        throw new Error(`Scrape failed: ${JSON.stringify(scrapeData)}`);
      }

      const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
      const pageLinks = scrapeData.data?.links || scrapeData.links || [];

      if (!markdown || markdown.length < 50) {
        await sb.from("import_job_items").update({ status: "skipped", error_message: "Page content too short — likely not a listing" }).eq("id", item.id);
        failed++;
        continue;
      }

      // 2. AI extraction — detect category (property vs project vs not_listing) and extract fields
      const extractionPrompt = `You are extracting structured data from a scraped Israeli real estate page.

FIRST, determine the CATEGORY of this page:
- "property": A single unit for sale or rent (resale, rental listing for one apartment/house)
- "project": A new construction project / development with multiple units, marketed by a developer. Keywords: פרויקט, project, development, new construction, בנייה חדשה, דירות חדשות, מתחם מגורים. These pages typically show a project name, multiple unit types, construction timeline, developer info, etc.
- "not_listing": Not a property listing or project page (blog, about, contact, category page, etc.)

FOR PROPERTIES — extract these fields:
- In Israel, "rooms" (חדרים) = bedrooms + 1 living room. So 4 rooms = 3 bedrooms. Always subtract 1 for bedrooms.
- Default currency is ILS (₪) unless explicitly stated otherwise.
- Property types: דירה=apartment, פנטהאוז=penthouse, דופלקס=duplex, בית/וילה=house, קוטג'=cottage, דירת גן=garden_apartment, מיני פנטהאוז=mini_penthouse
- listing_status: for_sale if buying/מכירה, for_rent if renting/השכרה
- Detect if sold (נמכר), rented (הושכר), under contract (בהסכם). Set is_sold_or_rented=true if so.
- Price might appear as "₪1,500,000" or "1,500,000 ש״ח" or "$450,000"
- Extract ALL image URLs you can find
- For floor: "קומה 3" = floor 3, "קרקע" = floor 0

FOR PROJECTS — extract these fields:
- project_name: The name of the development/project
- project_description: Description of the project
- city, neighborhood, address: Location
- price_from / price_to: Price range for units (numbers only)
- currency: ILS/USD/EUR
- total_units: Total number of units in the project
- construction_status: One of planning, pre_sale, foundation, structure, finishing, delivery, completed
- completion_date: Expected completion date (YYYY-MM-DD)
- amenities: List of project amenities
- image_urls: All image URLs found

Page URL: ${item.url}
Page content:
${markdown.substring(0, 8000)}

Links found on page:
${pageLinks.slice(0, 50).join("\n")}`;

      const extractRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: extractionPrompt }],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_listing",
                description: "Extract structured data from a real estate page — could be a property listing or a project/development",
                parameters: {
                  type: "object",
                  properties: {
                    listing_category: {
                      type: "string",
                      enum: ["property", "project", "not_listing"],
                      description: "The category of the page: property (single unit listing), project (new development), or not_listing",
                    },
                    // Property fields
                    title: { type: "string", description: "Listing title (for properties)" },
                    description: { type: "string", description: "Property description" },
                    price: { type: "number", description: "Price as number (for properties)" },
                    currency: { type: "string", enum: ["ILS", "USD", "EUR"], description: "Currency code" },
                    bedrooms: { type: "number", description: "Number of bedrooms (rooms - 1)" },
                    bathrooms: { type: "number", description: "Number of bathrooms" },
                    size_sqm: { type: "number", description: "Size in square meters" },
                    address: { type: "string", description: "Street address" },
                    city: { type: "string", description: "City name in English" },
                    neighborhood: { type: "string", description: "Neighborhood name" },
                    property_type: {
                      type: "string",
                      enum: ["apartment", "garden_apartment", "penthouse", "mini_penthouse", "duplex", "house", "cottage", "land", "commercial"],
                    },
                    listing_status: { type: "string", enum: ["for_sale", "for_rent"] },
                    floor: { type: "number", description: "Floor number" },
                    total_floors: { type: "number", description: "Total floors in building" },
                    features: { type: "array", items: { type: "string" }, description: "Features like balcony, elevator, etc." },
                    parking: { type: "number", description: "Number of parking spots" },
                    entry_date: { type: "string", description: "Entry date (YYYY-MM-DD or 'immediate')" },
                    year_built: { type: "number", description: "Year built" },
                    ac_type: { type: "string", enum: ["none", "split", "central", "mini_central"] },
                    is_sold_or_rented: { type: "boolean", description: "True if listing is sold/rented/under contract" },
                    // Project fields
                    project_name: { type: "string", description: "Name of the project/development" },
                    project_description: { type: "string", description: "Description of the project" },
                    price_from: { type: "number", description: "Lowest unit price in project" },
                    price_to: { type: "number", description: "Highest unit price in project" },
                    total_units: { type: "number", description: "Total number of units" },
                    construction_status: {
                      type: "string",
                      enum: ["planning", "pre_sale", "foundation", "structure", "finishing", "delivery", "completed"],
                      description: "Construction stage",
                    },
                    completion_date: { type: "string", description: "Expected completion (YYYY-MM-DD)" },
                    amenities: { type: "array", items: { type: "string" }, description: "Project amenities" },
                    // Shared
                    image_urls: { type: "array", items: { type: "string" }, description: "All image URLs found" },
                  },
                  required: ["listing_category"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_listing" } },
        }),
      });

      if (!extractRes.ok) {
        const errText = await extractRes.text();
        console.error("AI extraction error:", extractRes.status, errText);
        if (extractRes.status === 429) {
          await sb.from("import_job_items").update({ status: "pending", error_message: "Rate limited, will retry" }).eq("id", item.id);
          failed++;
          continue;
        }
        throw new Error(`AI extraction failed (${extractRes.status})`);
      }

      const extractData = await extractRes.json();
      const extractToolCall = extractData.choices?.[0]?.message?.tool_calls?.[0];

      if (!extractToolCall?.function?.arguments) {
        await sb.from("import_job_items").update({ status: "failed", error_message: "AI returned no extraction data" }).eq("id", item.id);
        failed++;
        continue;
      }

      const listing = JSON.parse(extractToolCall.function.arguments);

      // Store raw extraction
      await sb.from("import_job_items").update({ extracted_data: listing }).eq("id", item.id);

      const category = listing.listing_category || (listing.is_listing_page === false ? "not_listing" : "property");

      // ── NOT A LISTING / PROJECT ──
      if (category === "not_listing") {
        await sb.from("import_job_items").update({ status: "skipped", error_message: "Not a listing page" }).eq("id", item.id);
        failed++;
        continue;
      }

      // ── PROJECT PATH ──
      if (category === "project") {
        const projectName = listing.project_name || listing.title || `Imported project from ${new URL(item.url).hostname}`;
        const projectCity = listing.city || "";

        // Duplicate detection for projects — by name + city
        if (projectName && projectCity) {
          const { data: dupeProjects } = await sb
            .from("projects")
            .select("id")
            .ilike("name", projectName)
            .ilike("city", projectCity)
            .limit(1);

          if (dupeProjects && dupeProjects.length > 0) {
            await sb.from("import_job_items").update({ status: "skipped", error_message: "Duplicate project detected" }).eq("id", item.id);
            failed++;
            continue;
          }
        }

        // Download & re-host images to project-images bucket
        const imageUrls: string[] = [];
        const sourceImages = listing.image_urls || [];
        for (const imgUrl of sourceImages.slice(0, 15)) {
          try {
            const imgRes = await fetch(imgUrl);
            if (!imgRes.ok) continue;
            const contentType = imgRes.headers.get("content-type") || "image/jpeg";
            const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
            const imgBuffer = await imgRes.arrayBuffer();
            const fileName = `imports/${job_id}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadErr } = await sb.storage
              .from("project-images")
              .upload(fileName, imgBuffer, { contentType, upsert: false });
            if (!uploadErr) {
              const { data: urlData } = sb.storage.from("project-images").getPublicUrl(fileName);
              if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
            }
          } catch (imgErr) {
            console.warn("Image download failed:", imgUrl, imgErr);
          }
        }

        // Geocode
        let latitude: number | null = null;
        let longitude: number | null = null;
        const geoAddr = listing.address || projectName;
        if (geoAddr && projectCity) {
          try {
            const geoQuery = encodeURIComponent(`${geoAddr}, ${projectCity}, Israel`);
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?q=${geoQuery}&format=json&limit=1`,
              { headers: { "User-Agent": "BuyWiseIsrael/1.0" } }
            );
            const geoData = await geoRes.json();
            if (geoData?.[0]) {
              latitude = parseFloat(geoData[0].lat);
              longitude = parseFloat(geoData[0].lon);
            }
          } catch (geoErr) {
            console.warn("Geocoding failed:", geoErr);
          }
        }

        // Generate slug
        const slug = projectName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") + "-" + crypto.randomUUID().substring(0, 6);

        // Map construction_status to ProjectStatus
        const statusMap: Record<string, string> = {
          planning: "planning",
          pre_sale: "pre_sale",
          foundation: "foundation",
          structure: "structure",
          finishing: "finishing",
          delivery: "delivery",
          completed: "completed",
        };
        const projectStatus = statusMap[listing.construction_status] || "pre_sale";

        const { data: project, error: projErr } = await sb
          .from("projects")
          .insert({
            name: projectName,
            slug,
            description: listing.project_description || listing.description || null,
            city: projectCity,
            neighborhood: listing.neighborhood || null,
            address: listing.address || null,
            latitude,
            longitude,
            status: projectStatus,
            total_units: listing.total_units || 0,
            available_units: listing.total_units || 0,
            price_from: listing.price_from || null,
            price_to: listing.price_to || null,
            currency: listing.currency || "ILS",
            completion_date: listing.completion_date || null,
            amenities: listing.amenities || null,
            images: imageUrls.length > 0 ? imageUrls : null,
            is_featured: false,
            is_published: false,
            views_count: 0,
            import_source: "website_scrape",
          })
          .select("id")
          .single();

        if (projErr) {
          console.error("Project insert error:", projErr);
          await sb.from("import_job_items").update({ status: "failed", error_message: `Project insert failed: ${projErr.message}` }).eq("id", item.id);
          failed++;
          continue;
        }

        await sb.from("import_job_items").update({ status: "done", project_id: project.id }).eq("id", item.id);
        succeeded++;
        continue;
      }

      // ── PROPERTY PATH (existing logic) ──

      // Sold or rented listing?
      if (listing.is_sold_or_rented) {
        await sb.from("import_job_items").update({ status: "skipped", error_message: "Listing is sold or rented" }).eq("id", item.id);
        failed++;
        continue;
      }

      // Duplicate detection for properties
      if (listing.address && listing.city && listing.price) {
        const priceLow = listing.price * 0.95;
        const priceHigh = listing.price * 1.05;

        const { data: dupes } = await sb
          .from("properties")
          .select("id")
          .ilike("address", listing.address)
          .ilike("city", listing.city)
          .gte("price", priceLow)
          .lte("price", priceHigh)
          .limit(1);

        if (dupes && dupes.length > 0) {
          await sb.from("import_job_items").update({ status: "skipped", error_message: "Duplicate listing detected" }).eq("id", item.id);
          failed++;
          continue;
        }
      }

      // Download and re-host images
      const imageUrls: string[] = [];
      const sourceImages = listing.image_urls || [];

      for (const imgUrl of sourceImages.slice(0, 15)) {
        try {
          const imgRes = await fetch(imgUrl);
          if (!imgRes.ok) continue;

          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
          const imgBuffer = await imgRes.arrayBuffer();
          const fileName = `imports/${job_id}/${crypto.randomUUID()}.${ext}`;

          const { error: uploadErr } = await sb.storage
            .from("property-images")
            .upload(fileName, imgBuffer, { contentType, upsert: false });

          if (!uploadErr) {
            const { data: urlData } = sb.storage.from("property-images").getPublicUrl(fileName);
            if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
          }
        } catch (imgErr) {
          console.warn("Image download failed:", imgUrl, imgErr);
        }
      }

      // Geocode
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (listing.address && listing.city) {
        try {
          const geoQuery = encodeURIComponent(`${listing.address}, ${listing.city}, Israel`);
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${geoQuery}&format=json&limit=1`,
            { headers: { "User-Agent": "BuyWiseIsrael/1.0" } }
          );
          const geoData = await geoRes.json();
          if (geoData?.[0]) {
            latitude = parseFloat(geoData[0].lat);
            longitude = parseFloat(geoData[0].lon);
          }
        } catch (geoErr) {
          console.warn("Geocoding failed:", geoErr);
        }
      }

      // Insert property
      const entryDate = listing.entry_date === "immediate" ? new Date().toISOString().split("T")[0] : listing.entry_date || null;

      const { data: property, error: propErr } = await sb
        .from("properties")
        .insert({
          agent_id: agentId,
          title: listing.title || `Imported from ${new URL(item.url).hostname}`,
          description: listing.description || null,
          property_type: listing.property_type || "apartment",
          listing_status: listing.listing_status || "for_sale",
          price: listing.price || 0,
          currency: listing.currency || "ILS",
          address: listing.address || "",
          city: listing.city || "",
          neighborhood: listing.neighborhood || null,
          latitude,
          longitude,
          bedrooms: Math.floor(listing.bedrooms ?? 0),
          bathrooms: Math.floor(listing.bathrooms ?? 1),
          size_sqm: listing.size_sqm || null,
          floor: listing.floor ?? null,
          total_floors: listing.total_floors ?? null,
          year_built: listing.year_built ?? null,
          features: listing.features || [],
          images: imageUrls.length > 0 ? imageUrls : null,
          parking: listing.parking ?? 0,
          ac_type: listing.ac_type || null,
          entry_date: entryDate,
          is_published: false,
          is_featured: false,
          views_count: 0,
          verification_status: "draft",
          import_source: "website_scrape",
        })
        .select("id")
        .single();

      if (propErr) {
        console.error("Property insert error:", propErr);
        await sb.from("import_job_items").update({ status: "failed", error_message: `Insert failed: ${propErr.message}` }).eq("id", item.id);
        failed++;
        continue;
      }

      // Mark done
      await sb.from("import_job_items").update({ status: "done", property_id: property.id }).eq("id", item.id);
      succeeded++;
    } catch (err) {
      console.error(`Error processing ${item.url}:`, err);
      await sb
        .from("import_job_items")
        .update({ status: "failed", error_message: err instanceof Error ? err.message : "Unknown error" })
        .eq("id", item.id);
      failed++;
    }
  }

  // Update job counts
  const { data: counts } = await sb
    .from("import_job_items")
    .select("status")
    .eq("job_id", job_id);

  const doneCount = counts?.filter((c) => c.status === "done").length || 0;
  const failedCount = counts?.filter((c) => ["failed", "skipped"].includes(c.status)).length || 0;
  const remainingCount = counts?.filter((c) => c.status === "pending").length || 0;

  const newStatus = remainingCount === 0 ? "completed" : "ready";

  await sb
    .from("import_jobs")
    .update({ processed_count: doneCount, failed_count: failedCount, status: newStatus })
    .eq("id", job_id);

  return {
    processed: pendingItems.length,
    succeeded,
    failed,
    remaining: remainingCount,
    status: newStatus,
  };
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    let result;
    if (action === "discover") {
      result = await handleDiscover(body);
    } else if (action === "process_batch") {
      result = await handleProcessBatch(body);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("import-agency-listings error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
