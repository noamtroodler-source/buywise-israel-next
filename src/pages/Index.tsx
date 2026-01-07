import { Layout } from '@/components/layout/Layout';
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
      {/* 1. Cinematic Hero with Integrated Search */}
      <HeroSplit />
      
      {/* 2. Platform Promise Strip */}
      <PlatformPromise />
      
      {/* 3. Three Pillars - Value Proposition */}
      <ThreePillars />
      
      {/* 4. Featured Listings Showcase */}
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
