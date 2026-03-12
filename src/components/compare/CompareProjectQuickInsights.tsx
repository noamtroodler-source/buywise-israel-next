import { motion } from 'framer-motion';
import { TrendingDown, Sparkles, Calendar, HardHat } from 'lucide-react';

interface Insight {
  icon: React.ElementType;
  label: string;
  value: string;
  projectName: string;
}

interface CompareProject {
  id: string;
  name: string;
  price_from: number | null;
  currency: string;
  completion_date: string | null;
  construction_progress_percent: number | null;
  available_units: number;
}

interface CompareProjectQuickInsightsProps {
  projects: CompareProject[];
  formatPrice: (price: number, currency?: string) => string;
}

export function CompareProjectQuickInsights({ 
  projects, 
  formatPrice,
}: CompareProjectQuickInsightsProps) {
  if (projects.length < 2) return null;

  const insights: Insight[] = [];

  // Lowest starting price
  const withPrice = projects.filter(p => p.price_from);
  if (withPrice.length > 0) {
    const lowestPrice = withPrice.reduce((min, p) => 
      (p.price_from || Infinity) < (min.price_from || Infinity) ? p : min
    );
    if (lowestPrice.price_from) {
      insights.push({
        icon: TrendingDown,
        label: 'Lowest Starting Price',
        value: formatPrice(lowestPrice.price_from, lowestPrice.currency || 'ILS'),
        projectName: lowestPrice.name,
      });
    }
  }

  // Soonest completion
  const withCompletion = projects.filter(p => p.completion_date);
  if (withCompletion.length > 0) {
    const soonest = withCompletion.reduce((earliest, p) => {
      if (!earliest.completion_date) return p;
      if (!p.completion_date) return earliest;
      return new Date(p.completion_date) < new Date(earliest.completion_date) ? p : earliest;
    });
    if (soonest.completion_date) {
      insights.push({
        icon: Calendar,
        label: 'Soonest Completion',
        value: new Date(soonest.completion_date).getFullYear().toString(),
        projectName: soonest.name,
      });
    }
  }

  // Furthest along in construction
  const withProgress = projects.filter(p => p.construction_progress_percent !== null && p.construction_progress_percent > 0);
  if (withProgress.length > 0) {
    const furthestAlong = withProgress.reduce((max, p) => 
      (p.construction_progress_percent || 0) > (max.construction_progress_percent || 0) ? p : max
    );
    if (furthestAlong.construction_progress_percent && furthestAlong.construction_progress_percent > 0) {
      insights.push({
        icon: HardHat,
        label: 'Most Progress',
        value: `${furthestAlong.construction_progress_percent}% complete`,
        projectName: furthestAlong.name,
      });
    }
  }

  const displayInsights = insights.slice(0, 4);

  if (displayInsights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">Quick Insights</span>
      </div>
      
      <div className={`grid grid-cols-1 gap-3 ${displayInsights.length <= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
        {displayInsights.map((insight, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 bg-background/80 rounded-lg px-3 py-2.5"
          >
            <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <insight.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-muted-foreground">{insight.label}</div>
              <div className="text-sm font-semibold truncate">{insight.value}</div>
              <div className="text-xs text-muted-foreground truncate">{insight.projectName}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
