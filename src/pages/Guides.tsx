import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, MapPin, TrendingUp, Building2, 
  ArrowRight, Clock, Users, Star 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';

interface Guide {
  slug: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  readingTime: number;
  audience: string[];
  featured?: boolean;
}

const guides: Guide[] = [
  {
    slug: 'buying-in-israel',
    title: 'Complete Guide to Buying in Israel',
    description: 'Everything you need to know about purchasing property in Israel, from finding the right property to closing the deal.',
    icon: BookOpen,
    readingTime: 25,
    audience: ['All Buyers'],
    featured: true,
  },
  {
    slug: 'oleh-first-time',
    title: 'Oleh First-Time Buyer Guide',
    description: 'Special considerations, benefits, and step-by-step process for new immigrants buying their first home in Israel.',
    icon: MapPin,
    readingTime: 20,
    audience: ['Olim', 'First-Time Buyers'],
  },
  {
    slug: 'investment-property',
    title: 'Investment Property Guide',
    description: 'Maximize returns on Israeli real estate investments. Learn about yields, tax implications, and market analysis.',
    icon: TrendingUp,
    readingTime: 22,
    audience: ['Investors', 'Foreign Buyers'],
  },
  {
    slug: 'new-vs-resale',
    title: 'New Construction vs Resale',
    description: 'Compare buying from developers versus existing properties. Understand the pros, cons, and hidden costs of each.',
    icon: Building2,
    readingTime: 15,
    audience: ['All Buyers'],
  },
];

function GuideCard({ guide }: { guide: Guide }) {
  const Icon = guide.icon;
  
  return (
    <Link to={`/guides/${guide.slug}`}>
      <div className={`group bg-card border rounded-xl p-6 hover:shadow-lg hover:border-primary/40 transition-all h-full flex flex-col ${guide.featured ? 'border-primary/30 ring-1 ring-primary/20' : 'border-border'}`}>
        {guide.featured && (
          <Badge className="w-fit mb-3 bg-primary/10 text-primary border-0">
            <Star className="h-3 w-3 mr-1" />
            Essential Reading
          </Badge>
        )}
        
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {guide.title}
        </h3>
        
        <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-4">
          {guide.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {guide.readingTime} min read
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {guide.audience[0]}
            </span>
          </div>
          
          <span className="text-primary text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
            Read
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Guides() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container py-10 md:py-16">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
              Buyer Guides
            </h1>
            <p className="text-muted-foreground">
              Comprehensive guides to help you navigate the Israeli real estate market with confidence
            </p>
          </motion.div>

          {/* Guides Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            {guides.map((guide, index) => (
              <motion.div
                key={guide.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <GuideCard guide={guide} />
              </motion.div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 max-w-2xl mx-auto text-center"
          >
            <div className="p-6 rounded-xl bg-muted/50">
              <h3 className="font-semibold text-foreground mb-2">Ready to start your search?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use our tools and calculators to find your perfect property in Israel
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/tools" className="text-sm font-medium text-primary hover:underline">
                  Explore Tools →
                </Link>
                <Link to="/listings" className="text-sm font-medium text-primary hover:underline">
                  Browse Listings →
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
