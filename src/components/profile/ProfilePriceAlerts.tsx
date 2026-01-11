import { Bell, BellOff, TrendingDown, Check, ExternalLink, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePriceDropAlerts } from '@/hooks/usePriceDropAlerts';
import { useFavorites } from '@/hooks/useFavorites';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export function ProfilePriceAlerts() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = usePriceDropAlerts();
  const { favoriteIds } = useFavorites();
  const formatPrice = useFormatPrice();

  const trackedCount = favoriteIds.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingDown className="h-5 w-5 text-green-600" />
          Price Drop Alerts
        </CardTitle>
        {unreadCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => markAllAsRead()}
            className="text-xs"
          >
            <Check className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Banner */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <Bell className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Tracking {trackedCount} saved {trackedCount === 1 ? 'property' : 'properties'}</p>
            <p className="text-muted-foreground">
              You'll be notified here when any of your saved properties drop in price.
            </p>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <BellOff className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No price drops yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll notify you when prices drop on your saved properties
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Recent Price Drops</h4>
            <AnimatePresence>
              {notifications.slice(0, 5).map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    notification.is_read ? 'bg-background' : 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                  }`}
                >
                  <div className="shrink-0 w-12 h-12 rounded-md bg-muted overflow-hidden">
                    {notification.property?.images?.[0] ? (
                      <img 
                        src={notification.property.images[0]} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <TrendingDown className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {notification.property?.title || 'Property'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {notification.property?.city}
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 shrink-0">
                        -{notification.drop_percent}%
                      </Badge>
                    </div>
                    
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="line-through text-muted-foreground">
                        {formatPrice(notification.previous_price)}
                      </span>
                      <span className="text-green-600 font-medium">
                        → {formatPrice(notification.new_price)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          asChild
                          onClick={() => {
                            if (!notification.is_read) {
                              markAsRead(notification.id);
                            }
                          }}
                        >
                          <Link to={`/property/${notification.property_id}`}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {notifications.length > 5 && (
              <p className="text-xs text-center text-muted-foreground pt-2">
                And {notifications.length - 5} more...
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
