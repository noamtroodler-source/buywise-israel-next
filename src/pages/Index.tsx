import { Layout } from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { generateHomepageJsonLd } from '@/lib/seo';
import { HeroSplit } from '@/components/home/HeroSplit';
import { PlatformPromise } from '@/components/home/PlatformPromise';
import { ThreePillars } from '@/components/home/ThreePillars';
import { FeaturedShowcase } from '@/components/home/FeaturedShowcase';
import { ProjectsHighlight } from '@/components/home/ProjectsHighlight';
import { RegionExplorer } from '@/components/home/RegionExplorer';
import { ToolsSpotlight } from '@/components/home/ToolsSpotlight';
import { TrustStrip } from '@/components/home/TrustStrip';
import { FinalCTA } from '@/components/home/FinalCTA';

const Index = () => {
  return (
    <Layout>
      <SEOHead
        title="BuyWise Israel - Property Search for English Speakers"
        description="Compare 30+ Israeli markets, calculate taxes & costs, and connect with verified agents — all in English, built for international buyers."
        canonicalUrl="https://buywiseisrael.com"
        jsonLd={generateHomepageJsonLd()}
      />
      
      {/* 1. Cinematic Hero with Integrated Search */}
      <HeroSplit />
      
      {/* 2. Featured Listings - Lead with real value */}
      <FeaturedShowcase />
      
      {/* 3. New Projects Highlight */}
      <ProjectsHighlight />
      
      {/* 4. Three Pillars - Establish value prop */}
      <ThreePillars />

      {/* 4.5 Agency Trust Band */}
      <section className="py-4 md:py-6">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="flex items-start gap-3 md:gap-4 rounded-xl border border-border/60 bg-muted/40 px-5 py-4 md:px-8 md:py-5"
          >
            <div className="mt-0.5 flex-shrink-、0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-foreground">
                Agencies you can actually reach out to
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">
                We only partner with agencies known for working well with international buyers — so you can feel comfortable reaching out directly.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Platform Promise - Why we're different */}
      <PlatformPromise />
      
      {/* 6. Explore by Region */}
      <RegionExplorer />
      
      {/* 7. Tools Spotlight */}
      <ToolsSpotlight />
      
      {/* 8. Trust Strip */}
      <TrustStrip />
      
      {/* 9. Final CTA */}
      <FinalCTA />
    </Layout>
  );
};

export default Index;
