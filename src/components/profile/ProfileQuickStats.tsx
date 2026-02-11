import { Building2, MapPin, Heart, Bell } from 'lucide-react';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useFavorites } from '@/hooks/useFavorites';
import { useSearchAlerts } from '@/hooks/useSearchAlerts';
import { useAuth } from '@/hooks/useAuth';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-foreground leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export function ProfileQuickStats() {
  const { user } = useAuth();
  const { recentProperties } = useRecentlyViewed();
  const { favoriteIds } = useFavorites();
  const { data: alerts = [] } = useSearchAlerts();

  const propertyCount = recentProperties.length;

  const cityCounts = new Map<string, number>();
  for (const p of recentProperties) {
    const city = (p as any).city || 'Unknown';
    cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
  }
  const cityCount = cityCounts.size;

  let topCity = '—';
  let topCityCount = 0;
  for (const [city, count] of cityCounts) {
    if (count > topCityCount) {
      topCity = city;
      topCityCount = count;
    }
  }

  const savedCount = favoriteIds?.length || 0;
  const activeAlerts = alerts.filter((a: any) => a.is_active !== false).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={<Building2 className="h-5 w-5" />}
        value={propertyCount}
        label="Properties Viewed"
      />
      <StatCard
        icon={<MapPin className="h-5 w-5" />}
        value={cityCount}
        label="Cities Explored"
      />
      <StatCard
        icon={<Heart className="h-5 w-5" />}
        value={savedCount}
        label="Saved Properties"
      />
      <StatCard
        icon={<Bell className="h-5 w-5" />}
        value={activeAlerts}
        label="Active Alerts"
      />
    </div>
  );
}
