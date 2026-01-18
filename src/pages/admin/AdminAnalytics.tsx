import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, MessageSquare, TrendingUp, Users, 
  Home, Calendar, Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  usePlatformStats, 
  useViewsTrend, 
  useInquiryBreakdown,
  useTopProperties 
} from '@/hooks/useAdminAnalytics';
import { useConversionMetrics } from '@/hooks/useConversionMetrics';
import { useGeographicAnalytics } from '@/hooks/useGeographicAnalytics';
import { useInventoryHealth } from '@/hooks/useInventoryHealth';
import { useAgentPerformance } from '@/hooks/useAgentPerformance';
import { useGrowthMetrics, useCumulativeGrowth } from '@/hooks/useGrowthMetrics';
import { usePriceAnalytics } from '@/hooks/usePriceAnalytics';
import { useInquiryMetrics } from '@/hooks/useInquiryMetrics';

import { ConversionFunnel } from '@/components/admin/ConversionFunnel';
import { GeographicAnalytics } from '@/components/admin/GeographicAnalytics';
import { InventoryHealthCard } from '@/components/admin/InventoryHealthCard';
import { AgentLeaderboard } from '@/components/admin/AgentLeaderboard';
import { GrowthMetrics } from '@/components/admin/GrowthMetrics';
import { PriceAnalytics } from '@/components/admin/PriceAnalytics';
import { InquiryPipeline } from '@/components/admin/InquiryPipeline';
import { ViewsTrendChart } from '@/components/admin/ViewsTrendChart';

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const days = parseInt(dateRange);

  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: viewsTrend, isLoading: viewsLoading } = useViewsTrend(days);
  const { data: conversionData, isLoading: conversionLoading } = useConversionMetrics(days);
  const { data: geoData, isLoading: geoLoading } = useGeographicAnalytics(days);
  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryHealth();
  const { data: agentData, isLoading: agentLoading } = useAgentPerformance(days);
  const { data: growthData, isLoading: growthLoading } = useGrowthMetrics(days === 7 ? 7 : days === 30 ? 30 : 30);
  const { data: trendData, isLoading: trendLoading } = useCumulativeGrowth(days);
  const { data: priceData, isLoading: priceLoading } = usePriceAnalytics();
  const { data: inquiryData, isLoading: inquiryLoading } = useInquiryMetrics(days);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground">Comprehensive platform performance metrics</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Views', value: stats?.totalViews7d || 0, sub: 'Last 7 days', icon: Eye },
          { label: 'Total Inquiries', value: stats?.totalInquiries7d || 0, sub: 'Last 7 days', icon: MessageSquare },
          { label: 'Active Listings', value: stats?.totalProperties || 0, sub: 'Total properties', icon: Home },
          { label: 'Registered Users', value: stats?.totalUsers || 0, sub: `+${stats?.newUsersThisWeek || 0} this week`, icon: Users },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="text-3xl font-bold text-foreground">
                      {statsLoading ? '...' : metric.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{metric.sub}</p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <metric.icon className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabbed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <ConversionFunnel data={conversionData} isLoading={conversionLoading} />
            <GeographicAnalytics data={geoData} isLoading={geoLoading} />
          </div>
          <ViewsTrendChart data={viewsTrend} isLoading={viewsLoading} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <InventoryHealthCard data={inventoryData} isLoading={inventoryLoading} />
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <AgentLeaderboard data={agentData} isLoading={agentLoading} limit={15} />
        </TabsContent>

        <TabsContent value="inquiries" className="space-y-6">
          <InquiryPipeline data={inquiryData} isLoading={inquiryLoading} />
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <GrowthMetrics 
            data={growthData} 
            trendData={trendData}
            isLoading={growthLoading || trendLoading} 
            periodLabel={`Last ${days} days vs previous`}
          />
        </TabsContent>

        <TabsContent value="market" className="space-y-6">
          <PriceAnalytics data={priceData} isLoading={priceLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
