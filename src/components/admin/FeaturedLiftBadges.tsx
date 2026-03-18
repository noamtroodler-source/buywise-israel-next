import { Eye, Heart, MessageSquare } from 'lucide-react';
import { useFeaturedPropertyPerformance } from '@/hooks/useFeaturedPerformance';

interface FeaturedLiftBadgesProps {
  propertyId: string;
}

export function FeaturedLiftBadges({ propertyId }: FeaturedLiftBadgesProps) {
  const { data } = useFeaturedPropertyPerformance(propertyId);

  if (!data) return null;

  const badges = [
    { value: data.lift_views, icon: Eye, label: 'views', color: 'text-blue-600' },
    { value: data.lift_saves, icon: Heart, label: 'saves', color: 'text-rose-600' },
    { value: data.lift_inquiries, icon: MessageSquare, label: 'inq', color: 'text-emerald-600' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {badges.map((b) => (
        <span
          key={b.label}
          className={`inline-flex items-center gap-1 text-xs font-medium ${b.color}`}
        >
          <b.icon className="h-3 w-3" />
          +{b.value}
        </span>
      ))}
    </div>
  );
}
