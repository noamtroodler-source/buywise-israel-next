import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const SITE_URL = "https://buywiseisrael.com";

const corsHeaders = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
  "Access-Control-Allow-Origin": "*",
};

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function urlEntry(loc: string, changefreq: string, priority: string, lastmod?: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    ${lastmod ? `<lastmod>${lastmod.split("T")[0]}</lastmod>` : ""}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const entries: string[] = [];

  // Static pages
  const staticPages = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/listings", changefreq: "daily", priority: "0.9" },
    { path: "/projects", changefreq: "daily", priority: "0.9" },
    { path: "/areas", changefreq: "weekly", priority: "0.8" },
    { path: "/blog", changefreq: "daily", priority: "0.8" },
    { path: "/agencies", changefreq: "weekly", priority: "0.7" },
    { path: "/tools", changefreq: "monthly", priority: "0.7" },
    { path: "/glossary", changefreq: "monthly", priority: "0.7" },
    { path: "/guides", changefreq: "monthly", priority: "0.7" },
    { path: "/map", changefreq: "daily", priority: "0.7" },
    { path: "/guides/buying-in-israel", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/understanding-listings", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/purchase-tax", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/true-cost", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/mortgages", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/new-vs-resale", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/rent-vs-buy", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/new-construction", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/oleh-buyer", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/investment-property", changefreq: "monthly", priority: "0.6" },
    { path: "/guides/talking-to-professionals", changefreq: "monthly", priority: "0.6" },
    { path: "/principles", changefreq: "monthly", priority: "0.5" },
    { path: "/contact", changefreq: "monthly", priority: "0.5" },
    { path: "/privacy", changefreq: "yearly", priority: "0.3" },
    { path: "/terms", changefreq: "yearly", priority: "0.3" },
  ];

  for (const page of staticPages) {
    entries.push(urlEntry(`${SITE_URL}${page.path}`, page.changefreq, page.priority));
  }

  // Properties (for_sale only, most recent 5000)
  const { data: properties } = await supabase
    .from("properties")
    .select("id, updated_at")
    .eq("listing_status", "for_sale")
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (properties) {
    for (const p of properties) {
      entries.push(urlEntry(`${SITE_URL}/property/${p.id}`, "weekly", "0.7", p.updated_at));
    }
  }

  // Cities/Areas
  const { data: cities } = await supabase
    .from("cities")
    .select("slug, updated_at");

  if (cities) {
    for (const c of cities) {
      entries.push(urlEntry(`${SITE_URL}/areas/${c.slug}`, "weekly", "0.8", c.updated_at));
    }
  }

  // Projects
  const { data: projects } = await supabase
    .from("projects")
    .select("slug, updated_at")
    .limit(2000);

  if (projects) {
    for (const p of projects) {
      entries.push(urlEntry(`${SITE_URL}/projects/${p.slug}`, "weekly", "0.7", p.updated_at));
    }
  }

  // Blog posts (published only)
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("is_published", true);

  if (posts) {
    for (const p of posts) {
      entries.push(urlEntry(`${SITE_URL}/blog/${p.slug}`, "weekly", "0.6", p.updated_at));
    }
  }

  // Agencies
  const { data: agencies } = await supabase
    .from("agencies")
    .select("slug, updated_at");

  if (agencies) {
    for (const a of agencies) {
      entries.push(urlEntry(`${SITE_URL}/agencies/${a.slug}`, "weekly", "0.6", a.updated_at));
    }
  }

  // Developers
  const { data: developers } = await supabase
    .from("developers")
    .select("slug, updated_at");

  if (developers) {
    for (const d of developers) {
      entries.push(urlEntry(`${SITE_URL}/developers/${d.slug}`, "weekly", "0.6", d.updated_at));
    }
  }

  // Agents
  const { data: agents } = await supabase
    .from("agents")
    .select("id, updated_at")
    .limit(2000);

  if (agents) {
    for (const a of agents) {
      entries.push(urlEntry(`${SITE_URL}/agents/${a.id}`, "weekly", "0.5", a.updated_at));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
