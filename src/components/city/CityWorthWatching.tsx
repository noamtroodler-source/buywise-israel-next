import { motion } from 'framer-motion';
import { Eye, Train, TrendingUp, Target, Building2, Landmark, MapPinned, FileText, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export interface MarketFactor {
  title: string;
  description: string;
  icon: 'transit' | 'policy' | 'development' | 'infrastructure' | 'zoning' | 'growth' | 'investment' | 'community';
}

interface CityWorthWatchingProps {
  factors: MarketFactor[];
  cityName: string;
  // For auto-generating factors when none provided
  cityData?: {
    yoy_price_change?: number | null;
    investment_score?: number | null;
    has_train_station?: boolean | null;
    anglo_presence?: string | null;
    gross_yield_percent?: number | null;
  };
}

const iconMap = {
  transit: Train,
  policy: Landmark,
  development: Building2,
  infrastructure: MapPinned,
  zoning: FileText,
  growth: TrendingUp,
  investment: Target,
  community: Users,
};

// Generate factors from city data if none provided
function generateFactors(cityName: string, cityData?: CityWorthWatchingProps['cityData']): MarketFactor[] {
  if (!cityData) return [];
  
  const factors: MarketFactor[] = [];

  // Strong YoY growth
  if (cityData.yoy_price_change && cityData.yoy_price_change > 3) {
    factors.push({
      title: 'Strong Price Growth',
      description: `${cityData.yoy_price_change.toFixed(1)}% year-over-year price increase indicates sustained demand`,
      icon: 'growth',
    });
  } else if (cityData.yoy_price_change && cityData.yoy_price_change < 0) {
    factors.push({
      title: 'Buyer\'s Market',
      description: `${Math.abs(cityData.yoy_price_change).toFixed(1)}% price adjustment may present opportunities`,
      icon: 'growth',
    });
  }

  // High investment score
  if (cityData.investment_score && cityData.investment_score >= 75) {
    factors.push({
      title: 'High Investment Score',
      description: `Rated ${cityData.investment_score}/100 for investment potential based on growth and yield`,
      icon: 'investment',
    });
  }

  // Train station access
  if (cityData.has_train_station) {
    factors.push({
      title: 'Train Station Access',
      description: 'Direct rail connection improves commute options and property values',
      icon: 'transit',
    });
  }

  // Strong Anglo community
  if (cityData.anglo_presence?.toLowerCase().includes('high')) {
    factors.push({
      title: 'Strong Anglo Community',
      description: 'Established English-speaking community with supporting services',
      icon: 'community',
    });
  }

  // Good rental yield
  if (cityData.gross_yield_percent && cityData.gross_yield_percent > 3) {
    factors.push({
      title: 'Attractive Rental Yield',
      description: `${cityData.gross_yield_percent.toFixed(1)}% gross yield offers solid rental income potential`,
      icon: 'investment',
    });
  }

  return factors.slice(0, 3); // Max 3 factors
}

export function CityWorthWatching({ factors, cityName, cityData }: CityWorthWatchingProps) {
  // Use provided factors or generate from city data
  const displayFactors = factors.length > 0 ? factors : generateFactors(cityName, cityData);

  if (displayFactors.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <Eye className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">What to Watch in {cityName}</h2>
      </div>
      
      <div className={`grid gap-4 ${
        displayFactors.length === 1 ? 'grid-cols-1 max-w-md' : 
        displayFactors.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 
        'grid-cols-1 sm:grid-cols-3'
      }`}>
        {displayFactors.map((factor, index) => {
          const IconComponent = iconMap[factor.icon] || Eye;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Card className="h-full border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {factor.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
