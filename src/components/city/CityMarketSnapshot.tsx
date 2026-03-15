import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Home, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { MarketData } from '@/types/projects';
import { NATIONAL_AVG_PRICE_SQM } from '@/lib/constants/marketAverages';

interface CityMarketSnapshotProps {
  marketData: MarketData[];
  canonicalMetrics?: CanonicalMetrics | null;
  cityData?: {
    average_price_sqm?: number | null;
    median_apartment_price?: number | null;
    rental_3_room_min?: number | null;
    rental_3_room_max?: number | null;
    rental_4_room_min?: number | null;
    rental_4_room_max?: number | null;
  };
}



export function CityMarketSnapshot({ marketData, canonicalMetrics, cityData }: CityMarketSnapshotProps) {
  const [selectedRooms, setSelectedRooms] = useState<number>(3);
  
  const latestData = marketData[0];
  
  // Priority: Canonical > cityData > marketData
  const pricePerSqm = canonicalMetrics?.average_price_sqm 
    ?? cityData?.average_price_sqm 
    ?? latestData?.average_price_sqm 
    ?? null;
    
  const medianPrice = canonicalMetrics?.median_apartment_price 
    ?? cityData?.median_apartment_price 
    ?? latestData?.median_price 
    ?? null;

  // National comparison
  const priceVsNational = pricePerSqm 
    ? Math.round(((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100) 
    : null;

  // Typical sqm at median price
  const typicalSqm = (medianPrice && pricePerSqm && pricePerSqm > 0) 
    ? Math.round(medianPrice / pricePerSqm) 
    : null;

  const formatPrice = (value: number | null) => {
    if (!value) return 'N/A';
    return `₪${(value / 1000).toFixed(1)}K`;
  };

  const formatMedianPrice = (value: number | null) => {
    if (!value) return 'N/A';
    if (value >= 1000000) return `₪${(value / 1000000).toFixed(2)}M`;
    return `₪${(value / 1000).toFixed(0)}K`;
  };

  const formatRentalPrice = (value: number) => `₪${value.toLocaleString()}`;

  const getRentalPriceRange = () => {
    if (canonicalMetrics) {
      const range = getRentalRange(canonicalMetrics, selectedRooms);
      if (range.min && range.max) {
        return `${formatRentalPrice(range.min)}–${formatRentalPrice(range.max)}`;
      }
    }
    
    if (selectedRooms === 3 && cityData?.rental_3_room_min && cityData?.rental_3_room_max) {
      return `${formatRentalPrice(cityData.rental_3_room_min)}–${formatRentalPrice(cityData.rental_3_room_max)}`;
    }
    if (selectedRooms === 4 && cityData?.rental_4_room_min && cityData?.rental_4_room_max) {
      return `${formatRentalPrice(cityData.rental_4_room_min)}–${formatRentalPrice(cityData.rental_4_room_max)}`;
    }
    
    return 'N/A';
  };

  const stats = [
    {
      icon: DollarSign,
      value: formatPrice(pricePerSqm),
      label: 'Price per m²',
      sublabel: priceVsNational !== null 
        ? `${priceVsNational > 0 ? '+' : ''}${priceVsNational}% vs national avg`
        : 'Average asking price',
    },
    {
      icon: Home,
      value: formatMedianPrice(medianPrice),
      label: 'Median Price',
      sublabel: typicalSqm ? `~${typicalSqm}m² at this price` : 'Typical property value',
    },
    {
      icon: Key,
      value: getRentalPriceRange(),
      label: 'Monthly Rent',
      sublabel: 'Typical range',
      hasSelector: true,
    },
  ];

  return (
    <section className="py-12 bg-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50 hover:shadow-lg transition-shadow h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                    {stat.hasSelector ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={selectedRooms.toString()}
                          onValueChange={(value) => setSelectedRooms(parseInt(value))}
                        >
                          <SelectTrigger className="h-8 w-[100px] text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[2, 3, 4, 5].map((rooms) => (
                              <SelectItem key={rooms} value={rooms.toString()}>
                                {rooms} rooms
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">{stat.label}</span>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-foreground/80">{stat.label}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{stat.sublabel}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
