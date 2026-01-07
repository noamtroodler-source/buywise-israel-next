import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Bed, Bath, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedSaleProperties, useFeaturedRentalProperties } from '@/hooks/useProperties';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { FavoriteButton } from '@/components/property/FavoriteButton';

type Tab = 'sale' | 'rent';

export function FeaturedShowcase() {
  const [activeTab, setActiveTab] = useState<Tab>('sale');
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const { data: saleProperties, isLoading: loadingSale } = useFeaturedSaleProperties();
  const { data: rentalProperties, isLoading: loadingRent } = useFeaturedRentalProperties();

  const properties = activeTab === 'sale' ? saleProperties : rentalProperties;
  const isLoading = activeTab === 'sale' ? loadingSale : loadingRent;
  const viewAllLink = activeTab === 'sale' ? '/listings?status=for_sale' : '/listings?status=for_rent';

  // Take first 5 properties for the showcase
  const displayProperties = properties?.slice(0, 5) || [];
  const heroProperty = displayProperties[0];
  const gridProperties = displayProperties.slice(1, 5);

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container">
        {/* Header with Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Featured Properties
            </h2>
            <p className="text-muted-foreground mt-2">
              Hand-picked listings updated daily
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg bg-background p-1 border border-border">
              <button
                onClick={() => setActiveTab('sale')}
                className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'sale'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For Sale
              </button>
              <button
                onClick={() => setActiveTab('rent')}
                className={`px-5 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === 'rent'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                For Rent
              </button>
            </div>
            <Button variant="default" asChild className="hidden sm:flex gap-2">
              <Link to={viewAllLink}>
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="w-full aspect-[21/9] rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
              ))}
            </div>
          </div>
        )}

        {/* Property Display */}
        {!isLoading && displayProperties.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Hero Property - Full Width Dramatic Card */}
            {heroProperty && (
              <Link 
                to={`/property/${heroProperty.id}`}
                className="block group"
              >
                <div className="relative w-full aspect-[21/9] md:aspect-[3/1] rounded-2xl overflow-hidden">
                  {/* Background Image */}
                  <img
                    src={heroProperty.images?.[0] || '/placeholder.svg'}
                    alt={heroProperty.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end md:justify-center">
                    <div className="max-w-xl space-y-3">
                      {/* Featured Badge */}
                      <span className="inline-block px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full uppercase tracking-wide">
                        Featured
                      </span>
                      
                      {/* Price */}
                      <p className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                        {formatPrice(heroProperty.price, heroProperty.currency || 'ILS')}
                        {activeTab === 'rent' && <span className="text-lg font-normal">/mo</span>}
                      </p>
                      
                      {/* Title */}
                      <h3 className="text-xl md:text-2xl font-semibold text-white">
                        {heroProperty.title}
                      </h3>
                      
                      {/* Location */}
                      <div className="flex items-center gap-2 text-white/80">
                        <MapPin className="h-4 w-4" />
                        <span>{heroProperty.neighborhood ? `${heroProperty.neighborhood}, ` : ''}{heroProperty.city}</span>
                      </div>
                      
                      {/* Features */}
                      <div className="flex items-center gap-6 text-white/80 text-sm">
                        {heroProperty.bedrooms && (
                          <div className="flex items-center gap-1.5">
                            <Bed className="h-4 w-4" />
                            <span>{heroProperty.bedrooms} Beds</span>
                          </div>
                        )}
                        {heroProperty.bathrooms && (
                          <div className="flex items-center gap-1.5">
                            <Bath className="h-4 w-4" />
                            <span>{heroProperty.bathrooms} Baths</span>
                          </div>
                        )}
                        {heroProperty.size_sqm && (
                          <div className="flex items-center gap-1.5">
                            <Square className="h-4 w-4" />
                            <span>{formatArea(heroProperty.size_sqm)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Favorite Button */}
                  <div className="absolute top-4 right-4">
                    <FavoriteButton propertyId={heroProperty.id} />
                  </div>
                </div>
              </Link>
            )}

            {/* Grid of 4 Property Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {gridProperties.map((property) => (
                <PropertyCard key={property.id} property={property} compact />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!isLoading && displayProperties.length === 0 && (
          <div className="text-center py-16 bg-background rounded-2xl border border-border">
            <p className="text-muted-foreground mb-4">No properties available at the moment.</p>
            <Button asChild>
              <Link to="/listings">Browse All Listings</Link>
            </Button>
          </div>
        )}

        {/* Mobile View All */}
        <div className="mt-8 sm:hidden">
          <Button variant="default" asChild className="w-full gap-2">
            <Link to={viewAllLink}>
              View All Properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
