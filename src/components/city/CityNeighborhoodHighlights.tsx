import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { FeaturedNeighborhood, PriceTier } from '@/types/neighborhood';
import { cn } from '@/lib/utils';

interface CityNeighborhoodHighlightsProps {
  cityName: string;
  neighborhoods: FeaturedNeighborhood[];
}

const priceTierConfig: Record<PriceTier, { label: string; className: string }> = {
  'budget': { 
    label: 'Budget-friendly', 
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
  },
  'mid-range': { 
    label: 'Mid-range', 
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' 
  },
  'premium': { 
    label: 'Premium', 
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' 
  },
  'ultra-premium': { 
    label: 'Ultra-premium', 
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' 
  },
};

function NeighborhoodCard({ neighborhood }: { neighborhood: FeaturedNeighborhood }) {
  const tierConfig = priceTierConfig[neighborhood.price_tier];
  
  return (
    <Card className="min-w-[280px] max-w-[320px] flex-shrink-0 sm:min-w-0 sm:max-w-none sm:flex-shrink border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-base leading-tight">{neighborhood.name}</h3>
            {neighborhood.name_he && (
              <p className="text-xs text-muted-foreground/70 font-normal" dir="rtl">
                {neighborhood.name_he}
              </p>
            )}
          </div>
          <Badge 
            variant="outline" 
            className={cn('text-[10px] px-1.5 py-0 h-5 whitespace-nowrap', tierConfig.className)}
          >
            {tierConfig.label}
          </Badge>
        </div>
        <p className="text-sm font-medium text-primary">{neighborhood.vibe}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {neighborhood.description}
        </p>
      </CardContent>
    </Card>
  );
}

export function CityNeighborhoodHighlights({ cityName, neighborhoods }: CityNeighborhoodHighlightsProps) {
  if (!neighborhoods || neighborhoods.length === 0) {
    return null;
  }

  const useGrid = neighborhoods.length >= 4;

  return (
    <section className="py-10 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Neighborhoods in {cityName}
          </h2>
        </div>

        {/* Cards Layout */}
        {useGrid ? (
          // Grid layout for 4+ neighborhoods
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {neighborhoods.map((neighborhood) => (
              <NeighborhoodCard key={neighborhood.name} neighborhood={neighborhood} />
            ))}
          </div>
        ) : (
          // Horizontal scroll for 2-3 neighborhoods on mobile, flex on desktop
          <>
            {/* Mobile: Horizontal scroll */}
            <div className="sm:hidden">
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-4">
                  {neighborhoods.map((neighborhood) => (
                    <NeighborhoodCard key={neighborhood.name} neighborhood={neighborhood} />
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
            
            {/* Desktop: Flex layout */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {neighborhoods.map((neighborhood) => (
                <NeighborhoodCard key={neighborhood.name} neighborhood={neighborhood} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
