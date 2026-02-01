import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
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
        description="Find your perfect property in Israel. Search apartments, houses, and new developments with tools built for international buyers. Transparent pricing, honest guidance."
        canonicalUrl="https://buywiseisrael.com"
      />
      
      {/* 1. Cinematic Hero with Integrated Search */}
      <HeroSplit />
      
      {/* 2. Three Pillars - Establish value prop first */}
      <ThreePillars />
      
      {/* 3. Platform Promise - Why we're different */}
      <PlatformPromise />
      
      {/* 4. Featured Listings - Now users browse with context */}
      <FeaturedShowcase />
      
      {/* 5. New Projects Highlight */}
      <ProjectsHighlight />
      
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
