import { useState } from 'react';
import { Bell, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSearchAlerts, useToggleSearchAlert, useDeleteSearchAlert } from '@/hooks/useSearchAlerts';
import { CreateAlertFromProfileDialog } from './CreateAlertFromProfileDialog';

export function AlertsCompact() {
  const { data: alerts = [], isLoading } = useSearchAlerts();
  const toggleAlert = useToggleSearchAlert();
  const deleteAlert = useDeleteSearchAlert();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-3 md:p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Search Alerts</span>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Search Alerts</span>
          </div>
          {alerts.length > 0 && (
            <span className="text-xs text-muted-foreground">{alerts.length} active</span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full bg-muted mx-auto mb-2 flex items-center justify-center">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-2">No alerts set up yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Create Alert
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/40 group"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {alert.name || 'Unnamed Alert'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {(alert.filters as any)?.city || 'All locations'}
                  </p>
                </div>
                <Switch
                  checked={alert.is_active}
                  onCheckedChange={() => toggleAlert.mutate({ 
                    alertId: alert.id, 
                    isActive: !alert.is_active 
                  })}
                  className="ml-2"
                />
              </div>
            ))}

            {alerts.length > 4 && (
              <p className="text-xs text-center text-muted-foreground pt-1">
                +{alerts.length - 4} more alerts
              </p>
            )}

            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full h-8 text-xs text-primary mt-2"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New Alert
            </Button>
          </div>
        )}
      </div>

      <CreateAlertFromProfileDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
    </>
  );
}
