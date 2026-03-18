import { Eye, Heart, MessageSquare, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeaturedPerformanceSummary } from '@/hooks/useFeaturedPerformance';

export function FeaturedPerformanceSummary() {
  const { data, isLoading } = useFeaturedPerformanceSummary();

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (!data || data.activeCount === 0) return null;

  const metrics = [
    { label: 'Active', value: data.activeCount, icon: Star, color: 'text-yellow-600' },
    { label: 'Views Lift', value: `+${data.totalLiftViews}`, icon: Eye, color: 'text-blue-600' },
    { label: 'Saves Lift', value: `+${data.totalLiftSaves}`, icon: Heart, color: 'text-rose-600' },
    { label: 'Inquiry Lift', value: `+${data.totalLiftInquiries}`, icon: MessageSquare, color: 'text-emerald-600' },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Featured Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <m.icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
              <p className="text-lg font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
