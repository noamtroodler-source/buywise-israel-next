import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { InlineSourceBadge } from '@/components/shared/InlineSourceBadge';
import { useDistrictPriceIndex } from '@/hooks/useDistrictPriceIndex';

interface PriceTrendsSectionProps {
  cityName: string;
  districtName: string | null;
  dataSources?: Record<string, string> | null;
  lastVerified?: string | null;
}

export function PriceTrendsSection({ 
  cityName, 
  districtName,
  dataSources,
  lastVerified
}: PriceTrendsSectionProps) {
  const [period, setPeriod] = useState<'1y' | '5y' | 'all'>('1y');
  
  // Fetch district-level index data
  const { data: districtData = [], isLoading } = useDistrictPriceIndex(districtName);

  // Separate quarterly and yearly data
  const quarterlyData = useMemo(() => {
    return districtData
      .filter(d => d.period_type === 'quarter')
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (a.quarter || 0) - (b.quarter || 0);
      })
      .map(d => ({
        name: `Q${d.quarter} ${d.year}`,
        index: d.index_value,
        yoy: d.yoy_change_percent,
        qoq: d.qoq_change_percent,
      }));
  }, [districtData]);

  const yearlyData = useMemo(() => {
    return districtData
      .filter(d => d.period_type === 'year')
      .sort((a, b) => a.year - b.year)
      .map(d => ({
        name: String(d.year),
        index: d.index_value,
        yoy: d.yoy_change_percent,
      }));
  }, [districtData]);

  // Determine available views
  const hasQuarterlyData = quarterlyData.length >= 4;
  const hasSufficient5YData = quarterlyData.length >= 12;
  const hasYearlyData = yearlyData.length >= 3;

  // Auto-adjust period if current selection is unavailable
  useEffect(() => {
    if (period === '1y' && !hasQuarterlyData && hasYearlyData) {
      setPeriod('all');
    } else if (period === '5y' && !hasSufficient5YData) {
      setPeriod(hasQuarterlyData ? '1y' : 'all');
    } else if (period === 'all' && !hasYearlyData && hasQuarterlyData) {
      setPeriod('1y');
    }
  }, [hasQuarterlyData, hasSufficient5YData, hasYearlyData, period]);

  // Get filtered data based on period
  const filteredData = useMemo(() => {
    if (period === 'all') {
      return yearlyData;
    }
    if (period === '5y') {
      return quarterlyData.slice(-20); // 5 years = 20 quarters
    }
    return quarterlyData.slice(-4); // 1 year = 4 quarters
  }, [quarterlyData, yearlyData, period]);

  // Calculate total growth for display
  const totalGrowth = useMemo(() => {
    if (filteredData.length < 2) return null;
    const first = filteredData[0].index;
    const last = filteredData[filteredData.length - 1].index;
    return ((last - first) / first * 100).toFixed(1);
  }, [filteredData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0].payload;
    
    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground text-sm mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Index</span>
            <span className="text-sm font-semibold text-primary">
              {Number(data.index).toFixed(1)}
            </span>
          </div>
          {data.yoy != null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">YoY Change</span>
              <span className={`text-sm font-medium ${data.yoy >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {data.yoy >= 0 ? '+' : ''}{Number(data.yoy).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Don't render if no data
  if (isLoading || (!hasQuarterlyData && !hasYearlyData)) {
    return null;
  }

  // Get a friendly district label (without "District" suffix for display)
  const districtLabel = districtName?.replace(' District', '') || 'Regional';

  return (
    <section className="py-16 bg-muted/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header with Period Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Broader Market Conditions</h2>
              <p className="text-muted-foreground mt-1">
                {districtLabel} region price movement over time
              </p>
            </div>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList className="bg-background">
                {hasQuarterlyData && (
                  <TabsTrigger value="1y" className="text-xs">1 Year</TabsTrigger>
                )}
                {hasSufficient5YData && (
                  <TabsTrigger value="5y" className="text-xs">5 Years</TabsTrigger>
                )}
                {hasYearlyData && (
                  <TabsTrigger value="all" className="text-xs">All Time</TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          </div>

          {/* Explanatory Info Banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border/50 text-sm">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-muted-foreground leading-relaxed">
              Israel's Central Bureau of Statistics publishes price indices at the regional level, not per city. 
              {cityName} is part of the <span className="font-medium text-foreground">{districtLabel}</span> region. 
              This chart shows verified regional trends as background context for your research.
            </p>
          </div>

          {/* Chart */}
          <div className="h-[280px] w-full bg-background rounded-xl border border-border/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  axisLine={{ className: 'stroke-border' }}
                  tickLine={{ className: 'stroke-border' }}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                  domain={['dataMin - 20', 'dataMax + 20']}
                  tickFormatter={(value) => value.toFixed(0)}
                  axisLine={{ className: 'stroke-border' }}
                  tickLine={{ className: 'stroke-border' }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="index"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Source Attribution - below chart */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <InlineSourceBadge 
                sources={{ 'CBS': 'Central Bureau of Statistics' }} 
                lastVerified={lastVerified}
                variant="subtle"
              />
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {period === 'all' ? 'Yearly Index' : 'Quarterly Index'} • Base: Oct-Nov 2017
              </span>
              {totalGrowth && (
                <span className={`text-xs px-2 py-0.5 rounded ${Number(totalGrowth) >= 0 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                  {Number(totalGrowth) >= 0 ? '+' : ''}{totalGrowth}% total
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground italic">
              Data from 2017 • {districtLabel} District
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
