import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Clock, Star, ChevronRight, 
  CheckCircle2, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';

interface TodaysPrioritiesProps {
  pendingAgents: number;
  pendingListings: number;
  pendingProjects: number;
  pendingAgencies: number;
  pendingDevelopers: number;
}

export function TodaysPriorities({
  pendingAgents,
  pendingListings,
  pendingProjects,
  pendingAgencies,
  pendingDevelopers,
}: TodaysPrioritiesProps) {
  const { data: alerts, isLoading: alertsLoading } = useAdminAlerts();
  
  const totalPending = pendingAgents + pendingListings + pendingProjects + pendingAgencies + pendingDevelopers;
  const criticalAlerts = alerts?.filter(a => a.priority === 'critical') || [];
  const highAlerts = alerts?.filter(a => a.priority === 'high') || [];
  const urgentCount = criticalAlerts.length + highAlerts.length;

  type PriorityItem = {
    id: string;
    type: 'alert' | 'pending';
    priority: 'critical' | 'high' | 'medium';
    title: string;
    description: string;
    count: number;
    href: string;
  };

  const priorityItems: PriorityItem[] = [
    ...criticalAlerts.map(alert => ({
      id: alert.id,
      type: 'alert' as const,
      priority: 'critical' as const,
      title: alert.title,
      description: alert.description,
      count: alert.count,
      href: alert.href,
    })),
    ...highAlerts.map(alert => ({
      id: alert.id,
      type: 'alert' as const,
      priority: 'high' as const,
      title: alert.title,
      description: alert.description,
      count: alert.count,
      href: alert.href,
    })),
  ];

  // Add pending items if any exist and no critical/high alerts
  if (priorityItems.length < 3 && totalPending > 0) {
    if (pendingListings > 0) {
      priorityItems.push({
        id: 'pending-listings',
        type: 'pending' as const,
        priority: 'medium' as const,
        title: 'Listings Pending Review',
        description: `${pendingListings} listing${pendingListings > 1 ? 's' : ''} waiting for approval`,
        count: pendingListings,
        href: '/admin/review',
      });
    }
    if (pendingAgents > 0) {
      priorityItems.push({
        id: 'pending-agents',
        type: 'pending' as const,
        priority: 'medium' as const,
        title: 'Agents Pending Approval',
        description: `${pendingAgents} agent${pendingAgents > 1 ? 's' : ''} waiting for verification`,
        count: pendingAgents,
        href: '/admin/agents',
      });
    }
    if (pendingProjects > 0) {
      priorityItems.push({
        id: 'pending-projects',
        type: 'pending' as const,
        priority: 'medium' as const,
        title: 'Projects Pending Review',
        description: `${pendingProjects} project${pendingProjects > 1 ? 's' : ''} waiting for approval`,
        count: pendingProjects,
        href: '/admin/projects',
      });
    }
  }

  // Limit to top 4 items
  const displayItems = priorityItems.slice(0, 4);

  if (alertsLoading) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Today's Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (displayItems.length === 0) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">You're All Caught Up!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No urgent items require your attention right now
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-2 border-dashed bg-gradient-to-br from-primary/5 to-transparent",
      urgentCount > 0 ? "border-destructive/30" : "border-primary/20"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className={cn(
              "h-5 w-5",
              urgentCount > 0 ? "text-destructive" : "text-primary"
            )} />
            Today's Priorities
            {urgentCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {urgentCount} urgent
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {displayItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.href}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-all hover:shadow-md group",
                  item.priority === 'critical' 
                    ? "bg-destructive/5 border-destructive/20 hover:border-destructive/40" 
                    : item.priority === 'high'
                    ? "bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40"
                    : "bg-card border-border hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                  item.priority === 'critical' ? "bg-destructive/10" :
                  item.priority === 'high' ? "bg-orange-500/10" :
                  "bg-primary/10"
                )}>
                  {item.priority === 'critical' || item.priority === 'high' ? (
                    <AlertTriangle className={cn(
                      "h-5 w-5",
                      item.priority === 'critical' ? "text-destructive" : "text-orange-500"
                    )} />
                  ) : (
                    <Clock className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground truncate">
                      {item.title}
                    </p>
                    <Badge variant="secondary" className={cn(
                      "shrink-0",
                      item.priority === 'critical' ? "bg-destructive text-destructive-foreground" :
                      item.priority === 'high' ? "bg-orange-500 text-white" :
                      "bg-muted"
                    )}>
                      {item.count}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
