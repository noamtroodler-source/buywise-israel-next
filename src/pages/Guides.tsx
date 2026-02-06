import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useEmblaCarousel from 'embla-carousel-react';
import { Calculator, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { GuideCard } from '@/components/guides';
import { CarouselDots } from '@/components/shared/CarouselDots';
import { GUIDES_BY_PHASE } from '@/lib/navigationConfig';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTrackContentVisit } from '@/hooks/useTrackContentVisit';

import buyingInIsraelHero from '@/assets/guides/buying-in-israel-hero.jpg';
import understandingListingsHero from '@/assets/guides/understanding-listings-hero.jpg';
import purchaseTaxHero from '@/assets/guides/purchase-tax-hero.jpg';
import trueCostHero from '@/assets/guides/true-cost-hero.jpg';
import talkingToProfessionalsHero from '@/assets/guides/talking-to-professionals-hero.jpg';
import mortgagesHero from '@/assets/guides/mortgages-hero.jpg';
import newVsResaleHero from '@/assets/guides/new-vs-resale-hero.jpg';
import rentVsBuyHero from '@/assets/guides/rent-vs-buy-hero.jpg';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  image: string;
  readingTime: number;
  chaptersCount: number;
  featured?: boolean;
}

// All guides with their metadata
const allGuides: Record<string, Guide> = {
  'buying-in-israel': {
    slug: 'buying-in-israel',
    title: 'Complete Guide to Buying in Israel',
    description: 'Everything you need to know about purchasing property in Israel, from search to closing.',
    image: buyingInIsraelHero,
    readingTime: 30,
    chaptersCount: 14,
    featured: true,
  },
  'understanding-listings': {
    slug: 'understanding-listings',
    title: 'Understanding Israeli Listings',
    description: 'Why listings feel misleading to internationals and how to read them with confidence.',
    image: understandingListingsHero,
    readingTime: 20,
    chaptersCount: 13,
  },
  'purchase-tax': {
    slug: 'purchase-tax',
    title: 'Purchase Tax Guide',
    description: "What foreign buyers don't realize about Mas Rechisha and how to understand the system.",
    image: purchaseTaxHero,
    readingTime: 15,
    chaptersCount: 12,
  },
  'true-cost': {
    slug: 'true-cost',
    title: 'The True Cost of Buying',
    description: 'Beyond the listing price: taxes, fees, and expenses that add up before, during, and after.',
    image: trueCostHero,
    readingTime: 18,
    chaptersCount: 11,
  },
  'talking-to-professionals': {
    slug: 'talking-to-professionals',
    title: 'What to Know Before Talking to an Agent, Lawyer, or Broker',
    description: 'Understand roles, incentives, and timing before engaging Israeli real estate professionals.',
    image: talkingToProfessionalsHero,
    readingTime: 15,
    chaptersCount: 9,
  },
  'mortgages': {
    slug: 'mortgages',
    title: 'Mortgages in Israel for Foreign Buyers',
    description: 'How Israeli mortgages actually work: pre-approval, timing, eligibility, and why the process feels opaque.',
    image: mortgagesHero,
    readingTime: 20,
    chaptersCount: 11,
  },
  'new-vs-resale': {
    slug: 'new-vs-resale',
    title: 'New Construction vs Resale in Israel',
    description: 'Distinct legal structures, payment schedules, and risks. Which path fits your situation?',
    image: newVsResaleHero,
    readingTime: 18,
    chaptersCount: 11,
  },
  'rent-vs-buy': {
    slug: 'rent-vs-buy',
    title: 'Rent vs Buy in Israel',
    description: 'How this decision works differently for foreigners—psychologically, legally, and culturally.',
    image: rentVsBuyHero,
    readingTime: 15,
    chaptersCount: 10,
  },
};

// All guides as an array for counting
const guidesArray = Object.values(allGuides);
const totalReadingTime = guidesArray.reduce((sum, g) => sum + g.readingTime, 0);

