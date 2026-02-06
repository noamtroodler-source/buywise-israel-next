import { useParams, Link } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useProperty } from '@/hooks/useProperties';
import { useCityDetails } from '@/hooks/useCityDetails';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { usePropertyViewTracking } from '@/hooks/usePropertyViewTracking';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { useBuyerProfile, getEffectiveBuyerType } from '@/hooks/useBuyerProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyHero } from '@/components/property/PropertyHero';
import { PropertyQuickSummary } from '@/components/property/PropertyQuickSummary';
import { PropertyDescription } from '@/components/property/PropertyDescription';
import { PropertyQuestionsToAsk } from '@/components/property/PropertyQuestionsToAsk';
import { StickyContactCard, MobileContactBar } from '@/components/property/StickyContactCard';
import { PropertyValueSnapshot } from '@/components/property/PropertyValueSnapshot';
import { PropertyCostBreakdown } from '@/components/property/PropertyCostBreakdown';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';
import { PropertyNextSteps } from '@/components/property/PropertyNextSteps';
import { SimilarProperties } from '@/components/property/SimilarProperties';
import { RecentNearbySales } from '@/components/property/RecentNearbySales';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { ListingFeedback } from '@/components/listings/ListingFeedback';
import { ReportListingButton } from '@/components/property/ReportListingButton';
import { MobileSectionNav } from '@/components/property/MobileSectionNav';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { MobileCollapsibleSection } from '@/components/property/MobileCollapsibleSection';
import { Calculator, BarChart3, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { generatePropertyMeta, generatePropertyJsonLd, SITE_CONFIG } from '@/lib/seo';

export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading } = useProperty(id || '');
  const { user } = useAuth();
  const { data: buyerProfile } = useBuyerProfile();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const formatPrice = useFormatPrice();
  
  // Derive buyer type from profile for personalization
  const derivedBuyerType = buyerProfile ? getEffectiveBuyerType(buyerProfile) : null;
  
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
        <div className="container py-16 text-center max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-foreground">Property not found</h1>
          <p className="text-muted-foreground mt-2">The property you're looking for doesn't exist or has been removed.</p>
          <SupportFooter 
            message="Think this is a mistake? [Let us know]. Or tell us what you're looking for — we're happy to help."
            linkText="Let us know"
            variant="subtle"
            className="mt-8"
          />
        </div>
      </Layout>
    );
  }

  // Generate SEO meta and JSON-LD
  const seoMeta = generatePropertyMeta(property);
  const jsonLd = generatePropertyJsonLd(property);

  return (
    <Layout>
      <SEOHead 
        title={seoMeta.title}
        description={seoMeta.description}
        image={property.images?.[0]}
        canonicalUrl={`${SITE_CONFIG.siteUrl}/property/${property.id}`}
        type="product"
        jsonLd={jsonLd}
      />
      {/* Mobile Section Navigation */}
      <MobileSectionNav />
      
      <div className="container py-6 md:py-8 pb-24 md:pb-8">
        {/* Dual Navigation - Desktop only (mobile has MobileHeaderBack) */}
        <div className="hidden md:block mb-4">
          <DualNavigation
            parentLabel={property.listing_status === 'for_rent' ? 'All Rentals' : 'All Properties'}
            parentPath={`/listings?status=${property.listing_status}`}
            fallbackPath={property.listing_status === 'for_rent' ? '/listings?status=for_rent' : '/listings?status=for_sale'}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero - Edge-to-edge on mobile */}
            <div id="section-photos" className="-mx-4 md:mx-0">
              <PropertyHero
                property={property}
                onSave={handleSave}
                onShare={handleShare}
                isSaved={isSaved}
              />
            </div>

            {/* Quick Summary - Price, Title, Stats */}
            <div id="section-details">
              <PropertyQuickSummary
                property={property}
                onShare={handleShare}
                onSave={handleSave}
                isSaved={isSaved}
              />
            </div>

            {/* Description */}
            <PropertyDescription description={property.description} />

            {/* Value Snapshot - Collapsible on mobile */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="py-6 border-b border-border md:border-none"
            >
              <MobileCollapsibleSection
                id="value-snapshot"
                title="AI Value Snapshot"
                icon={<BarChart3 className="h-5 w-5" />}
                summary={`${formatPrice(property.price, 'ILS')} • ${property.city}`}
                alwaysStartClosed
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
                  cityAvgVaadBayit={cityData?.average_vaad_bayit}
                />
              </MobileCollapsibleSection>
            </motion.div>

            {/* Recent Nearby Sales - Only for sale/sold properties, not rentals */}
            {property.latitude && property.longitude && property.listing_status !== 'for_rent' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="py-6 border-b border-border"
              >
                <RecentNearbySales
                  latitude={property.latitude}
                  longitude={property.longitude}
                  city={property.city}
                  propertyRooms={property.bedrooms}
                  propertyPrice={property.price}
                  propertySizeSqm={property.size_sqm}
                />
              </motion.div>
            )}

            {/* Cost Breakdown - Collapsible on mobile */}
            {(property.listing_status === 'for_sale' || property.listing_status === 'for_rent') && (
              <motion.div 
                id="section-costs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="py-6 border-b border-border md:border-none"
              >
                <MobileCollapsibleSection
                  id="cost-breakdown"
                  title="Cost Breakdown"
                  icon={<Calculator className="h-5 w-5" />}
                  summary="Upfront costs & monthly expenses"
                  alwaysStartClosed
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
                </MobileCollapsibleSection>
              </motion.div>
            )}

            {/* Location - Collapsible on mobile */}
            <motion.div 
              id="section-map"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
              className="py-6 border-b border-border md:border-none"
            >
              <MobileCollapsibleSection
                id="location"
                title="Location"
                icon={<MapPin className="h-5 w-5" />}
                summary={`${property.neighborhood || ''} ${property.city}`.trim()}
                alwaysStartClosed
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
              </MobileCollapsibleSection>
            </motion.div>

            {/* Questions to Ask - After location, before next steps */}
            <PropertyQuestionsToAsk 
              listing={{
                type: property.listing_status === 'for_rent' ? 'rent' : 'buy',
                entity_id: property.id,
                entity_type: 'property',
                price: property.price || undefined,
                size_sqm: property.size_sqm || undefined,
                price_per_sqm: property.size_sqm && property.price ? Math.round(property.price / property.size_sqm) : undefined,
                year_built: property.year_built || undefined,
                days_on_market: daysOnMarket,
                price_reduced: !!(property as any).original_price,
                condition: property.condition || undefined,
                city: property.city,
                neighborhood: property.neighborhood || undefined,
                property_type: property.property_type,
                bedrooms: property.bedrooms || undefined,
                has_parking: !!(property as any).parking_spots,
                has_elevator: (property as any).has_elevator,
                floor: property.floor ?? undefined,
                total_floors: (property as any).total_floors,
                missing_fields: [
                  ...(!property.size_sqm ? ['size_sqm'] : []),
                  ...(!property.floor && property.floor !== 0 ? ['floor'] : []),
                  ...(!property.year_built ? ['year_built'] : []),
                ],
              }}
            />

            {/* Next Steps CTAs */}
            <PropertyNextSteps 
              cityName={property.city}
              citySlug={citySlug}
              propertyPrice={property.price}
              listingStatus={property.listing_status}
            />

            {/* Listing Feedback */}
            <ListingFeedback 
              listingType={property.listing_status === 'for_rent' ? 'rentals' : 'buy'} 
            />

            {/* Report Inaccurate Info - Subtle link for data quality */}
            <div className="flex justify-center pt-2">
              <ReportListingButton 
                propertyId={property.id}
                listingTitle={property.title}
              />
            </div>
          </div>

          {/* Sticky Sidebar - Desktop Only */}
          <div className="hidden lg:block">
            <div className="sticky top-20">
              <StickyContactCard 
                agent={property.agent}
                propertyId={property.id}
                propertyTitle={property.title}
                onSave={handleSave}
                isSaved={isSaved}
              />
            </div>
          </div>
        </div>

        {/* Similar Properties - Full Width */}
        <div id="section-similar">
          <SimilarProperties currentProperty={property} />
        </div>
      </div>

      {/* Mobile Contact Bar */}
      <MobileContactBar 
        agent={property.agent}
        propertyId={property.id}
        propertyTitle={property.title}
        price={property.price}
        isSaved={isSaved}
        onSave={handleSave}
        onShare={handleShare}
      />
    </Layout>
  );
}
