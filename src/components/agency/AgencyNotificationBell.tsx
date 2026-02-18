import { Bell, Users, FileText, Building2, AlertCircle, Loader2, Check, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useAgencyNotifications,
  useAgencyUnreadCount,
  useMarkAgencyNotificationRead,
  useMarkAllAgencyNotificationsRead,
  AgencyNotification,
} from '@/hooks/useAgencyNotifications';

const notificationIcons: Record<string, React.ElementType> = {
  lead: FileText,
  join_request: Users,
  team: Building2,
  system: AlertCircle,
  blog_reward: Coins,
};

const notificationColors: Record<string, string> = {
  lead: 'text-primary',
  join_request: 'text-primary',
  team: 'text-primary',
  system: 'text-primary',
  blog_reward: 'text-amber-500',
};

export function AgencyNotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useAgencyNotifications();
  const { data: unreadCount = 0 } = useAgencyUnreadCount();
  const markRead = useMarkAgencyNotificationRead();
  const markAllRead = useMarkAllAgencyNotificationsRead();

  const handleNotificationClick = (notification: AgencyNotification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-xl">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-xl" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              className="text-xs h-7 text-primary hover:text-primary/80"
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || AlertCircle;
                const colorClass = notificationColors[notification.type] || 'text-muted-foreground';

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'w-full p-4 text-left hover:bg-muted/50 transition-colors flex gap-3',
                      !notification.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className={cn('h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium line-clamp-1', !notification.is_read && 'text-foreground')}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
