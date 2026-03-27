/**
 * BuyWise Israel — SSR Meta Injection (Vercel Serverless Function)
 *
 * Lives in api/ so Vercel recognises it as a serverless function.
 * Note: distPath goes UP one level (../dist) because this file is inside api/.
 */

import express, { type Request, type Response } from 'express'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ''

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// api/ is one level below project root → dist is at ../dist
const distPath = join(__dirname, '..', 'dist')
let templateHtml: string

try {
  templateHtml = readFileSync(join(distPath, 'index.html'), 'utf-8')
} catch {
  templateHtml =
    '<html><head><!--SSR_META_START--><!--SSR_META_END--></head><body><div id="root"></div></body></html>'
}

const SITE_URL = 'https://buywiseisrael.com'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function compactPrice(price: number, currency = 'ILS'): string {
  const symbol = currency === 'USD' ? '$' : '₪'
  if (price >= 1_000_000) return `${symbol}${parseFloat((price / 1_000_000).toFixed(1))}M`
  return `${symbol}${price.toLocaleString()}`
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Apartment', garden_apartment: 'Garden Apartment', penthouse: 'Penthouse',
  mini_penthouse: 'Mini Penthouse', duplex: 'Duplex', house: 'House', cottage: 'Cottage',
  studio: 'Studio', townhouse: 'Townhouse', villa: 'Villa', commercial: 'Commercial Property',
}
const PROJECT_STATUS_LABELS: Record<string, string> = {
  planning: 'Planning', pre_sale: 'Pre-Sale', under_construction: 'Under Construction',
  completed: 'Completed', delivery: 'Delivery', foundation: 'Foundation',
  structure: 'Structure', finishing: 'Finishing',
}

function injectMeta(
  title: string,
  description: string,
  canonicalUrl: string,
  image?: string | null,
  extraJsonLd?: object,
): string {
  const img = image || DEFAULT_OG_IMAGE
  const t = esc(title)
  const d = esc(description)
  const jsonLdTag = extraJsonLd
    ? `\n    <script type="application/ld+json">${JSON.stringify(extraJsonLd)}</script>`
    : ''

  const block = `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${canonicalUrl}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${esc(img)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${esc(img)}" />${jsonLdTag}`

  return templateHtml.replace(
    /<!--SSR_META_START-->[\s\S]*?<!--SSR_META_END-->/,
    `<!--SSR_META_START-->${block}\n    <!--SSR_META_END-->`,
  )
}

function sendHtml(res: Response, html: string) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=60')
  res.send(html)
}

function fallback(res: Response) {
  res.sendFile(join(distPath, 'index.html'))
}

// Serve built static assets (JS, CSS, images, fonts)
app.use(express.static(distPath, { maxAge: '1y', immutable: true, index: false }))

// SSR: Homepage
app.get('/', (_req, res) => {
  sendHtml(
    res,
    injectMeta(
      'BuyWise Israel | Property Discovery for International Buyers',
      'Compare 30+ Israeli markets, calculate taxes & costs, and connect with verified agents — all in English, built for international buyers.',
      SITE_URL,
    ),
  )
})

// SSR: Property detail
app.get('/property/:id', async (req: Request, res: Response) => {
  try {
    const { data: p } = await supabase
      .from('properties')
      .select(
        'id, title, bedrooms, size_sqm, price, currency, city, neighborhood, property_type, listing_status, description, condition, features, featured_highlight, images, is_furnished',
      )
      .eq('id', req.params.id)
      .eq('is_published', true)
      .single()

    if (!p) return fallback(res)

    const typeLabel = PROPERTY_TYPE_LABELS[p.property_type ?? 'apartment'] ?? 'Property'
    const isRent = p.listing_status === 'for_rent'
    const location = p.neighborhood ? `${p.neighborhood}, ${p.city}` : p.city
    const price = compactPrice(p.price, p.currency)
    const priceStr = isRent ? `${price}/mo` : price
    const bedsPrefix = p.bedrooms ? `${p.bedrooms}BR ` : ''
    const verb = isRent ? 'for Rent' : 'for Sale'
    const title = `${bedsPrefix}${typeLabel} ${verb} in ${location} | ${priceStr} | BuyWise Israel`

    const specParts: string[] = []
    if (p.bedrooms) specParts.push(`${p.bedrooms}BR`)
    if (p.size_sqm) specParts.push(`${p.size_sqm}sqm`)
    const spec = specParts.length
      ? `${specParts.join(' · ')} ${typeLabel.toLowerCase()} ${verb.toLowerCase()} in ${location} · ${priceStr}.`
      : `${typeLabel} ${verb.toLowerCase()} in ${location} · ${priceStr}.`

    let hook = ''
    if (p.featured_highlight) hook = p.featured_highlight.trim().replace(/\.$/, '') + '.'
    else if (p.condition && p.condition !== 'standard') hook = `${p.condition.replace(/_/g, ' ')} condition.`
    else if (p.is_furnished) hook = 'Fully furnished.'
    else if (p.features?.length) hook = p.features[0] + '.'

    const cta = isRent
      ? 'Compare vaad bayit costs & rental market data on BuyWise.'
      : 'See price trends, arnona rates & similar listings on BuyWise.'

    let description = `${spec} ${cta}`
    if (hook) {
      const withHook = `${spec} ${hook} ${cta}`
      if (withHook.length <= 160) description = withHook
    }
    if (description.length > 160) description = description.slice(0, 157) + '...'

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: title,
      description: p.description ?? description,
      url: `${SITE_URL}/property/${p.id}`,
      image: p.images?.[0] ?? DEFAULT_OG_IMAGE,
      offers: { '@type': 'Offer', price: p.price, priceCurrency: p.currency ?? 'ILS' },
    }

    sendHtml(res, injectMeta(title, description, `${SITE_URL}/property/${p.id}`, p.images?.[0], jsonLd))
  } catch {
    fallback(res)
  }
})

