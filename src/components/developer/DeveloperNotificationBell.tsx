import { Bell, Check, CheckCheck, MessageSquare, FileCheck, AlertCircle, Info, ExternalLink, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useDeveloperNotifications, 
  useDeveloperUnreadCount, 
  useMarkDeveloperNotificationRead,
  useMarkAllDeveloperNotificationsRead,
  DeveloperNotification 
} from '@/hooks/useDeveloperNotifications';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const typeConfig: Record<DeveloperNotification['type'], { icon: typeof Bell; color: string }> = {
  inquiry: { icon: MessageSquare, color: 'text-blue-500' },
  project_approved: { icon: FileCheck, color: 'text-green-500' },
  project_rejected: { icon: AlertCircle, color: 'text-red-500' },
  changes_requested: { icon: AlertCircle, color: 'text-amber-500' },
  system: { icon: Info, color: 'text-muted-foreground' },
  blog_reward: { icon: Coins, color: 'text-amber-500' },
};

export function DeveloperNotificationBell() {
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useDeveloperNotifications();
  const { data: unreadCount = 0 } = useDeveloperUnreadCount();
  const markRead = useMarkDeveloperNotificationRead();
  const markAllRead = useMarkAllDeveloperNotificationsRead();

  const handleNotificationClick = (notification: DeveloperNotification) => {
    if (!notification.is_read) {
      markRead.mutate(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-auto py-1"
              onClick={() => markAllRead.mutate()}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type];
                const Icon = config.icon;

                return (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-muted/50 transition-colors flex gap-3",
                      !notification.is_read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("mt-0.5", config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !notification.is_read && "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {notification.action_url && (
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
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
