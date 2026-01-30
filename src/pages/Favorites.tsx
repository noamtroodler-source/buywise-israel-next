import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Calculator, ArrowRight, Bell, BellOff, Building, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEOHead } from '@/components/seo/SEOHead';
import { Layout } from '@/components/layout/Layout';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFavorites } from '@/hooks/useFavorites';
import { useProjectFavorites } from '@/hooks/useProjectFavorites';
import { usePriceDropAlerts } from '@/hooks/usePriceDropAlerts';
import { CompareButton } from '@/components/property/CompareButton';
import { CompareBar } from '@/components/property/CompareBar';
import { useCompare } from '@/contexts/CompareContext';
import { useAuth } from '@/hooks/useAuth';
import { GuestSignupNudge } from '@/components/shared/GuestSignupNudge';
import { SupportFooter } from '@/components/shared/SupportFooter';
import { PullToRefresh } from '@/components/shared/PullToRefresh';
import { MobileListingsSkeletonGrid } from '@/components/shared/MobilePropertySkeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';

const popularCities = ['Tel Aviv', 'Jerusalem', 'Herzliya', 'Ra\'anana', 'Netanya'];

export default function Favorites() {
  const { favorites, favoriteProperties, isLoading } = useFavorites();
  const { projectFavorites, isLoading: isLoadingProjects, removeProjectFavorite } = useProjectFavorites();
  const { togglePriceAlert, isTogglingAlert } = usePriceDropAlerts();
  const { compareCategory } = useCompare();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'buy' | 'rent' | 'projects'>('buy');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Pull-to-refresh handler
  const handleRefresh = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['favorites'] }),
      queryClient.invalidateQueries({ queryKey: ['project-favorites'] }),
    ]);
  }, [queryClient]);

  // Separate properties by listing status
  const buyProperties = favorites.filter((f: any) => 
    f.properties?.listing_status === 'for_sale'
  );
  const rentProperties = favorites.filter((f: any) => 
    f.properties?.listing_status === 'for_rent'
  );

  const isLoadingAll = isLoading || isLoadingProjects;

  if (isLoadingAll) {
    return (
      <Layout>
        <section className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
          <div className="container py-8 md:py-10 text-center">
            <div className="space-y-2">
              <div className="h-9 w-48 bg-muted rounded-lg mx-auto animate-pulse" />
              <div className="h-5 w-72 bg-muted/60 rounded mx-auto animate-pulse" />
            </div>
          </div>
        </section>
        <div className="container py-8">
          <MobileListingsSkeletonGrid count={isMobile ? 4 : 6} />
        </div>
      </Layout>
    );
  }

  const alertsEnabledCount = favorites.filter((f: any) => f.price_alert_enabled !== false).length;
  const totalFavorites = buyProperties.length + rentProperties.length + projectFavorites.length;

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'pre_sale': return 'Pre-Sale';
      case 'foundation': return 'Foundation';
      case 'structure': return 'Structure';
      case 'finishing': return 'Finishing';
      case 'delivery': return 'Delivery';
      default: return status;
    }
  };

  return (
    <Layout>
      <SEOHead
        title="Saved Properties | BuyWise Israel"
        description="View and compare your saved properties. Get price drop alerts and manage your favorites across devices."
        canonicalUrl="https://buywiseisrael.com/favorites"
        noindex={true}
      />
      
      {/* Gradient Header */}
      <section className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Saved Properties
            </h1>
            <p className="text-muted-foreground">
              Compare your favorites and get notified when prices drop.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container py-8">
        {totalFavorites === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 max-w-lg mx-auto"
          >
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="absolute inset-2 bg-primary/5 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Heart className="h-10 w-10 text-primary/60" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No saved properties yet
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Start exploring and save properties you love! Click the heart icon on any listing to save it here for easy comparison.
            </p>

            <div className="bg-muted/50 rounded-xl p-5 text-left space-y-4 mb-8">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="h-4 w-4 text-primary" />
                Start by exploring popular cities
              </div>
              <div className="flex flex-wrap gap-2">
                {popularCities.map((city) => (
                  <Link
                    key={city}
                    to={`/listings?status=for_sale&city=${encodeURIComponent(city)}`}
                    className="px-3 py-1.5 rounded-full bg-background border border-border text-sm hover:border-primary hover:text-primary transition-colors"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/listings?status=for_sale">
                  Browse Properties
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/projects">
                  <Building className="h-4 w-4 mr-2" />
                  Explore Projects
                </Link>
              </Button>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                Not sure what you can afford?
              </p>
              <Button asChild variant="ghost" size="sm">
                <Link to="/tools?tool=affordability" className="text-primary">
                  <Calculator className="h-4 w-4 mr-2" />
                  Try our Affordability Calculator
                </Link>
              </Button>
            </div>

            {/* Support Footer */}
            <SupportFooter 
              message="Not sure where to start? [Tell us about your situation] and we'll point you in the right direction."
              linkText="Tell us about your situation"
              variant="subtle"
              className="mt-6"
            />
          </motion.div>
        ) : (
          <PullToRefresh onRefresh={handleRefresh} disabled={!isMobile}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
            {/* Guest Signup Banner */}
            {!user && totalFavorites > 0 && (
              <GuestSignupNudge
                icon={Bookmark}
                message="These properties are saved to this browser only. Create a free account to keep them forever and get price drop alerts."
                ctaText="Create account"
                variant="banner"
                intent="save_favorite"
              />
            )}

            {/* Stats Bar */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalFavorites} saved {totalFavorites === 1 ? 'item' : 'items'}
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4 text-primary" />
                <span>{alertsEnabledCount} with price alerts</span>
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'rent' | 'projects')}>
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="buy" className="gap-2">
                  Buy
                  {buyProperties.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {buyProperties.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rent" className="gap-2">
                  Rent
                  {rentProperties.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {rentProperties.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="projects" className="gap-2">
                  Projects
                  {projectFavorites.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {projectFavorites.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Buy Tab */}
              <TabsContent value="buy" className="mt-6">
                {buyProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No properties saved for purchase</p>
                    <Button asChild variant="link" className="mt-2">
                      <Link to="/listings?status=for_sale">Browse properties for sale</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {buyProperties.map((fav: any) => {
                      const property = fav.properties;
                      if (!property) return null;
                      const alertEnabled = fav.price_alert_enabled !== false;
                      
                      return (
                        <div key={property.id} className="space-y-2">
                          <div className="relative">
                            <PropertyCard 
                              property={property} 
                              showCompareButton={true}
                              showShareButton={false}
                              compareCategory="buy"
                            />
                          </div>
                          
                          <button
                            onClick={() => togglePriceAlert({ propertyId: property.id, enabled: !alertEnabled })}
                            disabled={isTogglingAlert}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors ${
                              alertEnabled 
                                ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {alertEnabled ? (
                              <>
                                <Bell className="h-3.5 w-3.5" />
                                <span>Price alerts on</span>
                              </>
                            ) : (
                              <>
                                <BellOff className="h-3.5 w-3.5" />
                                <span>Price alerts off</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Rent Tab */}
              <TabsContent value="rent" className="mt-6">
                {rentProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No rental properties saved</p>
                    <Button asChild variant="link" className="mt-2">
                      <Link to="/listings?status=for_rent">Browse rentals</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {rentProperties.map((fav: any) => {
                      const property = fav.properties;
                      if (!property) return null;
                      const alertEnabled = fav.price_alert_enabled !== false;
                      
                      return (
                        <div key={property.id} className="space-y-2">
                          <PropertyCard 
                            property={property} 
                            showCompareButton={true}
                            showShareButton={false}
                            compareCategory="rent"
                          />
                          
                          <button
                            onClick={() => togglePriceAlert({ propertyId: property.id, enabled: !alertEnabled })}
                            disabled={isTogglingAlert}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors ${
                              alertEnabled 
                                ? 'bg-primary/10 text-primary hover:bg-primary/15' 
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {alertEnabled ? (
                              <>
                                <Bell className="h-3.5 w-3.5" />
                                <span>Price alerts on</span>
                              </>
                            ) : (
                              <>
                                <BellOff className="h-3.5 w-3.5" />
                                <span>Price alerts off</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Projects Tab */}
              <TabsContent value="projects" className="mt-6">
                {projectFavorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No projects saved</p>
                    <Button asChild variant="link" className="mt-2">
                      <Link to="/projects">Browse new developments</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {projectFavorites.map((fav: any) => {
                      const project = fav.project;
                      if (!project) return null;
                      
                      return (
                        <div key={project.id} className="relative group">
                          <Link to={`/projects/${project.slug}`}>
                            <Card className="h-full overflow-hidden border border-border/60 shadow-sm hover:shadow-card-hover hover:border-primary/30 transition-all duration-300">
                              <div className="aspect-[16/10] overflow-hidden relative">
                                <img
                                  src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                                  alt={project.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                
                                {/* Compare Button - Top Right on Hover */}
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <CompareButton propertyId={project.id} category="projects" />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      removeProjectFavorite(project.id);
                                    }}
                                    className="h-8 w-8 bg-background/80 hover:bg-background text-primary hover:text-primary/80"
                                  >
                                    <Heart className="h-4 w-4 fill-current" />
                                  </Button>
                                </div>

                              </div>
                              <CardContent className="p-5 space-y-3">
                                <div className="space-y-1">
                                  <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                    {project.name}
                                  </h2>
                                  {project.developer && (
                                    <p className="text-sm text-primary font-medium">
                                      by {project.developer.name}
                                    </p>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  <span className="line-clamp-1">
                                    {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      {getStatusLabel(project.status)}
                                    </span>
                                  </div>
                                  <Progress 
                                    value={
                                      project.status === 'delivery' ? 100 :
                                      ['foundation', 'structure', 'finishing'].includes(project.status) ? (project.construction_progress_percent || 0) :
                                      0
                                    } 
                                    className="h-1.5" 
                                  />
                                </div>

                                <div className="pt-3 border-t border-border">
                                  <p className="text-xs text-muted-foreground">Starting from</p>
                                  <p className="text-xl font-bold text-primary">
                                    {formatPrice(project.price_from)}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </PullToRefresh>
        )}
      </div>

      {/* Compare Bar - only show on favorites page */}
      <CompareBar />
    </Layout>
  );
}
