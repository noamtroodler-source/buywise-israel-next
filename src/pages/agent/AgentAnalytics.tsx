import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageSquare, TrendingUp, Loader2, Calendar, BarChart3, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAgentProperties } from '@/hooks/useAgentProperties';
import { useAgentAnalytics, DateRangeFilter } from '@/hooks/useAgentAnalytics';
import { InquiryPieChart, PropertyPerformanceChart, FunnelMetrics } from '@/components/agent/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const machineTitlePattern = /^[a-z0-9_-]{16,}$/i;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isLikelyMachineTitle = (value: string) => {
  const normalized = value.trim();
  if (!normalized) return true;
  if (uuidPattern.test(normalized)) return true;
  return machineTitlePattern.test(normalized) && !/\s/.test(normalized);
};

const getReadableListingTitle = (rawTitle: string | null | undefined, city: string | null | undefined, index: number) => {
  const normalizedTitle = (rawTitle ?? '').trim();
  if (normalizedTitle && !isLikelyMachineTitle(normalizedTitle)) return normalizedTitle;
  return city ? `${city} Listing ${index + 1}` : `Listing ${index + 1}`;
};

export default function AgentAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const { data: properties = [], isLoading: propertiesLoading } = useAgentProperties();
  const { data: analytics, isLoading: analyticsLoading } = useAgentAnalytics(dateRange);

  const isLoading = propertiesLoading || analyticsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const conversionRateDisplay = analytics?.totalViews && analytics.totalViews > 0 
    ? `${analytics.conversionRate.toFixed(1)}%`
    : '—';

  const dateRangeLabel = dateRangeOptions.find(o => o.value === dateRange)?.label || 'All time';

  // Prepare chart data
  const propertyChartData = properties.map((property, index) => {
    const stats = analytics?.propertyAnalytics.find(p => p.propertyId === property.id);
    return {
      propertyId: property.id,
      title: getReadableListingTitle(property.title, property.city, index),
      views: stats?.views || 0,
      saves: stats?.saves || 0,
      inquiries: stats?.inquiries || 0,
    };
  });

  const statsCards = [
    { label: 'Total Views', value: analytics?.totalViews || 0, sub: dateRangeLabel, icon: Eye },
    { label: 'Total Saves', value: analytics?.totalSaves || 0, sub: 'Users who favorited', icon: Heart },
    { label: 'Inquiries', value: analytics?.totalInquiries || 0, sub: 'WhatsApp, calls, emails', icon: MessageSquare },
    { label: 'Conversion Rate', value: conversionRateDisplay, sub: 'Inquiries / Views', icon: TrendingUp },
  ];

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/5 -ml-2">
                <Link to="/agent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </motion.div>

            {/* Premium Gradient Header */}
            <motion.div variants={itemVariants}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">Analytics</h1>
                      <p className="text-muted-foreground">Track your listing performance</p>
                    </div>
                  </div>
                  
                  {activeTab === 'overview' && (
                    <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeFilter)}>
                      <SelectTrigger className="w-[160px] bg-background/80 backdrop-blur-sm rounded-xl">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateRangeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="rounded-xl bg-muted/50">
                <TabsTrigger value="overview" className="rounded-lg gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Summary Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl hover:shadow-lg hover:border-primary/30 transition-all">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                              </div>
                              {stat.label}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-3xl font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.sub}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Conversion Funnel */}
                <motion.div variants={itemVariants}>
                  <FunnelMetrics
                    views={analytics?.totalViews || 0}
                    saves={analytics?.totalSaves || 0}
                    inquiries={analytics?.totalInquiries || 0}
                  />
                </motion.div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <motion.div variants={itemVariants}>
                    <InquiryPieChart data={analytics?.inquiriesByType || { whatsapp: 0, email: 0, form: 0 }} />
                  </motion.div>
                  <motion.div variants={itemVariants}>
                    <PropertyPerformanceChart data={propertyChartData} />
                  </motion.div>
                </div>

                {/* Property Performance Table */}
                <motion.div variants={itemVariants}>
                  <Card className="rounded-2xl border-primary/20 hover:shadow-lg transition-all">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Home className="h-4 w-4 text-primary" />
                        </div>
                        <CardTitle>Detailed Listing Performance</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {properties.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No listings yet. Create your first listing to see analytics.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {properties.map((property, index) => {
                            const propertyStats = analytics?.propertyAnalytics.find(p => p.propertyId === property.id);
                            const views = propertyStats?.views || 0;
                            const saves = propertyStats?.saves || 0;
                            const inquiries = propertyStats?.inquiries || 0;
                            const convRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0';
                            const displayTitle = getReadableListingTitle(property.title, property.city, index);
                            
                            return (
                              <div key={property.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <img
                                    src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                                    alt={displayTitle}
                                    className="h-12 w-12 rounded-xl object-cover flex-shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="font-medium line-clamp-1">{displayTitle}</p>
                                    <p className="text-sm text-muted-foreground">{property.city}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 sm:gap-6 text-sm">
                                  <div className="text-center">
                                    <p className="font-medium">{views}</p>
                                    <p className="text-xs text-muted-foreground">views</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-medium">{saves}</p>
                                    <p className="text-xs text-muted-foreground">saves</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-medium">{inquiries}</p>
                                    <p className="text-xs text-muted-foreground">inquiries</p>
                                  </div>
                                  <div className="text-center hidden sm:block">
                                    <p className="font-medium">{convRate}%</p>
                                    <p className="text-xs text-muted-foreground">conv.</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </TabsContent>

            </Tabs>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
