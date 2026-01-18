import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, MessageSquare, Building2, TrendingUp, Loader2, Calendar, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeveloperProjects } from '@/hooks/useDeveloperProjects';
import { useDeveloperAnalytics, DateRangeFilter } from '@/hooks/useDeveloperAnalytics';
import { InquiryBreakdownChart, ProjectPerformanceChart, ConversionFunnel } from '@/components/developer/analytics';
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

export default function DeveloperAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const { data: projects = [], isLoading: projectsLoading } = useDeveloperProjects();
  const { data: analytics, isLoading: analyticsLoading } = useDeveloperAnalytics(dateRange);

  const isLoading = projectsLoading || analyticsLoading;

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
  const projectChartData = projects.map(project => {
    const stats = analytics?.projectAnalytics.find(p => p.projectId === project.id);
    return {
      projectId: project.id,
      name: project.name,
      views: stats?.views || 0,
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
                <Link to="/developer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Track your project performance</p>
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
                  <MessageSquare className="h-4 w-4" />
                  Inquiries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalInquiries || 0}</p>
                <p className="text-xs text-muted-foreground">Buyer inquiries received</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Available Units
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.availableUnits || 0}</p>
                <p className="text-xs text-muted-foreground">of {analytics?.totalUnits || 0} total</p>
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
          <ConversionFunnel
            views={analytics?.totalViews || 0}
            inquiries={analytics?.totalInquiries || 0}
          />

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <InquiryBreakdownChart 
              data={analytics?.inquiriesByUnitType || {}} 
              title="Inquiries by Unit Type"
            />
            <InquiryBreakdownChart 
              data={analytics?.inquiriesByBudget || {}} 
              title="Inquiries by Budget Range"
            />
          </div>

          {/* Project Performance */}
          <ProjectPerformanceChart data={projectChartData} />

          {/* Project Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Project Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No projects yet. Create your first project to see analytics.
                </p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => {
                    const projectStats = analytics?.projectAnalytics.find(p => p.projectId === project.id);
                    const views = projectStats?.views || 0;
                    const inquiries = projectStats?.inquiries || 0;
                    const convRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0';
                    
                    return (
                      <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-6 w-6 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1">{project.name}</p>
                            <p className="text-sm text-muted-foreground">{project.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 sm:gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{views}</p>
                            <p className="text-xs text-muted-foreground">views</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{inquiries}</p>
                            <p className="text-xs text-muted-foreground">inquiries</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{project.available_units || 0}</p>
                            <p className="text-xs text-muted-foreground">available</p>
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
