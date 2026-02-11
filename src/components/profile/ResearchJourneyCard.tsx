import { Search, Building2, MapPin, Star } from 'lucide-react';
import { formatDistanceStrict } from 'date-fns';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

export function ResearchJourneyCard() {
  const { user } = useAuth();
  const { recentProperties, viewedDates } = useRecentlyViewed();

  // Only for logged-in users with 3+ viewed properties
  if (!user || recentProperties.length < 3) return null;

  // Compute stats
  const propertyCount = recentProperties.length;

  const cityCounts = new Map<string, number>();
  for (const p of recentProperties) {
    const city = (p as any).city || 'Unknown';
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
  }
  const cityCount = cityCounts.size;

  let topCity = 'Unknown';
  let topCityCount = 0;
  for (const [city, count] of cityCounts) {
    if (count > topCityCount) {
      topCity = city;
      topCityCount = count;
    }
  }

  // Time span from viewed dates
  let timeSpan = '';
  if (viewedDates.length >= 2) {
    const sorted = [...viewedDates].sort();
    const earliest = new Date(sorted[0]);
    const latest = new Date(sorted[sorted.length - 1]);
    if (latest.getTime() - earliest.getTime() > 60_000) {
      timeSpan = formatDistanceStrict(earliest, latest);
    }
  }

  const summaryParts = [
    `You've explored ${propertyCount} properties`,
    `across ${cityCount} ${cityCount === 1 ? 'city' : 'cities'}`,
  ];
  if (timeSpan) {
    summaryParts.push(`over the past ${timeSpan}`);
  }
  const summary = summaryParts.join(' ');

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-primary/5 to-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-primary/10 p-1.5">
          <Search className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Your Research Journey</h3>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{summary}</p>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="gap-1 font-medium">
          <Building2 className="h-3 w-3" />
          {propertyCount} Properties
        </Badge>
        <Badge variant="secondary" className="gap-1 font-medium">
          <MapPin className="h-3 w-3" />
          {cityCount} {cityCount === 1 ? 'City' : 'Cities'}
        </Badge>
        <Badge variant="secondary" className="gap-1 font-medium">
          <Star className="h-3 w-3" />
          Top: {topCity}
        </Badge>
      </div>
    </div>
  );
}
