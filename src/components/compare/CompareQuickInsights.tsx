import { motion } from 'framer-motion';
import { TrendingDown, Maximize, BadgePercent, Sparkles } from 'lucide-react';
import { Property } from '@/types/database';
import { useAreaUnitLabel } from '@/contexts/PreferencesContext';

interface Insight {
  icon: React.ElementType;
  label: string;
  value: string;
  propertyTitle: string;
}

interface CompareQuickInsightsProps {
  properties: Property[];
  formatPrice: (price: number, currency?: string) => string;
  formatArea: (sqm: number) => string;
}

export function CompareQuickInsights({ properties, formatPrice, formatArea }: CompareQuickInsightsProps) {
  const areaUnitLabel = useAreaUnitLabel();
  
  if (properties.length < 2) return null;

  const insights: Insight[] = [];

  // Find lowest price
  const lowestPriceProperty = properties.reduce((min, p) => 
    p.price < min.price ? p : min
  );
  insights.push({
    icon: TrendingDown,
    label: 'Lowest Price',
    value: formatPrice(lowestPriceProperty.price, lowestPriceProperty.currency || 'ILS'),
    propertyTitle: lowestPriceProperty.title,
  });

  // Find largest property
  const propertiesWithSize = properties.filter(p => p.size_sqm);
  if (propertiesWithSize.length > 0) {
    const largestProperty = propertiesWithSize.reduce((max, p) => 
      (p.size_sqm || 0) > (max.size_sqm || 0) ? p : max
    );
    if (largestProperty.size_sqm) {
      insights.push({
        icon: Maximize,
        label: 'Largest',
        value: formatArea(largestProperty.size_sqm),
        propertyTitle: largestProperty.title,
      });
    }
  }

  // Find best price per sqm
  const propertiesWithPricePerSqm = properties.filter(p => p.size_sqm && p.size_sqm > 0);
  if (propertiesWithPricePerSqm.length > 0) {
    const bestValueProperty = propertiesWithPricePerSqm.reduce((best, p) => {
      const currentPricePerSqm = p.price / (p.size_sqm || 1);
      const bestPricePerSqm = best.price / (best.size_sqm || 1);
      return currentPricePerSqm < bestPricePerSqm ? p : best;
    });
    const pricePerSqm = Math.round(bestValueProperty.price / (bestValueProperty.size_sqm || 1));
    insights.push({
      icon: BadgePercent,
      label: 'Best Value',
      value: `${formatPrice(pricePerSqm)}/${areaUnitLabel}`,
      propertyTitle: bestValueProperty.title,
    });
  }

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
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {insights.map((insight, index) => (
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
              <div className="text-xs text-muted-foreground truncate">{insight.propertyTitle}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
