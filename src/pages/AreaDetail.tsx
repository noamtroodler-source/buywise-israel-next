import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCity } from '@/hooks/useCities';
import { useProperties } from '@/hooks/useProperties';
import { useMarketData } from '@/hooks/useMarketData';
import { Neighborhood } from '@/types/content';

// Market Dashboard Components
import { MarketStatsCards } from '@/components/city/MarketStatsCards';
import { PriceTrendChart } from '@/components/city/PriceTrendChart';
import { MarketRealityTabs } from '@/components/city/MarketRealityTabs';
import { CityCalculators } from '@/components/city/CityCalculators';
import { ListingsCTA } from '@/components/city/ListingsCTA';
import { NeighborhoodGrid } from '@/components/city/NeighborhoodGrid';

export default function CityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: city, isLoading: cityLoading, error } = useCity(slug || '');
  const { data: properties = [], isLoading: propertiesLoading } = useProperties(
    city ? { city: city.name } : undefined
  );
  const { data: marketData = [], isLoading: marketLoading } = useMarketData(city?.name);

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };


  const getNeighborhoods = (): Neighborhood[] => {
    if (!city?.neighborhoods) return [];
    if (Array.isArray(city.neighborhoods)) return city.neighborhoods as Neighborhood[];
    return [];
  };

  const getMarketTagline = () => {
    if (marketData.length === 0) return null;
    const latestPrice = marketData[0]?.average_price_sqm || 0;
    const nationalAvg = 32000;
    const percentAbove = ((latestPrice - nationalAvg) / nationalAvg) * 100;
    
    if (percentAbove > 50) return `${percentAbove.toFixed(0)}% above national average — Israel's premium market`;
    if (percentAbove > 20) return `${percentAbove.toFixed(0)}% above national average — Strong market`;
    if (percentAbove > 0) return `${percentAbove.toFixed(0)}% above national average`;
    if (percentAbove > -20) return 'Competitive pricing — Great value market';
    return 'Affordable market — Below national average';
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
            <Link to="/areas">Browse All Cities</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const neighborhoods = getNeighborhoods();
  const marketTagline = getMarketTagline();

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <div className="relative h-[45vh] min-h-[350px]">
          <img
            src={city.hero_image || 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=1920'}
            alt={city.name}
            className="w-full h-full object-cover"
          />
          {/* Light blur/fade at top */}
          <div className="absolute inset-x-0 top-0 h-1/3 backdrop-blur-[2px] bg-gradient-to-b from-white/50 to-transparent" />
          {/* Bottom gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container">
              <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 mb-4" asChild>
                <Link to="/areas">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Cities
                </Link>
              </Button>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">{city.name}</h1>
              
              {/* Market Tagline */}
              {marketTagline && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg text-white/90 font-medium mb-4"
                >
                  {marketTagline}
                </motion.p>
              )}
              
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Avg. {formatPrice(city.average_price)}</span>
                </div>
                {city.highlights && city.highlights.length > 0 && (
                  <div className="hidden sm:flex items-center gap-2">
                    {city.highlights.slice(0, 3).map((highlight, index) => (
                      <Badge key={index} variant="secondary" className="bg-white/10 text-white border-0 backdrop-blur-sm">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Interactive Dashboard */}
        <div className="container py-8 space-y-8">
          {/* Market Stats Cards */}
          {marketLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : marketData.length > 0 ? (
            <MarketStatsCards marketData={marketData} cityName={city.name} />
          ) : null}

          {/* Two Column Layout for Chart and Tabs */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Price Trend Chart */}
            {marketData.length > 0 && (
              <PriceTrendChart marketData={marketData} cityName={city.name} />
            )}

            {/* Market Reality Tabs */}
            {marketData.length > 0 && (
              <MarketRealityTabs 
                marketData={marketData} 
                cityName={city.name}
                propertiesCount={properties.length}
              />
            )}
          </div>

          {/* Neighborhoods */}
          <NeighborhoodGrid neighborhoods={neighborhoods} cityName={city.name} />

          {/* Run the Numbers - Calculators */}
          <CityCalculators cityName={city.name} averagePrice={city.average_price || undefined} />

          {/* Browse Listings CTA */}
          <ListingsCTA cityName={city.name} propertiesCount={properties.length} />
        </div>
      </div>
    </Layout>
  );
}
