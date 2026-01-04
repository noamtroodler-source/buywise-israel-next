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
      <HeroSection />
      
      {/* Best Picks For You */}
      <PropertyCarousel
        title="Best Picks For You"
        description="Handpicked properties based on quality, value, and location"
        properties={recommendedProperties}
        isLoading={loadingRecommended}
        viewAllLink="/listings"
        viewAllText="View All"
      />

      {/* Why BuyWise Israel */}
      <WhyBuyWiseSection />

      {/* Sign Up CTA */}
      <SignUpCTA />

      {/* Featured Resale Homes */}
      <PropertyCarousel
        title="Featured Resale Homes"
        description="Top resale opportunities selected for value, price, and location"
        properties={saleProperties}
        isLoading={loadingSale}
        viewAllLink="/listings?status=for_sale"
        viewAllText="View All Sales"
        hideStatusBadge
      />

      {/* Tools Promo */}
      <ToolsPromo />

      {/* Featured New Projects */}
      <ProjectCarousel
        title="Featured New Projects"
        description="Trusted pre-construction developments across Israel"
        projects={featuredProjects}
        isLoading={loadingProjects}
        viewAllLink="/projects"
        viewAllText="View All Projects"
        hideStatusBadge
      />

      {/* Popular Areas */}
      <PopularCities />

      {/* Featured Long-Term Rentals */}
      <PropertyCarousel
        title="Featured Long-Term Rentals"
        description="Quality rental homes available now across Israel"
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
