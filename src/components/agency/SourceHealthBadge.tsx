import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceHealthBadgeProps {
  consecutiveFailures: number;
  lastSyncedAt: string | null;
  isActive: boolean;
  className?: string;
}

/**
 * Compact health indicator for an agency_source row.
 * - paused → grey "Paused"
 * - never synced → grey "Pending"
 * - 0 failures → green "Healthy"
 * - 1-2 failures → amber "Warning"
 * - 3+ failures → red "Broken"
 */
export function SourceHealthBadge({
  consecutiveFailures,
  lastSyncedAt,
  isActive,
  className,
}: SourceHealthBadgeProps) {
  if (!isActive) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Clock className="h-3 w-3" />
        Paused
      </Badge>
    );
  }

  if (!lastSyncedAt) {
    return (
      <Badge variant="outline" className={cn("gap-1 text-muted-foreground", className)}>
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }

  if (consecutiveFailures >= 3) {
    return (
      <Badge variant="destructive" className={cn("gap-1", className)}>
        <XCircle className="h-3 w-3" />
        Broken
      </Badge>
    );
  }

  if (consecutiveFailures > 0) {
    return (
      <Badge
        variant="outline"
        className={cn("gap-1 border-warning bg-warning/10 text-warning", className)}
      >
        <AlertTriangle className="h-3 w-3" />
        Warning
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-success bg-success/10 text-success", className)}
    >
      <CheckCircle2 className="h-3 w-3" />
      Healthy
    </Badge>
  );
}
