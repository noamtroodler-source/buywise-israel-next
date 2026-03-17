import { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Receipt, Info, TrendingUp, TrendingDown, User, HelpCircle } from 'lucide-react';
import { useFormatPricePerArea } from '@/contexts/PreferencesContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { calculateArnonaWithDiscount } from '@/lib/calculations/arnona';
import { ARNONA_AREA_TOOLTIP } from '@/lib/content/areaTooltips';
import { InlineSourceBadge } from '@/components/shared/InlineSourceBadge';
import { NATIONAL_AVG_PRICE_SQM, NATIONAL_AVG_ARNONA } from '@/lib/constants/marketAverages';

interface MarketOverviewCardsProps {
  cityName: string;
  arnonaRateSqm?: number | null;
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
  cityData?: {
    average_price_sqm?: number | null;
  };
}

export function MarketOverviewCards({
  cityName, 
  arnonaRateSqm,
  dataSources,
  lastVerified,
  cityData
}: MarketOverviewCardsProps) {
  const [apartmentSize, setApartmentSize] = useState(80);
  const { data: buyerProfile } = useBuyerProfile();
  
  // Use cityData directly — cities table is the single source of truth
  const pricePerSqm = cityData?.average_price_sqm ?? 0;
  const percentDiff = ((pricePerSqm - NATIONAL_AVG_PRICE_SQM) / NATIONAL_AVG_PRICE_SQM) * 100;
  
  // Arnona calculations with discount
  const rate = arnonaRateSqm || NATIONAL_AVG_ARNONA;
  const arnonaEstimate = calculateArnonaWithDiscount(
    rate,
    apartmentSize,
    buyerProfile ? {
      residency_status: buyerProfile.residency_status,
      aliyah_year: buyerProfile.aliyah_year,
      arnona_discount_categories: buyerProfile.arnona_discount_categories || [],
    } : null
  );
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-16 bg-background">
      <div className="container">
        {/* Section Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">City Overview</h2>
              <p className="text-muted-foreground mt-1">Key numbers to understand {cityName}'s real estate market</p>
            </div>
            <InlineSourceBadge 
              sources={dataSources} 
              lastVerified={lastVerified}
              variant="standard"
            />
          </div>
        </div>

        {/* 2-Card Grid */}
        <motion.div 
          className="grid gap-6 md:grid-cols-2"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Card 1: Price Position */}
          <motion.div variants={item}>
            <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-semibold">Price Position</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    {percentDiff >= 0 ? (
                      <TrendingUp className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-primary" />
                    )}
                    <p className="text-2xl font-bold text-foreground">
                      {percentDiff >= 0 ? '+' : ''}{percentDiff.toFixed(0)}%
                      <span className="text-base font-normal text-muted-foreground ml-1.5">vs national avg</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    National average: {formatPricePerAreaFn(NATIONAL_AVG_PRICE_SQM, 'ILS')}
                  </p>
                </div>
                
                {/* Affordability Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Affordable</span>
                    <span>Premium</span>
                  </div>
                  <div className="relative h-2 rounded-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-primary rounded-full shadow"
                      style={{ 
                        left: `calc(${Math.min(Math.max((percentDiff + 50) / 100 * 100, 5), 95)}% - 6px)` 
                      }}
                    />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  {percentDiff > 30 
                    ? 'Premium market with strong value retention'
                    : percentDiff > 0 
                      ? 'Established market with steady growth'
                      : 'Competitive pricing for the region'
                  }
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Arnona */}
          <motion.div variants={item}>
            <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CardTitle className="text-lg font-semibold">Arnona</CardTitle>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[220px]">
                          <p className="text-xs">Israel's municipal property tax, paid by residents to fund local services.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-3xl font-bold text-foreground">
                      ₪{arnonaEstimate.discountedMonthly.toLocaleString()}
                      <span className="text-base font-normal text-muted-foreground">/mo</span>
                    </p>
                    {(arnonaEstimate.discountPercent > 0 || arnonaEstimate.olehStatusChecked) && (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                              <User className="h-3 w-3" />
                              Personalized
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[260px]">
                            {arnonaEstimate.discountPercent > 0 ? (
                              <p className="text-xs">
                                {arnonaEstimate.isAutoDetectedDiscount 
                                  ? `Auto-detected from your Oleh profile: ${arnonaEstimate.discountType} discount applied.`
                                  : `Based on your profile: ${arnonaEstimate.discountType} discount applied.`
                                }
                              </p>
                            ) : arnonaEstimate.olehStatusChecked ? (
                              <p className="text-xs">
                                Your Oleh status was considered. Arnona discounts apply in Years 1-2 only
                                {arnonaEstimate.olehYearsSinceAliyah !== null && ` (you're in Year ${arnonaEstimate.olehYearsSinceAliyah + 1}).`}
                              </p>
                            ) : null}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    ₪{Math.round(arnonaEstimate.discountedMonthly * 12).toLocaleString()} annually
                  </p>
                </div>

                {/* Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Apartment size
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground/70" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-xs whitespace-pre-line">{ARNONA_AREA_TOOLTIP}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="text-sm font-medium">{apartmentSize}m²</span>
                  </div>
                  <Slider
                    value={[apartmentSize]}
                    onValueChange={([val]) => setApartmentSize(val)}
                    min={40}
                    max={180}
                    step={10}
                    className="w-full"
                  />
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
