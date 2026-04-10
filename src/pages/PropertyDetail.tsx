import { useParams, Link } from 'react-router-dom';
import React, { useEffect, useRef } from 'react';
import { setPageContextData } from '@/hooks/usePageContext';
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
import { MarketIntelligence } from '@/components/property/MarketIntelligence';
import { PropertyCostBreakdown } from '@/components/property/PropertyCostBreakdown';
import { PropertyLocation } from '@/components/property/PropertyLocation';
import { GoogleMapsProvider } from '@/components/maps/GoogleMapsProvider';
import { PropertyNextSteps } from '@/components/property/PropertyNextSteps';
import { SimilarProperties } from '@/components/property/SimilarProperties';
// RecentNearbySales is now used inside MarketIntelligence
import { SupportFooter } from '@/components/shared/SupportFooter';
import { ListingDisclaimer } from '@/components/shared/ListingDisclaimer';
import { UnclaimedListingBanner, StreetViewFallback, ClaimListingDialog } from '@/components/property/UnclaimedListingBanner';
import { CoListingAgents } from '@/components/property/CoListingAgents';
import { SourcedListingEnrichment } from '@/components/property/SourcedListingEnrichment';
import { MarketDataContext } from '@/components/shared/MarketDataContext';
import { ListingFeedback } from '@/components/listings/ListingFeedback';
import { ReportListingButton } from '@/components/property/ReportListingButton';
import { MobileSectionNav } from '@/components/property/MobileSectionNav';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { MobileCollapsibleSection } from '@/components/property/MobileCollapsibleSection';
import { NeighborhoodContextCard } from '@/components/property/NeighborhoodContextCard';
import { Calculator, BarChart3, MapPin, Compass } from 'lucide-react';
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

  // Set structured page context for Ask BuyWise
  useEffect(() => {
    if (property) {
      setPageContextData({
        price: property.price,
        city: property.city,
        neighborhood: property.neighborhood || undefined,
        bedrooms: property.bedrooms || undefined,
        propertyType: property.property_type,
        name: property.title,
        listingStatus: property.listing_status,
        currency: property.currency || 'ILS',
      });
    }
    return () => setPageContextData(null);
  }, [property]);
  
  // Get city slug for fetching city data
  const citySlug = property?.city?.toLowerCase().replace(/['']/g, '').replace(/\s+/g, '-') || '';
  const { data: cityData } = useCityDetails(citySlug);

  const isSaved = property ? isFavorite(property.id) : false;
  const [showClaimDialog, setShowClaimDialog] = React.useState(false);

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
      
      <div className="container py-6 md:py-8 pb-36 md:pb-8">
        {/* Dual Navigation - Desktop only (mobile has MobileHeaderBack) */}
        <div className="hidden lg:block mb-4">
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
              {/* Street View for unclaimed listings — show if we have a street_view_url OR no photos */}
              {!(property as any).is_claimed && (property as any).street_view_url && (
                <div className="mt-3 px-4 md:px-0">
                  <div className="rounded-xl overflow-hidden">
                    <img 
                      src={(property as any).street_view_url}
                      alt={`Street view of ${property.address || property.city}`}
                      className="w-full h-[300px] md:h-[420px] object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
              {!(property as any).is_claimed && !(property as any).street_view_url && !property.images?.length && (
                <div className="mt-3 px-4 md:px-0">
                  <StreetViewFallback
                    address={property.address}
                    city={property.city}
                    latitude={property.latitude}
                    longitude={property.longitude}
                    neighborhood={property.neighborhood}
                    className="w-full h-[300px] md:h-[420px] street-view-container"
                  />
                </div>
              )}
              {/* Unclaimed banner — right under hero where buyers see it */}
              {!(property as any).is_claimed && (property as any).import_source && (
                <div className="mt-3 px-4 md:px-0">
                  <UnclaimedListingBanner
                    sourceUrl={(property as any).source_url}
                    sourceName={
                      (property as any).import_source === 'yad2'
                        ? 'Yad2'
                        : (property as any).import_source === 'madlan'
                        ? 'Madlan'
                        : (property as any).source_agency_name || 'an agency website'
                    }
                    lastCheckedAt={(property as any).source_last_checked_at}
                    onClaimClick={() => setShowClaimDialog(true)}
                  />
                </div>
              )}
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

            {/* Market Intelligence (sale/sold) or Rental Snapshot */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="py-6 border-b border-border md:border-none"
            >
              {property.listing_status === 'for_rent' ? (
                <MobileCollapsibleSection
                  id="value-snapshot"
                  title="AI Rental Snapshot"
                  icon={<BarChart3 className="h-5 w-5" />}
                  summary={`${formatPrice(property.price, 'ILS')}/mo • ${property.city}`}
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
                  <MarketDataContext variant="compact" className="mt-4" />
                </MobileCollapsibleSection>
              ) : (
                <MobileCollapsibleSection
                  id="market-intelligence"
                  title="Market Intelligence"
                  icon={<BarChart3 className="h-5 w-5" />}
                  summary={`${formatPrice(property.price, 'ILS')} • ${property.city}`}
                  alwaysStartClosed
                >
                  <MarketIntelligence
                    property={property}
                    cityData={cityData}
                  />
                </MobileCollapsibleSection>
              )}
            </motion.div>

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

            {/* Neighborhood Guide - After location */}
            {property.neighborhood && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="py-6 border-b border-border md:border-none"
              >
                <MobileCollapsibleSection
                  id="neighborhood-guide"
                  title={`${property.neighborhood} Guide`}
                  icon={<Compass className="h-5 w-5" />}
                  summary={`Know the neighborhood before you commit`}
                  alwaysStartClosed
                >
                  <NeighborhoodContextCard
                    city={property.city}
                    neighborhood={property.neighborhood}
                  />
                </MobileCollapsibleSection>
              </motion.div>
            )}

            {/* Questions to Ask - After neighborhood guide, before next steps */}
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
                  ...(!property.bathrooms ? ['bathrooms'] : []),
                  // For sourced listings, flag additional missing fields
                  ...((property as any).import_source && !(property as any).is_claimed ? [
                    ...(!property.address || property.address.trim().length < 3 ? ['address'] : []),
                    ...(!(property as any).features?.length ? ['features'] : []),
                  ] : []),
                ],
              }}
            />

            {/* Next Steps CTAs */}
            <PropertyNextSteps 
              cityName={property.city}
              citySlug={citySlug}
              propertyPrice={property.price}
              listingStatus={property.listing_status}
              isSourced={!!(property as any).import_source && !(property as any).is_claimed}
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
            <div className="sticky top-20 space-y-4">
              <StickyContactCard 
                agent={property.agent}
                propertyId={property.id}
                propertyTitle={property.title}
                onSave={handleSave}
                isSaved={isSaved}
                isSourced={!!(property as any).import_source && !(property as any).is_claimed}
                isPartner={!!(property as any).agent?.agency?.is_partner}
                agencyName={(property as any).source_agency_name || (property as any).agent?.agency?.name || (property.agent?.agency_name ?? null)}
                agencyLogoUrl={(property as any).agent?.agency?.logo_url || null}
                propertyCity={property.city}
              />
              {/* Co-listing agents — shown only for claimed listings with multiple agencies */}
              {(property as any).is_claimed && (property as any).co_agents?.length > 0 && (
                <CoListingAgents coAgents={(property as any).co_agents} />
              )}
            </div>
          </div>
        </div>

        {/* Similar Properties - Full Width */}
        <div id="section-similar">
          <SimilarProperties currentProperty={property} />
        </div>



        {/* Disclaimer */}
        <ListingDisclaimer variant="detail" className="py-6" />
      </div>

      {/* Claim listing dialog (for unclaimed scraped listings) */}
      {property && (
        <ClaimListingDialog
          open={showClaimDialog}
          onOpenChange={setShowClaimDialog}
          propertyId={property.id}
          propertyTitle={property.title}
        />
      )}

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
