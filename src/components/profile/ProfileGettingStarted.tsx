import { useNavigate } from 'react-router-dom';
import { Check, User, Landmark, MapPin, Heart, Building2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { useFavorites } from '@/hooks/useFavorites';
import { useSearchAlerts } from '@/hooks/useSearchAlerts';

const stepConfig = [
  { key: 'buyer-profile', icon: User, route: '/profile', tabTarget: 'settings', cta: 'Set Up' },
  { key: 'mortgage', icon: Landmark, route: '/profile', tabTarget: 'settings', cta: 'Configure' },
  { key: 'locations', icon: MapPin, route: '/profile', tabTarget: 'settings', cta: 'Add' },
  { key: 'personal-info', icon: Heart, route: '/properties', cta: 'Browse' },
];

interface ProfileGettingStartedProps {
  onSwitchTab?: (tab: string) => void;
}

export function ProfileGettingStarted({ onSwitchTab }: ProfileGettingStartedProps) {
  const navigate = useNavigate();
  const { items, completedCount, totalCount, isLoading } = useProfileCompletion();
  const { recentProperties } = useRecentlyViewed();
  const { favoriteIds } = useFavorites();
  const { data: alerts = [] } = useSearchAlerts();

  if (isLoading) return null;

  const allComplete = completedCount === totalCount;

  // Once all steps are done, show a compact stats strip
  if (allComplete) {
    const stats = [
      { icon: Building2, value: recentProperties.length, label: 'Viewed' },
      { icon: MapPin, value: new Set(recentProperties.map((p: any) => p.city || 'Unknown')).size, label: 'Cities' },
      { icon: Heart, value: favoriteIds?.length || 0, label: 'Saved' },
      { icon: Bell, value: alerts.filter((a: any) => a.is_active !== false).length, label: 'Alerts' },
    ];

    return (
      <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-semibold text-foreground">Profile complete — you're all set!</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50">
              <s.icon className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-lg font-bold text-foreground leading-none">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Get Started</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {completedCount} of {totalCount} steps complete
          </p>
        </div>
        {/* Mini progress dots */}
        <div className="flex gap-1.5">
          {items.map((item) => (
            <div
              key={item.key}
              className={`h-2 w-2 rounded-full transition-colors ${
                item.isComplete ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => {
          const config = stepConfig[index];
          const Icon = config?.icon || User;

          return (
            <div
              key={item.key}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                item.isComplete
                  ? 'bg-primary/[0.03]'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              {/* Step indicator */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                  item.isComplete
                    ? 'bg-primary/10'
                    : 'border-2 border-muted-foreground/20'
                }`}
              >
                {item.isComplete ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <span className="text-xs font-semibold text-muted-foreground">{index + 1}</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${item.isComplete ? 'text-foreground' : 'text-foreground'}`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>

              {/* CTA */}
              {!item.isComplete && config && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-7 px-3 text-xs font-medium text-primary hover:bg-primary/10"
                  onClick={() => {
                    if (config.tabTarget && onSwitchTab) {
                      onSwitchTab(config.tabTarget);
                    } else {
                      navigate(config.route);
                    }
                  }}
                >
                  {config.cta}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
