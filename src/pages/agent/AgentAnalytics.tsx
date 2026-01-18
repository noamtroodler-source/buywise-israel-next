import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageSquare, TrendingUp, Loader2, Calendar } from 'lucide-react';
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

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export default function AgentAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
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
  const propertyChartData = properties.map(property => {
    const stats = analytics?.propertyAnalytics.find(p => p.propertyId === property.id);
    return {
      propertyId: property.id,
      title: property.title,
      views: stats?.views || 0,
      saves: stats?.saves || 0,
      inquiries: stats?.inquiries || 0,
    };
  });

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button variant="ghost" asChild className="mb-2">
                <Link to="/agent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Track your listing performance</p>
            </div>
            
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeFilter)}>
                <SelectTrigger className="w-[160px]">
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
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalViews || 0}</p>
                <p className="text-xs text-muted-foreground">{dateRangeLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Total Saves
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalSaves || 0}</p>
                <p className="text-xs text-muted-foreground">Users who favorited</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Inquiries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalInquiries || 0}</p>
                <p className="text-xs text-muted-foreground">WhatsApp, calls, emails</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{conversionRateDisplay}</p>
                <p className="text-xs text-muted-foreground">Inquiries / Views</p>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Funnel */}
          <FunnelMetrics
            views={analytics?.totalViews || 0}
            saves={analytics?.totalSaves || 0}
            inquiries={analytics?.totalInquiries || 0}
          />

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <InquiryPieChart data={analytics?.inquiriesByType || { whatsapp: 0, call: 0, email: 0, form: 0 }} />
            <PropertyPerformanceChart data={propertyChartData} />
          </div>

          {/* Property Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Listing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No listings yet. Create your first listing to see analytics.
                </p>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => {
                    const propertyStats = analytics?.propertyAnalytics.find(p => p.propertyId === property.id);
                    const views = propertyStats?.views || 0;
                    const saves = propertyStats?.saves || 0;
                    const inquiries = propertyStats?.inquiries || 0;
                    const convRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={property.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                            alt={property.title}
                            className="h-12 w-12 rounded object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1">{property.title}</p>
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
      </div>
    </Layout>
  );
}
