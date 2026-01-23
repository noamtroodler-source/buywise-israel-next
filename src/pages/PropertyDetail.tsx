import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useProperty } from '@/hooks/useProperties';
import { useCityDetails } from '@/hooks/useCityDetails';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { usePropertyViewTracking } from '@/hooks/usePropertyViewTracking';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyHero } from '@/components/property/PropertyHero';
import { PropertyQuickSummary } from '@/components/property/PropertyQuickSummary';
import { PropertyDescription } from '@/components/property/PropertyDescription';
import { StickyContactCard, MobileContactBar } from '@/components/property/StickyContactCard';
import { PropertyValueSnapshot } from '@/components/property/PropertyValueSnapshot';

import { PropertyCostBreakdown } from '@/components/property/PropertyCostBreakdown';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';
import { PropertyNextSteps } from '@/components/property/PropertyNextSteps';
import { SimilarProperties } from '@/components/property/SimilarProperties';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

import { motion } from 'framer-motion';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id || '');
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToRecentlyViewed } = useRecentlyViewed();
  
  // Track property view in database (for agent analytics)
  usePropertyViewTracking(property?.id);
  
  // Track this property view locally (for recently viewed) - only once per property visit
  const hasTrackedView = useRef<string | null>(null);
  
  useEffect(() => {
    if (id && property && hasTrackedView.current !== id) {
      hasTrackedView.current = id;
      addToRecentlyViewed(id);
    }
  }, [id, property, addToRecentlyViewed]);
  
  // Get city slug for fetching city data
  const citySlug = property?.city?.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '-') || '';
  const { data: cityData } = useCityDetails(citySlug);

  const isSaved = property ? isFavorite(property.id) : false;

  const handleSave = async () => {
    if (!property) return;
    if (!user) {
      toast.error('Please sign in to save properties');
      return;
    }
    await toggleFavorite(property.id);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: property?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  // Calculate derived values
  const pricePerSqm = property?.size_sqm ? property.price / property.size_sqm : undefined;
  const createdDate = property ? new Date(property.created_at) : new Date();
  const now = new Date();
  const daysOnMarket = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

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

  return (
    <Layout>
      <div className="container py-6 md:py-8 pb-24 md:pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero - Inside Grid */}
            <PropertyHero 
              property={property}
              onSave={handleSave}
              onShare={handleShare}
              isSaved={isSaved}
            />

            {/* Quick Summary - Price, Title, Stats */}
            <PropertyQuickSummary
              property={property}
              onShare={handleShare}
              onSave={handleSave}
              isSaved={isSaved}
            />

            {/* Description */}
            <PropertyDescription description={property.description} />
            
            {/* Understanding Listings Guide Link */}
            <Link 
              to="/guides/understanding-listings" 
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Understanding Israeli listing terminology</span>
            </Link>

            {/* Value Snapshot */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="py-6 border-b border-border"
            >
              <PropertyValueSnapshot 
                price={property.price}
                sizeSqm={property.size_sqm}
                city={property.city}
                averagePriceSqm={cityData?.average_price_sqm}
                priceChange={cityData?.yoy_price_change}
                listingStatus={property.listing_status}
                bedrooms={property.bedrooms}
                cityRentalMin={property.bedrooms === 4 ? cityData?.rental_4_room_min : cityData?.rental_3_room_min}
                cityRentalMax={property.bedrooms === 4 ? cityData?.rental_4_room_max : cityData?.rental_3_room_max}
                vaadBayitMonthly={property.vaad_bayit_monthly}
                cityArnonaRate={cityData?.arnona_rate_sqm}
              />
            </motion.div>


            {/* Cost Breakdown - Only for sale/rent properties */}
            {(property.listing_status === 'for_sale' || property.listing_status === 'for_rent') && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="py-6 border-b border-border"
              >
              <PropertyCostBreakdown 
                  price={property.price}
                  currency={property.currency || 'ILS'}
                  listingStatus={property.listing_status}
                  city={property.city}
                  sizeSqm={property.size_sqm}
                  vaadBayitMonthly={property.vaad_bayit_monthly}
                  agentFeeRequired={property.agent_fee_required}
                  bankGuaranteeRequired={property.bank_guarantee_required}
                  checksRequired={property.checks_required}
                />
              </motion.div>
            )}

            {/* Location */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="py-6 border-b border-border"
            >
              <GoogleMapsProvider>
                <PropertyLocation 
                  address={property.address}
                  city={property.city}
                  neighborhood={property.neighborhood}
                  latitude={property.latitude}
                  longitude={property.longitude}
                  entityId={property.id}
                  entityType="property"
                />
              </GoogleMapsProvider>
            </motion.div>

            {/* Next Steps CTAs */}
            <PropertyNextSteps 
              cityName={property.city}
              citySlug={citySlug}
              propertyPrice={property.price}
              listingStatus={property.listing_status}
            />
          </div>

          {/* Sticky Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <StickyContactCard 
                agent={property.agent}
                propertyId={property.id}
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
        propertyId={property.id}
        propertyTitle={property.title}
      />
    </Layout>
  );
}
