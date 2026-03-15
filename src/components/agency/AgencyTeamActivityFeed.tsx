import { Activity, Home, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgencyTeamActivity, TeamActivityItem } from '@/hooks/useAgencyTeamActivity';

interface Props {
  agencyId: string;
}

export function AgencyTeamActivityFeed({ agencyId }: Props) {
  const { data: items = [], isLoading } = useAgencyTeamActivity(agencyId);

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Team Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <ScrollArea className="h-[240px]">
            <div className="space-y-3 pr-2">
              {items.map(item => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({ item }: { item: TeamActivityItem }) {
  const Icon = item.type === 'new_listing' ? Home : MessageSquare;
  const iconBg = item.type === 'new_listing' ? 'bg-primary/10' : 'bg-accent';
  const iconColor = 'text-primary';

  return (
    <div className="flex items-start gap-3">
      <div className={`p-1.5 rounded-lg ${iconBg} flex-shrink-0`}>
        <Icon className={`h-3.5 w-3.5 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground truncate">{item.description}</p>
      </div>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">{item.relativeTime}</span>
    </div>
  );
}
