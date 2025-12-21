import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Users, TrendingUp, Home, Star, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { Neighborhood } from '@/types/content';

export default function CityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: city, isLoading: cityLoading, error } = useCity(slug || '');
  const { data: properties = [], isLoading: propertiesLoading } = useProperties(
    city ? { city: city.name } : undefined
  );

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatPopulation = (pop: number | null) => {
    if (!pop) return 'N/A';
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)} million`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
    return pop.toString();
  };

  const getNeighborhoods = (): Neighborhood[] => {
    if (!city?.neighborhoods) return [];
    if (Array.isArray(city.neighborhoods)) return city.neighborhoods as Neighborhood[];
    return [];
  };

  if (cityLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !city) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">City not found</h1>
          <p className="text-muted-foreground mb-6">
            The city you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link to="/cities">Browse All Cities</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const neighborhoods = getNeighborhoods();

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[40vh] min-h-[300px]">
          <img
            src={city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920'}
            alt={city.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container">
              <Button variant="ghost" className="text-white mb-4" asChild>
                <Link to="/cities">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Cities
                </Link>
              </Button>
              <h1 className="text-5xl font-bold text-white mb-2">{city.name}</h1>
              <div className="flex items-center gap-4 text-white/80">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatPopulation(city.population)}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Avg. {formatPrice(city.average_price)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Description */}
            {city.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About {city.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{city.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Highlights */}
            {city.highlights && city.highlights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-accent" />
                    Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {city.highlights.map((highlight, index) => (
                      <Badge key={index} variant="secondary" className="text-sm">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Neighborhoods */}
            {neighborhoods.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Neighborhoods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {neighborhoods.map((neighborhood, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <h3 className="font-semibold text-foreground">{neighborhood.name}</h3>
                        {neighborhood.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {neighborhood.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Properties in this City */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Home className="h-6 w-6 text-primary" />
                  Properties in {city.name}
                </h2>
                <Button variant="outline" asChild>
                  <Link to={`/listings?city=${encodeURIComponent(city.name)}`}>
                    View All
                  </Link>
                </Button>
              </div>

              {propertiesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : properties.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No properties currently listed in {city.name}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {properties.slice(0, 6).map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
