import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { PropertyCarousel } from '@/components/home/PropertyCarousel';
import { ProjectCarousel } from '@/components/home/ProjectCarousel';
import { PopularCities } from '@/components/home/PopularCities';
import { ToolsPromo } from '@/components/home/ToolsPromo';
import { SignUpCTA } from '@/components/home/SignUpCTA';
import { WhyBuyWiseSection } from '@/components/home/WhyBuyWiseSection';
import {
  useRecommendedProperties, 
  useFeaturedSaleProperties, 
  useFeaturedRentalProperties 
} from '@/hooks/useProperties';
import { useFeaturedProjects } from '@/hooks/useProjects';

const Index = () => {
  const { data: recommendedProperties, isLoading: loadingRecommended } = useRecommendedProperties();
  const { data: saleProperties, isLoading: loadingSale } = useFeaturedSaleProperties();
  const { data: rentalProperties, isLoading: loadingRental } = useFeaturedRentalProperties();
  const { data: featuredProjects, isLoading: loadingProjects } = useFeaturedProjects();

  return (
    <Layout>
      {/* 1. Hero Section */}
      <HeroSection />
      
      {/* 2. Tools Promo - moved to position #2 */}
      <ToolsPromo />

      {/* 3. Why BuyWise Israel */}
      <WhyBuyWiseSection />

      {/* 4. Featured Properties (was "Best Picks For You") */}
      <PropertyCarousel
        title="Featured Properties"
        description="Highlighted listings across budgets, neighborhoods, and property types"
        properties={recommendedProperties}
        isLoading={loadingRecommended}
        viewAllLink="/listings"
        viewAllText="View All"
      />

      {/* 5. Resale Properties */}
      <PropertyCarousel
        title="Resale Properties"
        description="Established homes across Israel's major markets"
        properties={saleProperties}
        isLoading={loadingSale}
        viewAllLink="/listings?status=for_sale"
        viewAllText="View All Sales"
        hideStatusBadge
      />

      {/* 6. New Construction Projects */}
      <ProjectCarousel
        title="New Construction Projects"
        description="Pre-construction developments with transparent pricing and vetted developers"
        projects={featuredProjects}
        isLoading={loadingProjects}
        viewAllLink="/projects"
        viewAllText="View All Projects"
        hideStatusBadge
      />

      {/* 7. Popular Areas */}
      <PopularCities />

      {/* 8. Long-Term Rentals */}
      <PropertyCarousel
        title="Long-Term Rentals"
        description="Quality homes available now, with transparent costs and lease terms"
        properties={rentalProperties}
        isLoading={loadingRental}
        viewAllLink="/listings?status=for_rent"
        viewAllText="View All Rentals"
        hideStatusBadge
      />
    </Layout>
  );
};

export default Index;