import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, TrendingUp, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { useCities } from '@/hooks/useCities';

export default function Cities() {
  const { data: cities = [], isLoading } = useCities();

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
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
    return pop.toString();
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold text-foreground">Explore Cities</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover the best neighborhoods and find your perfect home in Israel's most desirable cities.
            </p>
          </div>

          {/* Cities Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : cities.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No cities yet</h2>
              <p className="text-muted-foreground">
                City information will be available soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cities.map((city, index) => (
                <motion.div
                  key={city.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/cities/${city.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img
                          src={city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800'}
                          alt={city.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <h2 className="text-2xl font-bold text-white">{city.name}</h2>
                        </div>
                      </div>
                      <CardContent className="p-5 space-y-4">
                        {city.description && (
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {city.description}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Population</p>
                              <p className="font-medium">{formatPopulation(city.population)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Avg. Price</p>
                              <p className="font-medium">{formatPrice(city.average_price)}</p>
                            </div>
                          </div>
                        </div>
                        {city.highlights && city.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {city.highlights.slice(0, 3).map((highlight, i) => (
                              <span
                                key={i}
                                className="text-xs bg-muted px-2 py-1 rounded"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
