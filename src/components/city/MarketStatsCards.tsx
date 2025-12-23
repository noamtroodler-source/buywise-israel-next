import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Home, Zap, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MarketData } from '@/types/projects';
import { useRentalPrices } from '@/hooks/useRentalPrices';

interface MarketStatsCardsProps {
  marketData: MarketData[];
  cityName: string;
  cityData?: {
    average_price_sqm?: number | null;
    median_apartment_price?: number | null;
    yoy_price_change?: number | null;
    rental_3_room_min?: number | null;
    rental_3_room_max?: number | null;
    rental_4_room_min?: number | null;
    rental_4_room_max?: number | null;
  };
}

const getMonthName = (month: number | null) => {
  if (!month) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
};

export function MarketStatsCards({ marketData, cityName, cityData }: MarketStatsCardsProps) {
  const [selectedRooms, setSelectedRooms] = useState<number>(3);
  const { data: rentalPrices } = useRentalPrices(cityName);
  
  const latestData = marketData[0];
  const previousData = marketData[1];
  
  // Use city data as fallback for price per sqm
  const pricePerSqm = latestData?.average_price_sqm || cityData?.average_price_sqm || null;
  const medianPrice = latestData?.median_price || cityData?.median_apartment_price || null;
  const priceChange = latestData?.price_change_percent || cityData?.yoy_price_change || null;

  const formatPrice = (value: number | null) => {
    if (!value) return 'N/A';
    return `₪${(value / 1000).toFixed(1)}K`;
  };

  const formatMedianPrice = (value: number | null) => {
    if (!value) return 'N/A';
    if (value >= 1000000) {
      return `₪${(value / 1000000).toFixed(2)}M`;
    }
    return `₪${(value / 1000).toFixed(0)}K`;
  };

  const formatRentalPrice = (value: number) => {
    return `₪${value.toLocaleString()}`;
  };

  const getPriceChange = () => {
    return priceChange;
  };

  // Get rental prices from city data if rental_prices table doesn't have data
  const getCityRentalRange = (rooms: number) => {
    if (rooms === 3 && cityData?.rental_3_room_min && cityData?.rental_3_room_max) {
      return { min: cityData.rental_3_room_min, max: cityData.rental_3_room_max };
    }
    if (rooms === 4 && cityData?.rental_4_room_min && cityData?.rental_4_room_max) {
      return { min: cityData.rental_4_room_min, max: cityData.rental_4_room_max };
    }
    return null;
  };

  const selectedRentalPrice = rentalPrices?.find(rp => rp.rooms === selectedRooms);
  const cityRentalRange = getCityRentalRange(selectedRooms);
  
  const rentalPriceRange = selectedRentalPrice 
    ? `${formatRentalPrice(selectedRentalPrice.price_min)}–${formatRentalPrice(selectedRentalPrice.price_max)}`
    : cityRentalRange
      ? `${formatRentalPrice(cityRentalRange.min)}–${formatRentalPrice(cityRentalRange.max)}`
      : 'N/A';

  const dataDate = latestData ? `${getMonthName(latestData.month)} ${latestData.year}` : null;

  return (
    <div className="space-y-3">
      {dataDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Data from {dataDate} • Trends are month-over-month</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Price per m² Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                {getPriceChange() !== null && (
                  <div className={`flex items-center text-xs font-medium ${
                    getPriceChange()! > 0 ? 'text-emerald-600' : getPriceChange()! < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {getPriceChange()! > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : getPriceChange()! < 0 ? (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    ) : null}
                    {getPriceChange() !== 0 && (
                      <span title="Month-over-Month">
                        {Math.abs(getPriceChange()!).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{formatPrice(pricePerSqm)}</p>
                <p className="text-sm font-medium text-foreground/80">Price per m²</p>
                <p className="text-xs text-muted-foreground">Average asking price</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Median Price Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Home className="h-4 w-4 text-primary" />
                </div>
                {previousData && latestData?.median_price && previousData?.median_price && (
                  <div className={`flex items-center text-xs font-medium ${
                    (latestData.median_price - previousData.median_price) > 0 ? 'text-emerald-600' : 
                    (latestData.median_price - previousData.median_price) < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {(latestData.median_price - previousData.median_price) > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : (latestData.median_price - previousData.median_price) < 0 ? (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    ) : null}
                    <span title="Month-over-Month">
                      {Math.abs((latestData.median_price - previousData.median_price) / previousData.median_price * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{formatMedianPrice(medianPrice)}</p>
                <p className="text-sm font-medium text-foreground/80">Median Price</p>
                <p className="text-xs text-muted-foreground">Typical property value</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rental Price Range Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Home className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">{rentalPriceRange}</p>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedRooms.toString()}
                    onValueChange={(value) => setSelectedRooms(parseInt(value))}
                  >
                    <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7].map((rooms) => (
                        <SelectItem key={rooms} value={rooms.toString()}>
                          {rooms} {rooms === 1 ? 'room' : 'rooms'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">rent</span>
                </div>
                <p className="text-xs text-muted-foreground">Typical monthly rent</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Market Trend Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                {getPriceChange() !== null && (
                  <div className={`flex items-center text-xs font-medium ${
                    getPriceChange()! > 0 ? 'text-emerald-600' : getPriceChange()! < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {getPriceChange()! > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : getPriceChange()! < 0 ? (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    ) : null}
                    {getPriceChange() !== 0 && (
                      <span title="Month-over-Month">
                        {Math.abs(getPriceChange()!).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-foreground">
                  {getPriceChange() ? `${getPriceChange()! > 0 ? '+' : ''}${getPriceChange()?.toFixed(1)}%` : 'Stable'}
                </p>
                <p className="text-sm font-medium text-foreground/80">Market Trend</p>
                <p className="text-xs text-muted-foreground">Price momentum</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
