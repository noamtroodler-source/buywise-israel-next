import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { PropertyCarousel } from '@/components/home/PropertyCarousel';
import { ProjectCarousel } from '@/components/home/ProjectCarousel';
import { PopularCities } from '@/components/home/PopularCities';
import { ToolsPromo } from '@/components/home/ToolsPromo';
import { StatementPanel } from '@/components/home/StatementPanel';
import { WhyBuyWiseSection } from '@/components/home/WhyBuyWiseSection';
import {
  useFeaturedSaleProperties, 
  useFeaturedRentalProperties 
} from '@/hooks/useProperties';
import { useFeaturedProjects } from '@/hooks/useProjects';

const Index = () => {
  const { data: saleProperties, isLoading: loadingSale } = useFeaturedSaleProperties();
  const { data: rentalProperties, isLoading: loadingRental } = useFeaturedRentalProperties();
  const { data: featuredProjects, isLoading: loadingProjects } = useFeaturedProjects();

  return (
    <Layout>
      {/* 1. Hero Section */}
      <HeroSection />
      
      {/* 2. Tools Promo */}
      <ToolsPromo />

      {/* 3. Resale Properties */}
      <PropertyCarousel
        title="Resale Properties"
        description="Established homes across Israel's major markets"
        properties={saleProperties}
        isLoading={loadingSale}
        viewAllLink="/listings?status=for_sale"
        viewAllText="View All Sales"
        hideStatusBadge
      />

      {/* 4. New Construction Projects */}
      <ProjectCarousel
        title="New Construction Projects"
        description="Pre-construction developments with transparent pricing and vetted developers"
        projects={featuredProjects}
        isLoading={loadingProjects}
        viewAllLink="/projects"
        viewAllText="View All Projects"
        hideStatusBadge
      />

      {/* 5. Popular Areas */}
      <PopularCities />

      {/* 6. Long-Term Rentals */}
      <PropertyCarousel
        title="Long-Term Rentals"
        description="Quality homes available now, with transparent costs and lease terms"
        properties={rentalProperties}
        isLoading={loadingRental}
        viewAllLink="/listings?status=for_rent"
        viewAllText="View All Rentals"
        hideStatusBadge
      />

      {/* 7. Statement Panel */}
      <StatementPanel />

      {/* 8. Why BuyWise Israel */}
      <WhyBuyWiseSection />
    </Layout>
  );
};

export default Index;