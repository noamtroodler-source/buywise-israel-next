import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, MessageSquare, Home, Calendar, BarChart3, 
  MapPin, Activity, Target, Package, Settings
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
import { usePlatformStats } from '@/hooks/useAdminAnalytics';

// Chapter components
import { ExecutiveDashboardTab } from '@/components/admin/analytics/ExecutiveDashboardTab';
import { 
  DiscoveryChapter,
  EngagementChapter,
  ConversionChapter,
  SupplyChapter,
  OperationsChapter
} from '@/components/admin/analytics/chapters';

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const days = parseInt(dateRange);

  const { data: stats, isLoading: statsLoading } = usePlatformStats();

  const keyMetrics = [
    { label: 'Total Views', value: stats?.totalViews7d || 0, sub: 'Last 7 days', icon: Eye, gradient: 'from-primary/10 to-primary/5' },
    { label: 'Total Inquiries', value: stats?.totalInquiries7d || 0, sub: 'Last 7 days', icon: MessageSquare, gradient: 'from-primary/8 to-transparent' },
    { label: 'Active Listings', value: stats?.totalProperties || 0, sub: 'Total properties', icon: Home, gradient: 'from-primary/10 to-primary/5' },
  ];

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
              <p className="text-muted-foreground">Story-driven insights & actionable intelligence</p>
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

      {/* Key Metrics - Compact Cards */}
      <div className="grid gap-4 grid-cols-3">
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-primary/20 bg-gradient-to-br ${metric.gradient} rounded-2xl overflow-hidden`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {statsLoading ? '...' : metric.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{metric.sub}</p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <metric.icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chapter-Based Navigation */}
      <Tabs defaultValue="executive" className="space-y-4">
        <TabsList className="bg-muted/50 p-1 rounded-xl h-auto gap-1">
          <TabsTrigger 
            value="executive" 
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Executive
          </TabsTrigger>
          <TabsTrigger 
            value="discovery" 
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <MapPin className="h-4 w-4 mr-2" />
            Discovery
          </TabsTrigger>
          <TabsTrigger 
            value="engagement" 
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Activity className="h-4 w-4 mr-2" />
            Engagement
          </TabsTrigger>
          <TabsTrigger 
            value="conversion" 
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Target className="h-4 w-4 mr-2" />
            Conversion
          </TabsTrigger>
          <TabsTrigger 
            value="supply" 
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Package className="h-4 w-4 mr-2" />
            Supply
          </TabsTrigger>
          <TabsTrigger 
            value="operations" 
            className="rounded-lg px-4 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Settings className="h-4 w-4 mr-2" />
            Operations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-6">
          <ExecutiveDashboardTab dateRange={days} />
        </TabsContent>

        <TabsContent value="discovery" className="space-y-6">
          <DiscoveryChapter dateRange={days} />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <EngagementChapter dateRange={days} />
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <ConversionChapter dateRange={days} />
        </TabsContent>

        <TabsContent value="supply" className="space-y-6">
          <SupplyChapter dateRange={days} />
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <OperationsChapter dateRange={days} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
