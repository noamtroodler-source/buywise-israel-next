import { useParams, Link } from 'react-router-dom';
import { ExternalLink, ArrowLeft, BookOpen, Radio, Compass, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { useIntelDeepReadBySlug } from '@/hooks/useIntelDeepRead';
import { CATEGORY_BY_ID } from '@/lib/intel/categories';
import { IntelImage } from '@/components/intel/IntelImage';
import { trackIntelClick } from '@/hooks/useIntel';
import { IntelSkeleton } from '@/components/intel/IntelStates';

const SECTION_LABELS: Record<string, string> = {
  context: 'Context',
  what_changed: 'What changed',
  numbers: 'The numbers',
  what_to_watch: 'What to watch',
  caveats: 'Caveats',
};
const SECTION_ORDER = ['context', 'what_changed', 'numbers', 'what_to_watch', 'caveats'] as const;

export default function IntelDeepRead() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useIntelDeepReadBySlug(slug);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <IntelSkeleton />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="container mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Deep Read not found</h1>
          <p className="mt-2 text-muted-foreground">It may have been pulled or renamed.</p>
          <Link to="/intel" className="mt-6 inline-flex items-center gap-1 text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to Intel
          </Link>
        </div>
      </Layout>
    );
  }

  const cat = CATEGORY_BY_ID[data.category] ?? CATEGORY_BY_ID.general;
  const headline = data.headline_en || data.headline;
  const subs = data.deep_read_subheads;
  let when = '';
  try { when = formatDistanceToNow(new Date(data.published_at), { addSuffix: true }); } catch {}

  const onOpen = () => trackIntelClick({ id: data.article_id });

  return (
    <Layout>
      <SEOHead
        title={`${headline} — BuyWise Deep Read`}
        description={data.signal ?? `BuyWise editorial analysis: ${headline}`}
        canonicalUrl={`https://buywiseisrael.com/intel/deep/${data.slug}`}
      />

      <article className="container mx-auto max-w-3xl px-4 py-10 lg:py-14">
        <Link to="/intel" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> BuyWise Intel
        </Link>

        <header className="mt-6 border-b border-border pb-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-sm bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-foreground">
              <BookOpen className="h-3 w-3" />
              Deep Read
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {cat.label}
            </span>
          </div>

          <h1 className="mt-5 font-serif text-3xl font-bold leading-[1.1] tracking-tight text-foreground md:text-[2.75rem]">
            {headline}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 text-xs tabular-nums text-muted-foreground">
            <span className="font-semibold text-foreground/80">By the BuyWise desk</span>
            {when && <span>· Published {when}</span>}
            <span>· Based on reporting by {data.source_name}</span>
          </div>
        </header>

        {data.image_url && (
          <div className="mt-8">
            <IntelImage src={data.image_url} alt={headline} aspect="video" rounded />
          </div>
        )}

        {/* 3-beat summary box at top */}
        {(data.signal || data.why_you_care || data.our_move) && (
          <div className="mt-8 border-l-2 border-primary bg-primary/[0.04] pl-5 pr-4 py-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
              The short of it
            </p>
            <div className="space-y-3">
              {data.signal && <Beat icon={<Radio className="h-3 w-3" />} label="Signal" text={data.signal} />}
              {data.why_you_care && <Beat icon={<Compass className="h-3 w-3" />} label="Why you care" text={data.why_you_care} />}
              {data.our_move && <Beat icon={<Eye className="h-3 w-3" />} label="Our move" text={data.our_move} />}
            </div>
          </div>
        )}

        {/* Structured long-form */}
        {subs && (
          <div className="mt-10 space-y-8">
            {SECTION_ORDER.map((key) => {
              const text = (subs as any)[key];
              if (!text) return null;
              return (
                <section key={key}>
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                    {SECTION_LABELS[key]}
                  </h2>
                  <p className="mt-3 font-serif text-[17px] leading-[1.75] text-foreground whitespace-pre-line md:text-[18px]">
                    {text}
                  </p>
                </section>
              );
            })}
          </div>
        )}

        {!subs && data.deep_read_body && (
          <div className="mt-10">
            <p className="font-serif text-[17px] leading-[1.75] text-foreground whitespace-pre-line md:text-[18px]">
              {data.deep_read_body}
            </p>
          </div>
        )}

        <footer className="mt-12 border-t border-border pt-6">
          <a
            href={data.source_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={onOpen}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Read the original on {data.source_name}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            Editorial analysis by the BuyWise desk. We summarize and contextualize public reporting for international
            buyers; copyright in the underlying article remains with {data.source_name}. See{' '}
            <Link to="/legal/intel-attribution" className="underline hover:text-foreground">
              attribution &amp; sourcing
            </Link>
            .
          </p>
        </footer>
      </article>
    </Layout>
  );
}

function Beat({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary/80">
        {icon}<span>{label}</span>
      </div>
      <p className="text-[15px] leading-relaxed text-foreground">{text}</p>
    </div>
  );
}
