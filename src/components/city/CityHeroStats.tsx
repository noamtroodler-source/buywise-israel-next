import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Target, Building2 } from 'lucide-react';

interface CityHeroStatsProps {
  population?: number | null;
  averagePriceSqm?: number | null;
  yoyChange?: number | null;
  investmentScore?: number | null;
}

export function CityHeroStats({ 
  population, 
  averagePriceSqm, 
  yoyChange, 
  investmentScore 
}: CityHeroStatsProps) {
  const formatPopulation = (pop: number | null | undefined) => {
    if (!pop) return null;
    if (pop >= 1000000) return `${(pop / 1000000).toFixed(1)}M`;
    if (pop >= 1000) return `${(pop / 1000).toFixed(0)}K`;
    return pop.toString();
  };

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return null;
    return `₪${(price / 1000).toFixed(0)}K`;
  };

  const stats = [
    {
      value: formatPopulation(population),
      label: 'Population',
      icon: Users,
      show: !!population,
    },
    {
      value: formatPrice(averagePriceSqm),
      label: '/m²',
      icon: Building2,
      show: !!averagePriceSqm,
    },
    {
      value: yoyChange ? `${yoyChange > 0 ? '+' : ''}${yoyChange.toFixed(1)}%` : null,
      label: 'YoY',
      icon: yoyChange && yoyChange >= 0 ? TrendingUp : TrendingDown,
      show: yoyChange !== null && yoyChange !== undefined,
    },
    {
      value: investmentScore ? `${investmentScore}/100` : null,
      label: 'Score',
      icon: Target,
      show: !!investmentScore,
    },
  ].filter(stat => stat.show && stat.value);

  if (stats.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex flex-wrap items-center gap-2 mt-4"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full"
          >
            <Icon className="h-3.5 w-3.5 text-white/80" />
            <span className="text-sm font-semibold text-white">{stat.value}</span>
            <span className="text-xs text-white/70">{stat.label}</span>
          </div>
        );
      })}
    </motion.div>
  );
}
