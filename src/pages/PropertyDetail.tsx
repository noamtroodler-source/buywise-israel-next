import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useProperty } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyHero } from '@/components/property/PropertyHero';
import { PropertyDescription } from '@/components/property/PropertyDescription';
import { StickyContactCard, MobileContactBar } from '@/components/property/StickyContactCard';
import { AgentContactSection } from '@/components/property/AgentContactSection';
import { PropertyValueSnapshot } from '@/components/property/PropertyValueSnapshot';
import { PropertyCostBreakdown } from '@/components/property/PropertyCostBreakdown';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import { CalculatorCTA } from '@/components/property/CalculatorCTA';
import { SimilarProperties } from '@/components/property/SimilarProperties';
import { motion } from 'framer-motion';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id || '');
  const { data: marketData } = useMarketData(property?.city || '');

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8 space-y-6">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!property) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Property not found</h1>
          <p className="text-muted-foreground mt-2">The property you're looking for doesn't exist or has been removed.</p>
        </div>
      </Layout>
    );
  }

  // Get latest market data for the city
  const latestMarketData = marketData?.[0];

  return (
    <Layout>
      <div className="container py-6 md:py-8 pb-24 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Zone 1: Hero - Above the Fold */}
            <PropertyHero 
              property={property}
              onSave={() => console.log('Save property')}
              onShare={() => {
                if (navigator.share) {
                  navigator.share({
                    title: property.title,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                }
              }}
            />

            {/* Zone 2: Description & Features */}
            <PropertyDescription 
              description={property.description}
              features={property.features}
              condition={property.condition}
              yearBuilt={property.year_built}
              isFurnished={property.is_furnished}
              isAccessible={property.is_accessible}
              parking={property.parking}
            />

            {/* Agent Contact Section */}
            <AgentContactSection 
              agent={property.agent}
              propertyTitle={property.title}
            />

            {/* Zone 3: Collapsible Detail Sections */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="space-y-4"
            >
              {/* AI Value Snapshot */}
              <PropertyValueSnapshot 
                price={property.price}
                sizeSqm={property.size_sqm}
                city={property.city}
                averagePriceSqm={latestMarketData?.average_price_sqm}
                priceChange={latestMarketData?.price_change_percent}
              />

              {/* Cost Breakdown */}
              <PropertyCostBreakdown 
                price={property.price}
                currency={property.currency || 'ILS'}
                listingStatus={property.listing_status}
              />

              {/* Location */}
              <PropertyLocation 
                address={property.address}
                city={property.city}
                neighborhood={property.neighborhood}
                latitude={property.latitude}
                longitude={property.longitude}
              />
            </motion.div>

            {/* Calculator Quick Links */}
            <CalculatorCTA propertyPrice={property.price} />
          </div>

          {/* Sticky Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <StickyContactCard 
                agent={property.agent}
                propertyTitle={property.title}
              />
            </div>
          </div>
        </div>

        {/* Similar Properties - Full Width */}
        <SimilarProperties currentProperty={property} />
      </div>

      {/* Mobile Contact Bar */}
      <MobileContactBar 
        agent={property.agent}
        propertyTitle={property.title}
      />
    </Layout>
  );
}
