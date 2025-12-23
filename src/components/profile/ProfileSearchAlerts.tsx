import { motion } from 'framer-motion';
import { Bell, BellOff, Trash2, MapPin, Home, DollarSign, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useSearchAlerts, useDeleteSearchAlert, useToggleSearchAlert } from '@/hooks/useSearchAlerts';
import { SearchAlert } from '@/types/database';

function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `₪${(price / 1000000).toFixed(1)}M`;
  }
  return `₪${(price / 1000).toFixed(0)}K`;
}

interface AlertCardProps {
  alert: SearchAlert;
  onToggle: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

function AlertCard({ alert, onToggle, onDelete, isToggling, isDeleting }: AlertCardProps) {
  const filters = alert.filters as Record<string, any>;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={`p-4 rounded-lg border transition-all ${
        alert.is_active 
          ? 'bg-card border-border' 
          : 'bg-muted/30 border-muted'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Bell className={`h-4 w-4 ${alert.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="font-medium text-foreground truncate">
              {alert.name || 'Property Alert'}
            </span>
            {!alert.is_active && (
              <Badge variant="secondary" className="text-xs">Paused</Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {filters?.cities?.length > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                <MapPin className="h-3 w-3 mr-1" />
                {filters.cities.slice(0, 2).join(', ')}
                {filters.cities.length > 2 && ` +${filters.cities.length - 2}`}
              </Badge>
            )}
            
            {filters?.propertyTypes?.length > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                <Home className="h-3 w-3 mr-1" />
                {filters.propertyTypes.length} type{filters.propertyTypes.length > 1 ? 's' : ''}
              </Badge>
            )}
            
            {(filters?.priceMin || filters?.priceMax) && (
              <Badge variant="outline" className="text-xs font-normal">
                <DollarSign className="h-3 w-3 mr-1" />
                {filters.priceMin ? formatPrice(filters.priceMin) : '₪0'} - {filters.priceMax ? formatPrice(filters.priceMax) : 'Any'}
              </Badge>
            )}
            
            {filters?.bedrooms && (
              <Badge variant="outline" className="text-xs font-normal">
                {filters.bedrooms}+ beds
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={alert.is_active ?? false}
            onCheckedChange={(checked) => onToggle(alert.id, checked)}
            disabled={isToggling}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(alert.id)}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function ProfileSearchAlerts() {
  const { data: alerts = [], isLoading } = useSearchAlerts();
  const deleteAlert = useDeleteSearchAlert();
  const toggleAlert = useToggleSearchAlert();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card id="search-alerts-section">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Search Alerts
        </CardTitle>
        <Button variant="outline" size="sm" className="h-8" asChild>
          <a href="/listings?createAlert=true">
            <Plus className="h-4 w-4 mr-1" />
            New Alert
          </a>
        </Button>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-6">
            <BellOff className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No search alerts yet. Create one to get notified about new listings.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="/listings?createAlert=true">Create Your First Alert</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onToggle={(id, isActive) => toggleAlert.mutate({ alertId: id, isActive })}
                onDelete={(id) => deleteAlert.mutate(id)}
                isToggling={toggleAlert.isPending}
                isDeleting={deleteAlert.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