// SSR: City / Area detail
app.get('/areas/:slug', async (req: Request, res: Response) => {
  try {
    const { data: city } = await supabase
      .from('cities')
      .select('name, slug, description, average_price_sqm, median_apartment_price, population, region')
      .eq('slug', req.params.slug)
      .single()

    if (!city) return fallback(res)

    const { count } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('city', city.name)
      .eq('is_published', true)

    const title = `Real Estate in ${city.name} | Market Data & Properties | BuyWise Israel`
    let description = `Explore ${city.name} real estate: current prices, market trends, and available properties.`
    if (city.average_price_sqm)
      description += ` Average ₪${Math.round(city.average_price_sqm).toLocaleString()}/sqm.`
    if (count && count > 0) description += ` ${count} listings available.`
    description += ' BuyWise Israel.'
    if (description.length > 160) description = description.slice(0, 157) + '...'

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description,
      url: `${SITE_URL}/areas/${city.slug}`,
    }

    sendHtml(res, injectMeta(title, description, `${SITE_URL}/areas/${city.slug}`, null, jsonLd))
  } catch {
    fallback(res)
  }
})

// SSR: Blog post
app.get('/blog/:slug', async (req: Request, res: Response) => {
  try {
    const { data: post } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, cover_image, published_at, category:blog_categories(name)')
      .eq('slug', req.params.slug)
      .eq('is_published', true)
      .single()

    if (!post) return fallback(res)

    const title = `${post.title} | BuyWise Israel`
    let description: string = post.excerpt ?? ''
    if (!description && post.content)
      description = post.content.replace(/[#*`[\]()>_~]/g, '').trim().slice(0, 160)
    if (!description)
      description = `Read ${post.title} on BuyWise Israel. Expert insights on Israeli real estate.`
    if (description.length > 160) description = description.slice(0, 157) + '...'

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description,
      url: `${SITE_URL}/blog/${post.slug}`,
      image: post.cover_image ?? DEFAULT_OG_IMAGE,
      publisher: { '@type': 'Organization', name: 'BuyWise Israel', url: SITE_URL },
      datePublished: post.published_at,
    }

    sendHtml(
      res,
      injectMeta(title, description, `${SITE_URL}/blog/${post.slug}`, post.cover_image, jsonLd),
    )
  } catch {
    fallback(res)
  }
})

// SSR: Project detail
app.get('/projects/:slug', async (req: Request, res: Response) => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select(
        'id, name, slug, city, neighborhood, description, status, total_units, price_from, price_to, currency, completion_date, images, developer:developers(name)',
      )
      .eq('slug', req.params.slug)
      .single()

    if (!project) return fallback(res)

    const location = project.neighborhood ? `${project.neighborhood}, ${project.city}` : project.city
    const statusLabel = PROJECT_STATUS_LABELS[project.status] ?? project.status
    const priceFrom = project.price_from
      ? `from ${compactPrice(project.price_from, project.currency ?? 'ILS')}`
      : ''
    const developerText = (project.developer as { name?: string } | null)?.name
      ? ` by ${(project.developer as { name: string }).name}`
      : ''
    const completionText = project.completion_date
      ? `Delivery ${new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}. `
      : ''

    let title = `${project.name} | New Development in ${location}`
    if (priceFrom) title += ` | ${priceFrom.charAt(0).toUpperCase() + priceFrom.slice(1)}`
    title += ' | BuyWise Israel'

    let description =
      `${project.name}: ${project.total_units ? `${project.total_units} units ` : ''}in ${location}${developerText}. ` +
      `${statusLabel}. ${priceFrom ? `Prices start ${compactPrice(project.price_from!, project.currency ?? 'ILS')}. ` : ''}` +
      `${completionText}Floor plans, pricing & developer history on BuyWise.`
    if (description.length > 160) description = description.slice(0, 157) + '...'

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: project.name,
      description,
      url: `${SITE_URL}/projects/${project.slug}`,
      image: (project.images as string[] | null)?.[0] ?? DEFAULT_OG_IMAGE,
    }

    sendHtml(
      res,
      injectMeta(
        title,
        description,
        `${SITE_URL}/projects/${project.slug}`,
        (project.images as string[] | null)?.[0],
        jsonLd,
      ),
    )
  } catch {
    fallback(res)
  }
})

// SPA fallback for all other routes
app.get('*', (_req, res) => {
  fallback(res)
})

export default app
