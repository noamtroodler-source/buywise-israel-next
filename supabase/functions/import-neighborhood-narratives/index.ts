import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ParsedNeighborhood {
  city: string;
  neighborhood: string;
  narrative: string;
  best_for: string;
}

function parseMarkdown(markdown: string): ParsedNeighborhood[] {
  const results: ParsedNeighborhood[] = [];
  // Match ## City — Neighborhood headers (supports both — and -)
  const sectionRegex = /^## (.+?)\s*[—–-]\s*(.+)$/gm;
  const sections: { city: string; neighborhood: string; startIndex: number }[] = [];

  let match;
  while ((match = sectionRegex.exec(markdown)) !== null) {
    sections.push({
      city: match[1].trim(),
      neighborhood: match[2].trim(),
      startIndex: match.index + match[0].length,
    });
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const endIndex = i + 1 < sections.length ? sections[i + 1].startIndex - sections[i + 1].neighborhood.length - sections[i + 1].city.length - 10 : markdown.length;
    const content = markdown.slice(section.startIndex, endIndex).trim();

    // Split into narrative and best_for
    const bestForMatch = content.match(/\*\*Best for:\*\*\s*(.+)/s);
    let narrative = content;
    let bestFor = "";

    if (bestForMatch) {
      narrative = content.slice(0, bestForMatch.index).trim();
      bestFor = bestForMatch[1].trim();
    }

    // Clean up: remove leading/trailing ---, whitespace, etc.
    narrative = narrative
      .replace(/^---+\s*/gm, "")
      .replace(/\s*---+\s*$/gm, "")
      .trim();

    // Remove any trailing "---" sections
    if (bestFor.includes("---")) {
      bestFor = bestFor.split("---")[0].trim();
    }

    if (narrative && narrative.length > 20) {
      results.push({
        city: section.city,
        neighborhood: section.neighborhood,
        narrative,
        best_for: bestFor,
      });
    }
  }

  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { markdown } = await req.json();

    if (!markdown || typeof markdown !== "string") {
      return new Response(JSON.stringify({ error: "markdown string required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseMarkdown(markdown);
    let updated = 0;
    let created = 0;
    const errors: string[] = [];

    for (const item of parsed) {
      // Try to update existing row first
      const { data: existing } = await adminClient
        .from("neighborhood_profiles")
        .select("id")
        .eq("city", item.city)
        .eq("neighborhood", item.neighborhood)
        .maybeSingle();

      if (existing) {
        const { error } = await adminClient
          .from("neighborhood_profiles")
          .update({
            narrative: item.narrative,
            best_for: item.best_for || null,
          })
          .eq("id", existing.id);

        if (error) {
          errors.push(`Update ${item.city}/${item.neighborhood}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        // Create new row
        const { error } = await adminClient
          .from("neighborhood_profiles")
          .insert({
            city: item.city,
            neighborhood: item.neighborhood,
            narrative: item.narrative,
            best_for: item.best_for || null,
          });

        if (error) {
          errors.push(`Insert ${item.city}/${item.neighborhood}: ${error.message}`);
        } else {
          created++;
        }
      }
    }

    return new Response(
      JSON.stringify({ parsed: parsed.length, updated, created, errors, total: parsed.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
