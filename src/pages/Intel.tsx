import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useIntelFeed, useIntelFeatured, IntelCategory } from '@/hooks/useIntel';
import { IntelDateline } from '@/components/intel/IntelDateline';
import { IntelTodaysTake } from '@/components/intel/IntelTodaysTake';
import { IntelWatchlist } from '@/components/intel/IntelWatchlist';
import { IntelBriefing } from '@/components/intel/IntelBriefing';
import { IntelBeatTabs, BEATS } from '@/components/intel/IntelBeatTabs';
import { IntelLongList } from '@/components/intel/IntelLongList';
import { IntelSidebar, BriefSubscribeCard } from '@/components/intel/IntelSidebar';
import { IntelSkeleton, IntelEmptyState } from '@/components/intel/IntelStates';
import { DeepReadShelf } from '@/components/intel/DeepReadShelf';

const BEAT_IDS = new Set(BEATS.map((b) => b.id));

export default function Intel() {
  const [params, setParams] = useSearchParams();

  const rawCategory = (params.get('category') as IntelCategory | 'all') ?? 'all';
  const category: IntelCategory | 'all' = BEAT_IDS.has(rawCategory) ? rawCategory : 'all';
  const takesOnly = params.get('takes') === '1';

  const setCategory = (next: IntelCategory | 'all') => {
    const merged = new URLSearchParams(params);
    if (next === 'all') merged.delete('category');
    else merged.set('category', next);
    setParams(merged, { replace: true });
  };
  const setTakesOnly = (next: boolean) => {
    const merged = new URLSearchParams(params);
    if (next) merged.set('takes', '1');
    else merged.delete('takes');
    setParams(merged, { replace: true });
  };
  const reset = () => setParams({}, { replace: true });

  const { data: featured } = useIntelFeatured(takesOnly);
  const { data: articles = [], isLoading } = useIntelFeed({
    category,
    sortBy: 'recent',
    hasTake: takesOnly,
    limit: 80,
  });

  // Count of articles in the current category that carry a Take (for the toggle badge)
  const { data: takesPoolForCount = [] } = useIntelFeed({
    category,
    sortBy: 'recent',
    hasTake: true,
    limit: 80,
  });
  const takesCount = takesPoolForCount.length;

  // Pool of non-featured articles
  const pool = useMemo(
    () => articles.filter((a) => (featured ? a.id !== featured.id : true)),
    [articles, featured],
  );

  // Watchlist: 8 most-recent headlines
  const watchlist = useMemo(() => pool.slice(0, 8), [pool]);

  // Briefing: 3 strongest stories with Takes that aren't in watchlist (or featured)
  const briefingPool = useMemo(
    () => pool.filter((a) => !!a.take_body),
    [pool],
  );
  const briefing = useMemo(() => briefingPool.slice(0, 3), [briefingPool]);
  const briefingIds = new Set(briefing.map((a) => a.id));
  const watchlistIds = new Set(watchlist.map((a) => a.id));

  // Long list: everything else
  const longList = useMemo(
    () => pool.filter((a) => !briefingIds.has(a.id) && !watchlistIds.has(a.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, briefing, watchlist],
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'BuyWise Intel — Israeli real estate news for buyers',
    url: 'https://buywiseisrael.com/intel',
    description:
      'Curated Israeli real estate, mortgage, and tax news with original BuyWise commentary for international buyers.',
  };

  return (
    <Layout>
      <SEOHead
        title="BuyWise Intel — Israeli Real Estate News for Buyers"
        description="Curated property, mortgage, tax, and policy news from Israel — with a short BuyWise Take on what each story means for international buyers."
        canonicalUrl="https://buywiseisrael.com/intel"
        jsonLd={jsonLd}
      />

      <div className="container mx-auto max-w-7xl px-4 py-6 lg:py-10">
        <IntelDateline />

        {/* Masthead */}
        <header className="mt-8 max-w-3xl md:mt-10">
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground md:text-5xl">
            BuyWise <span className="text-primary">Intel</span>
          </h1>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Israeli property, mortgages, and tax — decoded for international buyers.
          </p>
        </header>

        {/* Beat tabs */}
        <div className="mt-8">
          <IntelBeatTabs
            active={category}
            onChange={setCategory}
            takesOnly={takesOnly}
            onToggleTakesOnly={setTakesOnly}
            takesCount={takesCount}
          />
        </div>

        {/* Main spine */}
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr,320px]">
          <div className="min-w-0 space-y-14">
            {isLoading ? (
              <IntelSkeleton />
            ) : !articles.length ? (
              <IntelEmptyState onReset={reset} />
            ) : (
              <>
                {/* DealBook spine: Today's Take + Watchlist */}
                {featured && (
                  <section className="grid min-w-0 gap-10 border-b border-border pb-12 lg:grid-cols-[1.6fr,1fr] lg:gap-12">
                    <div className="min-w-0 lg:border-r lg:border-border lg:pr-12">
                      <IntelTodaysTake article={featured} />
                    </div>
                    <div className="min-w-0">
                      <IntelWatchlist articles={watchlist} />
                    </div>
                  </section>
                )}

                {!featured && watchlist.length > 0 && (
                  <section className="border-b border-border pb-12">
                    <IntelWatchlist articles={watchlist} title="What we're watching" />
                  </section>
                )}

                {/* Deep Reads shelf */}
                <DeepReadShelf />

                {/* The Briefing */}
                {briefing.length > 0 && (
                  <IntelBriefing articles={briefing} />
                )}

                {/* The Long List */}
                {longList.length > 0 && <IntelLongList articles={longList} />}
              </>
            )}
          </div>

          <div className="hidden lg:block">
            <IntelSidebar />
          </div>
        </div>

        {/* Mobile subscribe */}
        <div className="mt-14 lg:hidden">
          <BriefSubscribeCard />
        </div>
      </div>
    </Layout>
  );
}
