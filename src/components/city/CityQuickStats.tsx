import { useState } from 'react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CanonicalMetrics, getRentalRange } from '@/hooks/useCanonicalMetrics';
import { MarketData } from '@/types/projects';

interface CityQuickStatsProps {
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

const NATIONAL_AVG_PRICE_SQM = 22800;

export function CityQuickStats({ marketData, canonicalMetrics, cityData }: CityQuickStatsProps) {
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

  const formatPrice = (value: number | null) => {
    if (!value) return null;
    return `₪${(value / 1000).toFixed(1)}K`;
  };

  const formatMedianPrice = (value: number | null) => {
    if (!value) return null;
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
    
    return null;
  };

  const rentalRange = getRentalPriceRange();

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border"
    >
      <div className="container">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 py-5 text-center">
          {/* Price per sqm */}
          {formatPrice(pricePerSqm) && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">
                {formatPrice(pricePerSqm)}/m²
              </span>
              {priceVsNational !== null && (
                <span className="text-sm text-muted-foreground">
                  · {priceVsNational > 0 ? '+' : ''}{priceVsNational}% vs avg
                </span>
              )}
            </div>
          )}

          {/* Divider */}
          {formatPrice(pricePerSqm) && formatMedianPrice(medianPrice) && (
            <div className="hidden sm:block w-px h-5 bg-border" />
          )}

          {/* Median price */}
          {formatMedianPrice(medianPrice) && (
            <div className="text-lg font-semibold text-foreground">
              {formatMedianPrice(medianPrice)} <span className="text-sm font-normal text-muted-foreground">median</span>
            </div>
          )}

          {/* Divider */}
          {formatMedianPrice(medianPrice) && rentalRange && (
            <div className="hidden sm:block w-px h-5 bg-border" />
          )}

          {/* Rent with selector */}
          {rentalRange && (
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">{rentalRange}</span>
              <span className="text-sm text-muted-foreground">/mo</span>
              <Select
                value={selectedRooms.toString()}
                onValueChange={(value) => setSelectedRooms(parseInt(value))}
              >
                <SelectTrigger className="h-7 w-[85px] text-xs border-none bg-muted/50">
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
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}
