import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Receipt, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CityArnonaCardProps {
  arnonaRateSqm: number | null;
  arnonaMonthlyAvg: number | null;
  cityName: string;
}

const NATIONAL_AVG_ARNONA = 95; // ₪/sqm per year average

export function CityArnonaCard({ arnonaRateSqm, arnonaMonthlyAvg, cityName }: CityArnonaCardProps) {
  const [apartmentSize, setApartmentSize] = useState(80);
  
  const rate = arnonaRateSqm || NATIONAL_AVG_ARNONA;
  const monthlyEstimate = Math.round((rate * apartmentSize) / 12);
  const annualEstimate = rate * apartmentSize;
  
  const percentVsNational = ((rate - NATIONAL_AVG_ARNONA) / NATIONAL_AVG_ARNONA) * 100;
  
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4 text-primary" />
          Arnona (Property Tax)
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
          <p className="text-2xl font-bold text-foreground">₪{monthlyEstimate.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ₪{annualEstimate.toLocaleString()}/year
          </p>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Rate: ₪{rate}/m²/year</span>
          <span className={percentVsNational >= 0 ? 'text-amber-600' : 'text-emerald-600'}>
            {percentVsNational >= 0 ? '+' : ''}{percentVsNational.toFixed(0)}% vs avg
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
