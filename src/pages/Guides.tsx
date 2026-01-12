import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calculator, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { GuideCard } from '@/components/guides';

export interface Guide {
  slug: string;
  title: string;
  description: string;
  image: string;
  readingTime: number;
  chaptersCount: number;
  featured?: boolean;
}

const guides: Guide[] = [
  {
    slug: 'buying-in-israel',
    title: 'Complete Guide to Buying in Israel',
    description: 'Everything you need to know about purchasing property in Israel, from search to closing.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    readingTime: 30,
    chaptersCount: 14,
    featured: true,
  },
  {
    slug: 'listings-explained',
    title: 'Why Israeli Listings Feel Misleading',
    description: 'Learn to read Israeli property listings like a local. Understand room counts, square meters, and what gets left out.',
    image: 'https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=800&q=80',
    readingTime: 18,
    chaptersCount: 10,
  },
  {
    slug: 'new-vs-resale',
    title: 'New Construction vs Resale',
    description: 'Compare buying from developers versus existing properties. Understand the pros and cons.',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
    readingTime: 15,
    chaptersCount: 5,
  },
  {
    slug: 'oleh-first-time',
    title: 'Oleh First-Time Buyer Guide',
    description: 'Special benefits and step-by-step process for new immigrants buying their first home.',
    image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&q=80',
    readingTime: 20,
    chaptersCount: 6,
  },
  {
    slug: 'investment-property',
    title: 'Investment Property Guide',
    description: 'Maximize returns on Israeli real estate. Learn about yields, taxes, and market analysis.',
    image: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=800&q=80',
    readingTime: 22,
    chaptersCount: 7,
  },
  {
    slug: 'new-construction',
    title: 'New Construction Guide',
    description: 'Navigate buying from a developer: payment schedules, bank guarantees, and timelines.',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
    readingTime: 18,
    chaptersCount: 6,
  },
];

// Calculate total reading time
const totalReadingTime = guides.reduce((sum, g) => sum + g.readingTime, 0);

export default function Guides() {
  return (
    <Layout>
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
                Master Israeli Real Estate
                <span className="block text-primary">Step by Step</span>
              </h1>
              <p className="text-muted-foreground text-lg mb-4">
                Comprehensive guides for international buyers.
                <br className="hidden md:block" />
                Read at your own pace. No pressure, no fluff.
              </p>
              <p className="text-sm text-muted-foreground">
                {guides.length} guides • ~{totalReadingTime} min total reading
              </p>
            </motion.div>
          </div>
        </section>

        {/* Guides Grid */}
        <section className="container pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map((guide, index) => (
              <GuideCard key={guide.slug} guide={guide} index={index} />
            ))}
          </div>
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
