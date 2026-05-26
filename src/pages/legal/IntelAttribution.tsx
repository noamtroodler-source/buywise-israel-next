import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';

export default function IntelAttribution() {
  return (
    <Layout>
      <SEOHead
        title="Intel Attribution & Sourcing — BuyWise Israel"
        description="How BuyWise Intel sources, summarizes, and credits the reporting we build editorial commentary on."
        canonicalUrl="https://buywiseisrael.com/legal/intel-attribution"
      />
      <article className="container mx-auto max-w-3xl px-4 py-12 lg:py-16">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">BuyWise Intel</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Attribution &amp; sourcing
        </h1>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground/90">
          <p>
            BuyWise Intel is an editorial product for international buyers in Israel. We aggregate public reporting from
            licensed Israeli and English-language outlets, summarize the headline and a short excerpt, and add original
            commentary — what we call a <strong>Breakdown</strong> or, on the rare story that warrants it, a{' '}
            <strong>Deep Read</strong>.
          </p>

          <h2 className="text-xl font-semibold text-foreground">What we publish</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>The original outlet's headline (translated to English when needed).</li>
            <li>A short factual excerpt (1–2 sentences) summarizing the article.</li>
            <li>A link back to the original article on the publisher's site.</li>
            <li>
              Our own editorial commentary — Signal, Why you care, and Our move — written by the BuyWise desk and clearly
              labeled as opinion.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">What we don't do</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>We do not republish full articles or paywalled content.</li>
            <li>We do not host outlet images on our servers; we hot-link the publisher's image with a referrer.</li>
            <li>We do not scrape behind paywalls or bypass technical protections.</li>
            <li>We do not pretend our commentary is the original reporting — it sits in a clearly marked block.</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Fair use &amp; takedowns</h2>
          <p>
            Our summaries (a headline plus an excerpt under 60 words) and original editorial commentary fall within
            customary news-aggregation and fair-use practice. If you are a rights holder and would like a specific item
            removed, email <a className="text-primary hover:underline" href="mailto:editorial@buywiseisrael.com">editorial@buywiseisrael.com</a>{' '}
            with the URL. We'll act within two business days.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Our editorial standards</h2>
          <p>
            Breakdowns are AI-drafted in the BuyWise voice and auto-published. Deep Reads are AI-drafted and
            <strong> reviewed by a human editor</strong> before publication. We never invent numbers, never quote
            statements that don't appear in the source, and label every translated headline as <code>HE → EN</code>.
            When we're unsure, we say so.
          </p>
        </div>
      </article>
    </Layout>
  );
}
