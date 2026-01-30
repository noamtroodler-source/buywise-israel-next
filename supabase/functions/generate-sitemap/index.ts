import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const SITE_URL = 'https://buywiseisrael.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split('T')[0];

    // Static pages with their priorities and change frequencies
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/listings', priority: '0.9', changefreq: 'hourly' },
      { url: '/projects', priority: '0.9', changefreq: 'daily' },
      { url: '/areas', priority: '0.8', changefreq: 'weekly' },
      { url: '/blog', priority: '0.8', changefreq: 'daily' },
      { url: '/tools', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides', priority: '0.7', changefreq: 'monthly' },
      { url: '/glossary', priority: '0.6', changefreq: 'monthly' },
      { url: '/developers', priority: '0.6', changefreq: 'weekly' },
      { url: '/agencies', priority: '0.6', changefreq: 'weekly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/for-agents', priority: '0.5', changefreq: 'monthly' },
      { url: '/for-developers', priority: '0.5', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
      { url: '/terms', priority: '0.3', changefreq: 'yearly' },
      // Guide pages
      { url: '/guides/buying-in-israel', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides/understanding-listings', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides/purchase-tax', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides/true-cost', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides/talking-to-professionals', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides/mortgages', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides/new-vs-resale', priority: '0.7', changefreq: 'monthly' },
      { url: '/guides/rent-vs-buy', priority: '0.7', changefreq: 'monthly' },
    ];

    // Fetch dynamic content from database
    const [
      { data: properties },
      { data: projects },
      { data: cities },
      { data: blogPosts },
      { data: developers },
      { data: agencies },
    ] = await Promise.all([
      supabase
        .from('properties')
        .select('id, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(1000),
      supabase
        .from('projects')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(500),
      supabase
        .from('cities')
        .select('slug, updated_at')
        .order('updated_at', { ascending: false }),
      supabase
        .from('blog_posts')
        .select('slug, updated_at')
        .eq('is_published', true)
        .order('updated_at', { ascending: false })
        .limit(500),
      supabase
        .from('developers')
        .select('slug, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(200),
      supabase
        .from('agencies')
        .select('slug, updated_at')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(200),
    ]);

    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    }

    // Add properties
    if (properties) {
      for (const property of properties) {
        const lastmod = property.updated_at?.split('T')[0] || today;
        sitemap += `  <url>
    <loc>${SITE_URL}/property/${property.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add projects
    if (projects) {
      for (const project of projects) {
        const lastmod = project.updated_at?.split('T')[0] || today;
        sitemap += `  <url>
    <loc>${SITE_URL}/projects/${project.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add city/area pages
    if (cities) {
      for (const city of cities) {
        const lastmod = city.updated_at?.split('T')[0] || today;
        sitemap += `  <url>
    <loc>${SITE_URL}/areas/${city.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      }
    }

    // Add blog posts
    if (blogPosts) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at?.split('T')[0] || today;
        sitemap += `  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    // Add developers
    if (developers) {
      for (const developer of developers) {
        const lastmod = developer.updated_at?.split('T')[0] || today;
        sitemap += `  <url>
    <loc>${SITE_URL}/developers/${developer.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    // Add agencies
    if (agencies) {
      for (const agency of agencies) {
        const lastmod = agency.updated_at?.split('T')[0] || today;
        sitemap += `  <url>
    <loc>${SITE_URL}/agencies/${agency.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://buywiseisrael.com/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`,
      { headers: corsHeaders }
    );
  }
});
