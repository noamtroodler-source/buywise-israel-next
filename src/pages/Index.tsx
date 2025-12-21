import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryButtons } from '@/components/home/CategoryButtons';
import { FeaturedListings } from '@/components/home/FeaturedListings';
import { PopularCities } from '@/components/home/PopularCities';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <CategoryButtons />
      <FeaturedListings />
      <PopularCities />
    </Layout>
  );
};

export default Index;