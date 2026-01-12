import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, MapPin, TrendingUp, Building2, 
  FileCheck, Calculator, Sparkles
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { AudienceFilter, GuideCard, JourneyStage, type Audience } from '@/components/guides';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  readingTime: number;
  audience: ('olim' | 'investors' | 'first-time' | 'families')[];
  stage: 1 | 2 | 3;
  chaptersCount: number;
  featured?: boolean;
  valueStatement?: string;
}

const guides: Guide[] = [
  {
    slug: 'buying-in-israel',
    title: 'Complete Guide to Buying in Israel',
    description: 'Everything you need to know about purchasing property in Israel, from finding the right property to closing the deal.',
    icon: BookOpen,
    readingTime: 25,
    audience: ['olim', 'investors', 'first-time', 'families'],
    stage: 1,
    chaptersCount: 8,
    featured: true,
    valueStatement: 'Avoid ₪30-50k in common first-timer mistakes',
  },
  {
    slug: 'new-vs-resale',
    title: 'New Construction vs Resale',
    description: 'Compare buying from developers versus existing properties. Understand the pros, cons, and hidden costs of each.',
    icon: Building2,
    readingTime: 15,
    audience: ['olim', 'investors', 'first-time', 'families'],
    stage: 1,
    chaptersCount: 5,
  },
  {
    slug: 'oleh-first-time',
    title: 'Oleh First-Time Buyer Guide',
    description: 'Special considerations, benefits, and step-by-step process for new immigrants buying their first home in Israel.',
    icon: MapPin,
    readingTime: 20,
    audience: ['olim', 'first-time'],
    stage: 2,
    chaptersCount: 6,
    valueStatement: 'Claim your tax benefits worth ₪20-80k',
  },
  {
    slug: 'investment-property',
    title: 'Investment Property Guide',
    description: 'Maximize returns on Israeli real estate investments. Learn about yields, tax implications, and market analysis.',
    icon: TrendingUp,
    readingTime: 22,
    audience: ['investors'],
    stage: 2,
    chaptersCount: 7,
    valueStatement: 'Realistic yield expectations: 2.5-4.5% net',
  },
  {
    slug: 'new-construction',
    title: 'New Construction Guide',
    description: 'Navigate buying from a developer: payment schedules, bank guarantees, timelines, and what to expect at each stage.',
    icon: Building2,
    readingTime: 18,
    audience: ['olim', 'investors', 'first-time', 'families'],
    stage: 3,
    chaptersCount: 6,
  },
];

// Calculate total reading time
const totalReadingTime = guides.reduce((sum, g) => sum + g.readingTime, 0);

export default function Guides() {
  const [selectedAudience, setSelectedAudience] = useState<Audience>('all');

  // Filter guides based on selected audience
  const isGuideHighlighted = (guide: Guide) => {
    if (selectedAudience === 'all') return true;
    return guide.audience.includes(selectedAudience as any);
  };

  // Group guides by stage
  const stage1Guides = guides.filter((g) => g.stage === 1);
  const stage2Guides = guides.filter((g) => g.stage === 2);
  const stage3Guides = guides.filter((g) => g.stage === 3);

  // Count highlighted guides
  const highlightedCount = guides.filter(isGuideHighlighted).length;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
          <div className="container relative py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl mx-auto"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Master Israeli Real Estate
                <span className="block text-primary">Step by Step</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                Comprehensive guides for international buyers.
                <br className="hidden md:block" />
                Read at your own pace. No pressure, no fluff.
              </p>
              <p className="text-sm text-muted-foreground">
                {guides.length} guides • ~{totalReadingTime} min total reading • Updated for 2025
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="container pb-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-center text-sm text-muted-foreground mb-3">Find guides for:</p>
            <AudienceFilter 
              selected={selectedAudience} 
              onChange={setSelectedAudience} 
            />
            {selectedAudience !== 'all' && (
              <p className="text-center text-xs text-muted-foreground mt-3">
                {highlightedCount} of {guides.length} guides match your profile
              </p>
            )}
          </motion.div>
        </section>

        {/* Guides by Journey Stage */}
        <section className="container pb-16 space-y-12">
          {stage1Guides.length > 0 && (
            <JourneyStage number={1} title="Understand the Market">
              {stage1Guides.map((guide) => (
                <GuideCard 
                  key={guide.slug} 
                  guide={guide} 
                  isHighlighted={isGuideHighlighted(guide)}
                />
              ))}
            </JourneyStage>
          )}

          {stage2Guides.length > 0 && (
            <JourneyStage number={2} title="Know Your Situation">
              {stage2Guides.map((guide) => (
                <GuideCard 
                  key={guide.slug} 
                  guide={guide} 
                  isHighlighted={isGuideHighlighted(guide)}
                />
              ))}
            </JourneyStage>
          )}

          {stage3Guides.length > 0 && (
            <JourneyStage number={3} title="Prepare & Execute">
              {stage3Guides.map((guide) => (
                <GuideCard 
                  key={guide.slug} 
                  guide={guide} 
                  isHighlighted={isGuideHighlighted(guide)}
                />
              ))}
            </JourneyStage>
          )}
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
        <section className="container pb-16">
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
      </div>
    </Layout>
  );
}
