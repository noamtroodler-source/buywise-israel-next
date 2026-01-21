import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, Clock, Star, Mail, TrendingDown, 
  DollarSign, ChevronRight, X, Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAdminAlerts, type AdminAlert, type AlertPriority } from '@/hooks/useAdminAlerts';

const alertIcons = {
  expiring_featured: Star,
  stale_listings: Clock,
  pending_long: AlertTriangle,
  contact_backlog: Mail,
  exchange_rate_stale: DollarSign,
  conversion_drop: TrendingDown,
};

const priorityStyles: Record<AlertPriority, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  low: 'bg-muted text-muted-foreground border-border',
};

const priorityBadgeStyles: Record<AlertPriority, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-orange-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-muted-foreground text-background',
};

interface AdminAlertsPanelProps {
  maxAlerts?: number;
  showEmpty?: boolean;
  compact?: boolean;
}

export function AdminAlertsPanel({ 
  maxAlerts = 5, 
  showEmpty = false,
  compact = false 
}: AdminAlertsPanelProps) {
  const { data: alerts, isLoading } = useAdminAlerts();

  if (isLoading) {
    return (
      <Card className={cn(!compact && "border-l-4 border-l-primary")}>
        <CardHeader className={cn(compact && "pb-2")}>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-5 w-5 text-primary" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedAlerts = alerts?.slice(0, maxAlerts) || [];
  const hasMore = (alerts?.length || 0) > maxAlerts;

  if (displayedAlerts.length === 0 && !showEmpty) {
    return null;
  }

  if (displayedAlerts.length === 0 && showEmpty) {
    return (
      <Card className="border-l-4 border-l-primary/30">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium text-foreground">All Clear!</h3>
            <p className="text-sm text-muted-foreground">No urgent items require your attention</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalCount = alerts?.filter(a => a.priority === 'critical').length || 0;
  const highCount = alerts?.filter(a => a.priority === 'high').length || 0;

  return (
    <Card className={cn(
      "border-l-4",
      criticalCount > 0 ? "border-l-destructive" : 
      highCount > 0 ? "border-l-orange-500" : "border-l-primary"
    )}>
      <CardHeader className={cn("pb-2", compact && "py-3")}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Bell className={cn(
              "h-5 w-5",
              criticalCount > 0 ? "text-destructive" : "text-primary"
            )} />
            Alerts
            {(criticalCount > 0 || highCount > 0) && (
              <Badge variant="secondary" className={cn(
                "ml-1",
                criticalCount > 0 ? priorityBadgeStyles.critical : priorityBadgeStyles.high
              )}>
                {criticalCount + highCount}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && "pb-3")}>
        <AnimatePresence>
          <div className="space-y-2">
            {displayedAlerts.map((alert, index) => (
              <AlertItem key={alert.id} alert={alert} index={index} compact={compact} />
            ))}
          </div>
        </AnimatePresence>
        
        {hasMore && (
          <div className="mt-3 pt-3 border-t">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" asChild>
              <Link to="/admin">
                View all {alerts?.length} alerts
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ alert, index, compact }: { alert: AdminAlert; index: number; compact?: boolean }) {
  const Icon = alertIcons[alert.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={alert.href}
        className={cn(
          "flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm",
          priorityStyles[alert.priority],
          "hover:translate-x-1"
        )}
      >
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          alert.priority === 'critical' ? "bg-destructive/20" :
          alert.priority === 'high' ? "bg-orange-500/20" :
          alert.priority === 'medium' ? "bg-yellow-500/20" : "bg-muted"
        )}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "font-medium truncate",
              compact ? "text-sm" : "text-sm"
            )}>
              {alert.title}
            </p>
            <Badge variant="secondary" className={cn(
              "shrink-0 text-[10px] px-1.5 py-0",
              priorityBadgeStyles[alert.priority]
            )}>
              {alert.count}
            </Badge>
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {alert.description}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 opacity-50" />
      </Link>
    </motion.div>
  );
}

// Compact version for sidebar or header
export function AlertsBadge() {
  const { data: alerts } = useAdminAlerts();
  const criticalCount = alerts?.filter(a => a.priority === 'critical' || a.priority === 'high').length || 0;

  if (criticalCount === 0) return null;

  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
      {criticalCount > 9 ? '9+' : criticalCount}
    </span>
  );
}
