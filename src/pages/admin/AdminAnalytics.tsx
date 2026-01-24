import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, MessageSquare, TrendingUp, Users, 
  Home, Calendar, BarChart3, Search, Activity, Building
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
import { UserBehaviorTab } from '@/components/admin/analytics/UserBehaviorTab';
import { SearchIntelligenceTab } from '@/components/admin/analytics/SearchIntelligenceTab';
import { ListingIntelligenceTab } from '@/components/admin/analytics/ListingIntelligenceTab';
import { AdvertiserAnalyticsTab } from '@/components/admin/analytics/AdvertiserAnalyticsTab';
import { DataHealthCard } from '@/components/admin/analytics/DataHealthCard';
import { CityAnalyticsTab } from '@/components/admin/analytics/CityAnalyticsTab';

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
      {/* Premium Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Platform Analytics</h2>
              <p className="text-muted-foreground">Comprehensive performance metrics & insights</p>
            </div>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-background/80 backdrop-blur-sm">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics - Premium Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Views', value: stats?.totalViews7d || 0, sub: 'Last 7 days', icon: Eye, gradient: 'from-primary/10 to-primary/5' },
          { label: 'Total Inquiries', value: stats?.totalInquiries7d || 0, sub: 'Last 7 days', icon: MessageSquare, gradient: 'from-primary/8 to-transparent' },
          { label: 'Active Listings', value: stats?.totalProperties || 0, sub: 'Total properties', icon: Home, gradient: 'from-primary/10 to-primary/5' },
          { label: 'Registered Users', value: stats?.totalUsers || 0, sub: `+${stats?.newUsersThisWeek || 0} this week`, icon: Users, gradient: 'from-primary/8 to-transparent' },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-primary/20 bg-gradient-to-br ${metric.gradient} rounded-2xl overflow-hidden`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
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

      {/* Tabbed Analytics - Premium Styling */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl flex-wrap h-auto gap-1">
          <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
          <TabsTrigger value="behavior" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="h-3.5 w-3.5 mr-1.5" />User Behavior
          </TabsTrigger>
          <TabsTrigger value="search" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Search className="h-3.5 w-3.5 mr-1.5" />Search Intel
          </TabsTrigger>
          <TabsTrigger value="listings" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building className="h-3.5 w-3.5 mr-1.5" />Listing Intel
          </TabsTrigger>
          <TabsTrigger value="advertisers" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-3.5 w-3.5 mr-1.5" />Advertisers
          </TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Inventory</TabsTrigger>
          <TabsTrigger value="agents" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Agents</TabsTrigger>
          <TabsTrigger value="inquiries" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Inquiries</TabsTrigger>
          <TabsTrigger value="growth" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Growth</TabsTrigger>
          <TabsTrigger value="market" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Market</TabsTrigger>
          <TabsTrigger value="cities" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Building className="h-3.5 w-3.5 mr-1.5" />Cities
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DataHealthCard />
          <div className="grid gap-6 lg:grid-cols-2">
            <ConversionFunnel data={conversionData} isLoading={conversionLoading} />
            <GeographicAnalytics data={geoData} isLoading={geoLoading} />
          </div>
          <ViewsTrendChart data={viewsTrend} isLoading={viewsLoading} />
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <UserBehaviorTab dateRange={days} />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <SearchIntelligenceTab dateRange={days} />
        </TabsContent>

        <TabsContent value="listings" className="space-y-6">
          <ListingIntelligenceTab dateRange={days} />
        </TabsContent>

        <TabsContent value="advertisers" className="space-y-6">
          <AdvertiserAnalyticsTab dateRange={days} />
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

        <TabsContent value="cities" className="space-y-6">
          <CityAnalyticsTab days={days} />
        </TabsContent>
      </Tabs>
    </div>
  );
}