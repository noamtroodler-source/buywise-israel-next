import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useActiveBoosts } from '@/hooks/useBoosts';
import { formatDistanceToNow } from 'date-fns';

interface ActiveBoostBadgeProps {
  targetType: 'property' | 'project';
  targetId: string;
}

export function ActiveBoostBadge({ targetType, targetId }: ActiveBoostBadgeProps) {
  const { data: boosts = [] } = useActiveBoosts(targetType, targetId);

  if (boosts.length === 0) return null;

  const soonestEnd = boosts.reduce((min, b) => (b.ends_at < min ? b.ends_at : min), boosts[0].ends_at);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1 text-xs">
          <Zap className="h-3 w-3" />
          Boosted
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{boosts.length} active boost{boosts.length > 1 ? 's' : ''}</p>
        <p className="text-xs text-muted-foreground">
          Expires {formatDistanceToNow(new Date(soonestEnd), { addSuffix: true })}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
