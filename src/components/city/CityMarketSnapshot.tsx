import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Home, Percent, Calendar, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MarketData {
  average_price_sqm?: number | null;
  median_price?: number | null;
}

interface CityMarketSnapshotProps {
  marketData: MarketData[];
  cityName: string;
  canonicalMetrics?: {
    average_price_sqm?: number | null;
    median_apartment_price?: number | null;
    yoy_price_change?: number | null;
    gross_yield_percent?: number | null;
  } | null;
  cityData?: {
    average_price_sqm?: number | null;
    median_apartment_price?: number | null;
    yoy_price_change?: number | null;
    rental_3_room_min?: number | null;
    rental_3_room_max?: number | null;
  };
  historicalPrices?: {
    year: number;
    average_price_sqm?: number | null;
  }[];
}

export function CityMarketSnapshot({
  marketData,
  cityName,
  canonicalMetrics,
  cityData,
  historicalPrices = [],
}: CityMarketSnapshotProps) {
  const NATIONAL_AVG_SQM = 32000;

  // Get best available data
  const priceSqm = canonicalMetrics?.average_price_sqm || cityData?.average_price_sqm || marketData[0]?.average_price_sqm;
  const medianPrice = canonicalMetrics?.median_apartment_price || cityData?.median_apartment_price || marketData[0]?.median_price;
  const yoyChange = canonicalMetrics?.yoy_price_change || cityData?.yoy_price_change;
  const grossYield = canonicalMetrics?.gross_yield_percent;

  // Calculate 10-year growth
  const calculate10YearGrowth = () => {
    if (historicalPrices.length < 2) return null;
    const sorted = [...historicalPrices].sort((a, b) => a.year - b.year);
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];
    if (!oldest?.average_price_sqm || !newest?.average_price_sqm) return null;
    const growth = ((newest.average_price_sqm - oldest.average_price_sqm) / oldest.average_price_sqm) * 100;
    return growth;
  };

  const tenYearGrowth = calculate10YearGrowth();
  const typicalSqm = priceSqm && medianPrice ? Math.round(medianPrice / priceSqm) : null;
  const priceVsNational = priceSqm ? ((priceSqm - NATIONAL_AVG_SQM) / NATIONAL_AVG_SQM) * 100 : null;

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '—';
    if (price >= 1000000) return `₪${(price / 1000000).toFixed(2)}M`;
    return `₪${(price / 1000).toFixed(0)}K`;
  };

  const formatPriceSqm = (price: number | null | undefined) => {
    if (!price) return '—';
    return `₪${(price / 1000).toFixed(1)}K`;
  };

  // Card data for the 6 metrics
  const cards = [
    {
      title: 'Price per m²',
      value: formatPriceSqm(priceSqm),
      badge: yoyChange ? {
        value: `${yoyChange > 0 ? '+' : ''}${yoyChange.toFixed(1)}%`,
        positive: yoyChange >= 0,
      } : null,
      icon: Building2,
      subtitle: priceSqm ? 'vs. ₪32K national avg' : null,
    },
    {
      title: 'Median Price',
      value: formatPrice(medianPrice),
      icon: Home,
      subtitle: typicalSqm ? `Typical ${typicalSqm}m² apartment` : null,
    },
    {
      title: 'Gross Yield',
      value: grossYield ? `${grossYield.toFixed(1)}%` : '—',
      icon: Percent,
      subtitle: grossYield ? 'Annual rental return' : 'Data unavailable',
    },
    {
      title: 'Rental Range',
      value: cityData?.rental_3_room_min && cityData?.rental_3_room_max 
        ? `₪${(cityData.rental_3_room_min / 1000).toFixed(1)}K - ${(cityData.rental_3_room_max / 1000).toFixed(1)}K`
        : '—',
      icon: Home,
      subtitle: '3-room apartment',
    },
    {
      title: '10-Year Growth',
      value: tenYearGrowth ? `${tenYearGrowth > 0 ? '+' : ''}${tenYearGrowth.toFixed(0)}%` : '—',
      icon: TrendingUp,
      subtitle: tenYearGrowth ? 'Total appreciation' : 'Data unavailable',
    },
    {
      title: 'YoY Trend',
      value: yoyChange !== null && yoyChange !== undefined ? `${yoyChange > 0 ? '+' : ''}${yoyChange.toFixed(1)}%` : '—',
      icon: yoyChange && yoyChange >= 0 ? TrendingUp : TrendingDown,
      subtitle: 'Year-over-year change',
    },
  ];

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-6"
      >
        {/* 6-Card Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card className="border-border/50 h-full">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      {card.badge && (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            card.badge.positive 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {card.badge.value}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* National Context Bar */}
        {priceVsNational !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-muted/50 border border-border/50"
          >
            <span className="text-sm text-muted-foreground">National Context:</span>
            <span className="text-sm font-medium text-foreground">
              {priceVsNational > 0 
                ? `${priceVsNational.toFixed(0)}% above national average`
                : priceVsNational < 0
                ? `${Math.abs(priceVsNational).toFixed(0)}% below national average`
                : 'At national average'
              }
            </span>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}
