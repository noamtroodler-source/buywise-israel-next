import { useNavigate } from 'react-router-dom';
import { Heart, Bell, Settings, Calculator, Home, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RecentlyViewedSection } from './RecentlyViewedSection';

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickAction({ icon, title, description, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:shadow-sm transition-all text-left group w-full"
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

interface ProfileTabOverviewProps {
  onTabChange: (tab: string) => void;
}

export function ProfileTabOverview({ onTabChange }: ProfileTabOverviewProps) {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: <Heart className="h-4 w-4" />,
      title: 'View Saved Properties',
      description: 'See your favorited listings',
      onClick: () => navigate('/favorites'),
    },
    {
      icon: <Bell className="h-4 w-4" />,
      title: 'Manage Alerts',
      description: 'Search & price drop alerts',
      onClick: () => onTabChange('alerts'),
    },
    {
      icon: <Settings className="h-4 w-4" />,
      title: 'Profile Settings',
      description: 'Update your info & preferences',
      onClick: () => onTabChange('settings'),
    },
    {
      icon: <Calculator className="h-4 w-4" />,
      title: 'Calculators',
      description: 'Mortgage, costs & affordability',
      onClick: () => navigate('/tools'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {quickActions.map((action) => (
              <QuickAction
                key={action.title}
                icon={action.icon}
                title={action.title}
                description={action.description}
                onClick={action.onClick}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recently Viewed */}
      <RecentlyViewedSection />
    </div>
  );
}
