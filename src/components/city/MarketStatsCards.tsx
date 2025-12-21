import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Home, BarChart3, Zap, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { MarketData } from '@/types/projects';

interface MarketStatsCardsProps {
  marketData: MarketData[];
  cityName: string;
}

const getMonthName = (month: number | null) => {
  if (!month) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
};

export function MarketStatsCards({ marketData, cityName }: MarketStatsCardsProps) {
  const latestData = marketData[0];
  const previousData = marketData[1];

  const formatPrice = (value: number | null) => {
    if (!value) return 'N/A';
    return `₪${(value / 1000).toFixed(1)}K`;
  };

  const formatMedianPrice = (value: number | null) => {
    if (!value) return 'N/A';
    if (value >= 1000000) {
      return `₪${(value / 1000000).toFixed(2)}M`;
    }
    return `₪${(value / 1000).toFixed(0)}K`;
  };

  const getPriceChange = () => {
    if (!latestData?.price_change_percent) return null;
    return latestData.price_change_percent;
  };

  const stats = [
    {
      label: 'Price per m²',
      value: formatPrice(latestData?.average_price_sqm),
      icon: DollarSign,
      trend: getPriceChange(),
      description: 'Average asking price',
    },
    {
      label: 'Median Price',
      value: formatMedianPrice(latestData?.median_price),
      icon: Home,
      trend: previousData ? ((latestData?.median_price || 0) - (previousData?.median_price || 0)) / (previousData?.median_price || 1) * 100 : null,
      description: 'Typical property value',
    },
    {
      label: 'Monthly Sales',
      value: latestData?.total_transactions ? `${latestData.total_transactions}` : 'N/A',
      icon: BarChart3,
      trend: previousData ? ((latestData?.total_transactions || 0) - (previousData?.total_transactions || 0)) / (previousData?.total_transactions || 1) * 100 : null,
      description: 'Transactions this month',
    },
    {
      label: 'Market Trend',
      value: getPriceChange() ? `${getPriceChange()! > 0 ? '+' : ''}${getPriceChange()?.toFixed(1)}%` : 'Stable',
      icon: Zap,
      trend: getPriceChange(),
      description: 'Price momentum',
    },
  ];

  const dataDate = latestData ? `${getMonthName(latestData.month)} ${latestData.year}` : null;

  return (
    <div className="space-y-3">
      {dataDate && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Data from {dataDate} • Trends are month-over-month</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:shadow-lg transition-shadow border-border/50 bg-card">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                  {stat.trend !== null && (
                    <div className={`flex items-center text-xs font-medium ${
                      stat.trend > 0 ? 'text-emerald-600' : stat.trend < 0 ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {stat.trend > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : stat.trend < 0 ? (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      ) : null}
                      {stat.trend !== 0 && (
                        <span title="Month-over-Month">
                          {Math.abs(stat.trend).toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground/80">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
