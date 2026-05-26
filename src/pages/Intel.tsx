import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useIntelFeed, useIntelFeatured, useIntelSources, IntelCategory } from '@/hooks/useIntel';
import { IntelArticleCard } from '@/components/intel/IntelArticleCard';
import { IntelHeadlineRow } from '@/components/intel/IntelHeadlineRow';
import { IntelFilterBar } from '@/components/intel/IntelFilterBar';
import { IntelSidebar, BriefSubscribeCard } from '@/components/intel/IntelSidebar';
import { IntelSkeleton, IntelEmptyState } from '@/components/intel/IntelStates';

const ALL_CATEGORIES: (IntelCategory | 'all')[] = [
  'all', 'property-market', 'mortgage-rates', 'tax-legal',
  'city-spotlight', 'new-developments', 'macro-economy',
  'aliyah-immigration', 'policy-regulation', 'general',
];

export default function Intel() {
  const [params, setParams] = useSearchParams();

  const category = (params.get('category') as IntelCategory | 'all') ?? 'all';
  const source = params.get('source') ?? 'all';
  const sortBy = (params.get('sort') as 'recent' | 'relevance') ?? 'recent';
  const search = params.get('q') ?? '';
  const safeCategory = ALL_CATEGORIES.includes(category) ? category : 'all';

  const update = (next: Record<string, string | undefined>) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === 'all' || v === 'recent') {
        merged.delete(k);
      } else {
        merged.set(k, String(v));
      }
    });
    setParams(merged, { replace: true });
  };

  const reset = () => setParams({}, { replace: true });

  const { data: sources = [] } = useIntelSources();
  const { data: featured } = useIntelFeatured();
  const { data: articles = [], isLoading } = useIntelFeed({
    category: safeCategory,
    source,
    sortBy,
    search,
    limit: 60,
  });

  // Remove featured + "general" noise from list pools
  const visible = useMemo(
    () => articles.filter((a) => (featured ? a.id !== featured.id : true)),
    [articles, featured],
  );

  // Split: cards with Takes get hero/grid treatment, everything else falls to the compact list
  const withTakes = useMemo(
    () => visible.filter((a) => !!a.take_body).slice(0, 4),
    [visible],
  );
  const takeIds = new Set(withTakes.map((a) => a.id));
  const headlines = useMemo(
    () => visible.filter((a) => !takeIds.has(a.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible, withTakes],
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'BuyWise Intel — Israeli real estate news for buyers',
    url: 'https://buywiseisrael.com/intel',
    description: 'Curated Israeli real estate, mortgage, and tax news with original BuyWise commentary for international buyers.',
  };

  return (
    <Layout>
      <SEOHead
        title="BuyWise Intel — Israeli Real Estate News for Buyers"
        description="Curated property, mortgage, tax, and policy news from Israel — with a short BuyWise Take on what each story means for international buyers."
        canonicalUrl="https://buywiseisrael.com/intel"
        jsonLd={jsonLd}
      />

      <div className="container mx-auto px-4 py-10 lg:py-14">
        {/* Quieter, calmer header */}
        <header className="mb-10 max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Learn · Intel
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            BuyWise Intel
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Israeli property, mortgage, and tax news that actually matters for international buyers — with a short BuyWise Take on the stories worth slowing down for.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[1fr,300px]">
          <div className="min-w-0">
            <IntelFilterBar
              category={safeCategory}
              source={source}
              sortBy={sortBy}
              search={search}
              sources={sources as any}
              onChange={(n) => update({
                category: n.category,
                source: n.source,
                sort: n.sortBy,
                q: n.search,
              })}
              onReset={reset}
            />

            {isLoading ? (
              <IntelSkeleton />
            ) : !articles.length ? (
              <IntelEmptyState onReset={reset} />
            ) : (
              <div className="space-y-14">
                {/* Tier 1 — Featured */}
                {featured && (
                  <section>
                    <IntelArticleCard article={featured} variant="featured" />
                  </section>
                )}

                {/* Tier 2 — BuyWise Takes */}
                {withTakes.length > 0 && (
                  <section>
                    <SectionHeader
                      eyebrow="The BuyWise Take"
                      title="Stories worth slowing down for"
                      subtitle="Our editorial read on what each story means for your decision."
                    />
                    <div className="grid gap-5 md:grid-cols-2">
                      {withTakes.map((a) => (
                        <IntelArticleCard key={a.id} article={a} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Tier 3 — Compact headlines */}
                {headlines.length > 0 && (
                  <section>
                    <SectionHeader
                      eyebrow="Latest"
                      title="The rest of the feed"
                      subtitle="Headlines we're tracking. Click through to the original source."
                    />
                    <div className="rounded-lg border border-border/60 bg-card px-5">
                      {headlines.map((a) => (
                        <IntelHeadlineRow key={a.id} article={a} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <IntelSidebar />
          </div>
        </div>

        {/* Mobile: subscribe card at the end */}
        <div className="mt-12 lg:hidden">
          <BriefSubscribeCard />
        </div>
      </div>
    </Layout>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
