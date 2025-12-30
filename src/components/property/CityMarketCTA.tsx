import { Link } from 'react-router-dom';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CityMarketCTAProps {
  cityName: string;
}

// Convert city name to URL slug (e.g., "Tel Aviv" -> "tel-aviv", "Modi'in" -> "modiin")
const cityToSlug = (city: string): string => {
  return city
    .toLowerCase()
    .replace(/['']/g, '')      // Remove apostrophes (Modi'in -> modiin, Ra'anana -> raanana)
    .replace(/\s+/g, '-');     // Spaces to hyphens
};

export function CityMarketCTA({ cityName }: CityMarketCTAProps) {
  const citySlug = cityToSlug(cityName);
  
  return (
    <div className="p-5 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              Curious about {cityName}'s market?
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Explore price trends, market stats, neighborhood guides & what to watch
            </p>
          </div>
        </div>
        <Button asChild variant="default" size="default" className="shrink-0">
          <Link to={`/areas/${citySlug}`}>
            Explore {cityName}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