// Journey phase order
const phaseOrder = ['understand', 'explore', 'check', 'move_forward'];

interface GuidesCarouselProps {
  guides: Guide[];
  phaseIndex: number;
}

function GuidesCarousel({ guides, phaseIndex }: GuidesCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: true,
    skipSnaps: false,
    containScroll: 'trimSnaps',
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index);
  }, [emblaApi]);

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {guides.map((guide, index) => (
            <div 
              key={guide.slug} 
              className="flex-[0_0_calc(100%-1.5rem)] min-w-0 pl-4 first:pl-0"
            >
              <GuideCard 
                guide={guide} 
                index={phaseIndex * 3 + index} 
              />
            </div>
          ))}
        </div>
      </div>
      <CarouselDots 
        total={guides.length} 
        current={selectedIndex} 
        onDotClick={scrollTo}
        className="mt-4"
      />
    </div>
  );
}

export default function Guides() {
  useTrackContentVisit('guide');
  const isMobile = useIsMobile();

  return (
    <Layout>
      <SEOHead
        title="Buying Guides for Israel | BuyWise Israel"
        description="Comprehensive guides for buying property in Israel. Learn about taxes, mortgages, legal process, and what international buyers need to know."
        canonicalUrl="https://buywiseisrael.com/guides"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative py-12 md:py-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Master <span className="text-primary">Israel</span> Real Estate
                <span className="block">Step by Step</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                Comprehensive guides for international buyers —
                <br className="hidden md:block" />
                organized by where you are in your journey.
              </p>
              <p className="text-sm text-muted-foreground">
                {guidesArray.length} guides • ~{totalReadingTime} min total reading
              </p>
            </motion.div>
          </div>
        </section>

        {/* Guides by Journey Phase */}
        <section className="container pb-16 space-y-12">
          {phaseOrder.map((phaseKey, phaseIndex) => {
            const phase = GUIDES_BY_PHASE[phaseKey];
            if (!phase) return null;
            
            const phaseGuides = phase.slugs
              .map(slug => allGuides[slug])
              .filter(Boolean);
            
            if (phaseGuides.length === 0) return null;
            
            return (
              <motion.div
                key={phaseKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * phaseIndex }}
              >
                <div className="mb-5">
                  <h2 className="text-xl font-semibold text-foreground">
                    {phase.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {phase.description}
                  </p>
                </div>
                
                {/* Mobile: Carousel */}
                {isMobile ? (
                  <GuidesCarousel guides={phaseGuides} phaseIndex={phaseIndex} />
                ) : (
                  /* Desktop: Grid */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {phaseGuides.map((guide, index) => (
                      <GuideCard 
                        key={guide.slug} 
                        guide={guide} 
                        index={phaseIndex * 3 + index} 
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </section>

        {/* Quiz CTA */}
        <section className="container pb-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto"
          >
            <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10 text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">
                Not sure where to start?
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Take our quick quiz to find which guides matter most for your situation.
              </p>
              <Link 
                to="/tools" 
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Find My Path →
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Tools CTA */}
        <section className="container pb-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="p-6 rounded-xl bg-muted/50">
              <Calculator className="h-6 w-6 text-primary mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Ready to run the numbers?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our calculators are built for Israel — honest ranges, not fake precision.
              </p>
              <div className="flex gap-4 justify-center">
                <Link to="/tools" className="text-sm font-medium text-primary hover:underline">
                  Explore Calculators →
                </Link>
                <Link to="/listings" className="text-sm font-medium text-primary hover:underline">
                  Browse Listings →
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Support Footer */}
        <section className="container pb-16">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-xl mx-auto"
          >
            <SupportFooter 
              message="Still have questions after reading? That's completely normal. [Ask us anything] — we've helped hundreds of buyers just like you."
              linkText="Ask us anything"
              variant="card"
            />
          </motion.div>
        </section>
      </div>
    </Layout>
  );
}
