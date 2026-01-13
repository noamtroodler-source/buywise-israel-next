import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Receipt, Info, User } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { calculateArnonaWithDiscount } from '@/lib/calculations/arnona';

interface CityArnonaCardProps {
  arnonaRateSqm: number | null;
  arnonaMonthlyAvg: number | null;
  cityName: string;
}

const NATIONAL_AVG_ARNONA = 95; // ₪/sqm per year average

export function CityArnonaCard({ arnonaRateSqm, arnonaMonthlyAvg, cityName }: CityArnonaCardProps) {
  const [apartmentSize, setApartmentSize] = useState(80);
  const { data: buyerProfile } = useBuyerProfile();
  
  const rate = arnonaRateSqm || NATIONAL_AVG_ARNONA;
  
  // Calculate with discount if profile available
  const arnonaEstimate = calculateArnonaWithDiscount(
    rate,
    apartmentSize,
    buyerProfile ? {
      residency_status: buyerProfile.residency_status,
      aliyah_year: buyerProfile.aliyah_year,
      arnona_discount_categories: buyerProfile.arnona_discount_categories || [],
    } : null
  );
  
  const percentVsNational = ((rate - NATIONAL_AVG_ARNONA) / NATIONAL_AVG_ARNONA) * 100;
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 text-primary" />
          Arnona (Property Tax)
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  <strong>ארנונה (Arnona)</strong> is the municipal property tax paid monthly by property owners and renters in Israel.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Apartment size</span>
            <span className="font-medium">{apartmentSize} m²</span>
          </div>
          <Slider
            value={[apartmentSize]}
            onValueChange={([value]) => setApartmentSize(value)}
            min={40}
            max={200}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>40 m²</span>
            <span>200 m²</span>
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Monthly Estimate</p>
          <div className="flex items-center justify-center gap-2">
            <p className="text-2xl font-bold text-foreground">₪{arnonaEstimate.discountedMonthly.toLocaleString()}</p>
            {arnonaEstimate.discountPercent > 0 && (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                      <User className="h-3 w-3" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{arnonaEstimate.discountType} discount applied</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ₪{Math.round(arnonaEstimate.discountedMonthly * 12).toLocaleString()}/year
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Rate: ₪{rate}/m²/year</span>
          {arnonaEstimate.discountPercent > 0 ? (
            <span className="text-primary font-medium">
              {arnonaEstimate.discountPercent}% discount
            </span>
          ) : (
            <span className={percentVsNational >= 0 ? 'text-amber-600' : 'text-emerald-600'}>
              {percentVsNational >= 0 ? '+' : ''}{percentVsNational.toFixed(0)}% vs avg
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
