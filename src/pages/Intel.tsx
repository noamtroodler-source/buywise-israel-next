import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useIntelFeed, useIntelFeatured, useIntelSources, IntelCategory } from '@/hooks/useIntel';
import { IntelArticleCard } from '@/components/intel/IntelArticleCard';
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
  const hasTake = params.get('take') === '1';
  const search = params.get('q') ?? '';
  const safeCategory = ALL_CATEGORIES.includes(category) ? category : 'all';

  const update = (next: Record<string, string | boolean | undefined>) => {
    const merged = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === '' || v === 'all' || v === false || v === 'recent') {
        merged.delete(k);
      } else {
        merged.set(k, v === true ? '1' : String(v));
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
    hasTake,
    search,
    limit: 60,
  });

  // De-dupe featured from the grid
  const gridArticles = useMemo(
    () => (featured ? articles.filter((a) => a.id !== featured.id) : articles),
    [articles, featured],
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
        <header className="mb-8 max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">Learn · Intel</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            BuyWise Intel
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            The Israeli stories that actually matter for international buyers —
            curated hourly, with a short BuyWise Take so you know what each one
            means for your decision.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1fr,300px]">
          <div className="min-w-0">
            <IntelFilterBar
              category={safeCategory}
              source={source}
              sortBy={sortBy}
              hasTake={hasTake}
              search={search}
              sources={sources as any}
              onChange={(n) => update({
                category: n.category,
                source: n.source,
                sort: n.sortBy,
                take: n.hasTake,
                q: n.search,
              })}
              onReset={reset}
            />

            {isLoading ? (
              <IntelSkeleton />
            ) : !articles.length ? (
              <IntelEmptyState onReset={reset} />
            ) : (
              <>
                {featured && (
                  <div className="mb-6">
                    <IntelArticleCard article={featured} variant="featured" />
                  </div>
                )}

                <div className="grid gap-5 md:grid-cols-2">
                  {gridArticles.map((a, i) => (
                    <FeedItem key={a.id} index={i} article={a} />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="hidden lg:block">
            <IntelSidebar />
          </div>
        </div>

        {/* Mobile: subscribe card at the end */}
        <div className="mt-10 lg:hidden">
          <BriefSubscribeCard />
        </div>
      </div>
    </Layout>
  );
}

function FeedItem({ article, index }: { article: any; index: number }) {
  // Inject a soft prompt every 10 cards (mobile) — kept lightweight, no extra CTA noise
  if (index > 0 && index % 10 === 0) {
    return (
      <>
        <IntelArticleCard article={article} />
      </>
    );
  }
  return <IntelArticleCard article={article} />;
}
