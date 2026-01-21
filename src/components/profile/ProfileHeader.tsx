import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Heart, Bell, Calculator, BookMarked, Shield, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useFavorites } from '@/hooks/useFavorites';
import { useSearchAlerts } from '@/hooks/useSearchAlerts';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { useSavedCalculatorResults } from '@/hooks/useSavedCalculatorResults';

interface ProfileHeaderProps {
  fullName: string | null;
  email: string | undefined;
  isAgent: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
  onTabChange?: (tab: string) => void;
}

interface StatBadgeProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  onClick?: () => void;
}

function StatBadge({ icon, value, label, onClick }: StatBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center px-4 py-2 rounded-lg bg-card border border-border hover:border-primary/30 transition-all hover:shadow-sm min-w-[70px]"
    >
      <div className="flex items-center gap-1.5 text-primary mb-0.5">
        {icon}
        <span className="text-lg font-bold text-foreground">{value}</span>
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </button>
  );
}

export function ProfileHeader({ 
  fullName, 
  email, 
  isAgent, 
  isAdmin, 
  onSignOut,
  onTabChange 
}: ProfileHeaderProps) {
  const navigate = useNavigate();
  const { favoriteProperties } = useFavorites();
  const { data: searchAlerts = [] } = useSearchAlerts();
  const { savedArticles } = useSavedArticles();
  const { data: savedCalcResults = [] } = useSavedCalculatorResults();

  const activeAlerts = searchAlerts.filter(alert => alert.is_active);
  const firstName = fullName?.split(' ')[0] || 'there';
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

  const stats = [
    {
      icon: <Heart className="h-4 w-4" />,
      value: favoriteProperties.length,
      label: 'Saved',
      onClick: () => {
        onTabChange?.('saved');
      },
    },
    {
      icon: <Bell className="h-4 w-4" />,
      value: activeAlerts.length,
      label: 'Alerts',
      onClick: () => {
        onTabChange?.('alerts');
      },
    },
    {
      icon: <Calculator className="h-4 w-4" />,
      value: savedCalcResults.length,
      label: 'Calcs',
      onClick: () => {
        onTabChange?.('saved');
      },
    },
    {
      icon: <BookMarked className="h-4 w-4" />,
      value: savedArticles.length,
      label: 'Articles',
      onClick: () => navigate('/blog'),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Agent/Admin Banner */}
      {(isAgent || isAdmin) && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Shield className="h-4 w-4 text-primary" />
            ) : (
              <Briefcase className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isAdmin ? 'Admin Account' : 'Agent Account'}
            </span>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate(isAdmin ? '/admin' : '/agent')}
            className="h-7 text-xs"
          >
            Dashboard
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}

      {/* User Info Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-1.5" />
          Sign Out
        </Button>
      </div>

      {/* Inline Stats */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stats.map((stat) => (
          <StatBadge
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            onClick={stat.onClick}
          />
        ))}
      </div>
    </motion.div>
  );
}
