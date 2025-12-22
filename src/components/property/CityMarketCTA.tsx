import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CityMarketCTAProps {
  cityName: string;
}

// Convert city name to URL slug (e.g., "Tel Aviv" -> "tel-aviv")
const cityToSlug = (city: string): string => {
  return city.toLowerCase().replace(/\s+/g, '-');
};

export function CityMarketCTA({ cityName }: CityMarketCTAProps) {
  const citySlug = cityToSlug(cityName);
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/30 border border-border/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Curious about {cityName}'s market?
          </p>
          <p className="text-xs text-muted-foreground">
            Price trends, market stats & what to watch
          </p>
        </div>
      </div>
      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link to={`/areas/${citySlug}`}>
          Explore {cityName}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Link>
      </Button>
    </div>
  );
}
