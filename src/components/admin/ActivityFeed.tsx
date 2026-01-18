import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, UserPlus, Home, MessageSquare, Building, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityItem } from '@/hooks/useRecentActivity';

interface ActivityFeedProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

const activityIcons = {
  agent_registration: UserPlus,
  listing_submission: Home,
  inquiry: MessageSquare,
  project_submission: Building,
  user_signup: User,
};

const activityColors = {
  agent_registration: 'bg-primary/10 text-primary',
  listing_submission: 'bg-primary/10 text-primary',
  inquiry: 'bg-primary/10 text-primary',
  project_submission: 'bg-primary/10 text-primary',
  user_signup: 'bg-muted text-muted-foreground',
};

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          {activities.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.type];
                const colorClass = activityColors[activity.type];
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.relativeTime}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
