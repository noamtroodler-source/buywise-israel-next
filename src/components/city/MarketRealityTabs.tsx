import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Building, Hammer, Info } from 'lucide-react';
import { MarketData } from '@/types/projects';
import { useRentalPrices } from '@/hooks/useRentalPrices';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarketRealityTabsProps {
  marketData: MarketData[];
  cityName: string;
  propertiesCount: number;
  propertyTypes?: { name: string; value: number }[];
}

const NATIONAL_AVG_PRICE_SQM = 32000;

export function MarketRealityTabs({ 
  marketData, 
  cityName, 
  propertiesCount,
}: MarketRealityTabsProps) {
  const [selectedRooms, setSelectedRooms] = useState("3");
  const { data: rentalPrices } = useRentalPrices(cityName);
  
  const latestData = marketData[0];
  const pricePerSqm = latestData?.average_price_sqm || 0;
  const percentAboveNational = ((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;

  const selectedRentalPrice = rentalPrices?.find(r => r.rooms === parseInt(selectedRooms));

  const formatPrice = (value: number) => {
    return `₪${value.toLocaleString()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-foreground">Market Reality</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rentals" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted">
              <TabsTrigger value="rentals" className="flex items-center gap-1.5">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Rentals</span>
              </TabsTrigger>
              <TabsTrigger value="resale" className="flex items-center gap-1.5">
                <Building className="h-4 w-4" />
                <span className="hidden sm:inline">Resale</span>
              </TabsTrigger>
              <TabsTrigger value="projects" className="flex items-center gap-1.5">
                <Hammer className="h-4 w-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
            </TabsList>

            {/* Rentals Tab */}
            <TabsContent value="rentals" className="mt-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Typical Monthly Rent</p>
                {selectedRentalPrice ? (
                  <p className="text-4xl font-bold text-foreground">
                    {formatPrice(selectedRentalPrice.price_min)}–{formatPrice(selectedRentalPrice.price_max)}
                  </p>
                ) : (
                  <p className="text-2xl text-muted-foreground">No data available</p>
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <Select value={selectedRooms} onValueChange={setSelectedRooms}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Rooms" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'room' : 'rooms'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Rental Market</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cityName} rental prices reflect demand for this neighborhood. 
                      Prices may vary by location and property condition.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Resale Tab */}
            <TabsContent value="resale" className="mt-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Average Resale Price per m²</p>
                <p className="text-4xl font-bold text-foreground">
                  ₪{pricePerSqm.toLocaleString()}
                  <span className="text-lg font-normal text-muted-foreground">/m²</span>
                </p>
                <p className={`text-sm mt-2 font-medium ${percentAboveNational >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {percentAboveNational >= 0 ? '+' : ''}{percentAboveNational.toFixed(0)}% vs national average
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{propertiesCount}</p>
                  <p className="text-sm text-muted-foreground">For Sale</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{latestData?.total_transactions || 0}</p>
                  <p className="text-sm text-muted-foreground">Sold This Month</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Resale Market</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {percentAboveNational > 20 
                        ? `${cityName} is a premium resale market with strong value retention.`
                        : `${cityName} offers competitive resale pricing for buyers.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">New Development Activity</p>
                <p className="text-4xl font-bold text-foreground">
                  Active
                </p>
                <p className="text-sm mt-2 text-muted-foreground">
                  New projects launching in {cityName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">Pre-Sale</p>
                  <p className="text-sm text-muted-foreground">Best Prices</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">2025-2027</p>
                  <p className="text-sm text-muted-foreground">Delivery Dates</p>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Hammer className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">New Construction</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      New projects in {cityName} offer modern amenities and payment plans. 
                      Pre-sale units typically offer 10-15% savings.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}