import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Bell, BookMarked, Calculator } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useSearchAlerts } from '@/hooks/useSearchAlerts';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { useSavedCalculatorResults } from '@/hooks/useSavedCalculatorResults';

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  onClick?: () => void;
  colorClass: string;
  delay: number;
}

function StatCard({ icon, value, label, onClick, colorClass, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 cursor-pointer transition-all hover:shadow-md group`}
      onClick={onClick}
    >
      <div className={`p-3 rounded-full ${colorClass} mb-2 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground text-center">{label}</span>
    </motion.div>
  );
}

export function ProfileStatsGrid() {
  const navigate = useNavigate();
  const { favoriteProperties } = useFavorites();
  const { data: searchAlerts = [] } = useSearchAlerts();
  const { savedArticles } = useSavedArticles();
  const { data: savedCalcResults = [] } = useSavedCalculatorResults();

  const activeAlerts = searchAlerts.filter(alert => alert.is_active);

  const stats = [
    {
      icon: <Heart className="h-5 w-5 text-primary" />,
      value: favoriteProperties.length,
      label: 'Saved Properties',
      onClick: () => navigate('/favorites'),
      colorClass: 'bg-primary/10',
    },
    {
      icon: <Bell className="h-5 w-5 text-primary" />,
      value: activeAlerts.length,
      label: 'Active Alerts',
      onClick: () => {
        const element = document.getElementById('search-alerts-section');
        element?.scrollIntoView({ behavior: 'smooth' });
      },
      colorClass: 'bg-primary/10',
    },
    {
      icon: <Calculator className="h-5 w-5 text-primary" />,
      value: savedCalcResults.length,
      label: 'Saved Calculations',
      onClick: () => {
        const element = document.getElementById('saved-calculator-results');
        element?.scrollIntoView({ behavior: 'smooth' });
      },
      colorClass: 'bg-primary/10',
    },
    {
      icon: <BookMarked className="h-5 w-5 text-primary" />,
      value: savedArticles.length,
      label: 'Saved Articles',
      onClick: () => navigate('/blog'),
      colorClass: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          icon={stat.icon}
          value={stat.value}
          label={stat.label}
          onClick={stat.onClick}
          colorClass={stat.colorClass}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
}
