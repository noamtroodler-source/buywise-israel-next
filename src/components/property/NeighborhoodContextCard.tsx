import { useNeighborhoodProfile } from '@/hooks/useNeighborhoodProfile';
import { MapPin, Sparkles } from 'lucide-react';

interface NeighborhoodContextCardProps {
  city: string;
  neighborhood: string | null | undefined;
}

export function NeighborhoodContextCard({ city, neighborhood }: NeighborhoodContextCardProps) {
  const { data: profile, isLoading } = useNeighborhoodProfile(city, neighborhood);

  if (isLoading || !profile) return null;
  if (!profile.narrative) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Neighborhood Guide
        </p>
      </div>

      {/* Narrative */}
      <p className="text-sm leading-relaxed text-foreground/90 italic">
        "{profile.narrative}"
      </p>

      {/* Best For callout */}
      {profile.best_for && (
        <div className="flex gap-2.5 rounded-lg bg-primary/5 px-4 py-3">
          <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <span className="font-semibold text-primary">Best for: </span>
            {profile.best_for}
          </p>
        </div>
      )}
    </div>
  );
}
