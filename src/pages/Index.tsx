import { Layout } from '@/components/layout/Layout';
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
        description="Buying in Israel shouldn't feel like guesswork. Compare 30+ markets, calculate purchase taxes & costs, and connect with verified agents — all in English, built for international buyers."
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
