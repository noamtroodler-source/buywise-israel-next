import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, MessageSquare, Building2, TrendingUp, Loader2, Calendar, Home, BarChart3, ArrowUpRight } from 'lucide-react';
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

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

  const stats = [
    {
      label: 'Total Views',
      value: analytics?.totalViews || 0,
      icon: Eye,
      description: dateRangeLabel
    },
    {
      label: 'Inquiries',
      value: analytics?.totalInquiries || 0,
      icon: MessageSquare,
      description: 'Buyer inquiries received'
    },
    {
      label: 'Available Units',
      value: analytics?.availableUnits || 0,
      icon: Home,
      description: `of ${analytics?.totalUnits || 0} total`
    },
    {
      label: 'Conversion Rate',
      value: conversionRateDisplay,
      icon: TrendingUp,
      description: 'Inquiries / Views'
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Gradient Header Section */}
        <div className="relative bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background overflow-hidden">
          {/* Decorative blur elements */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />
          
          <div className="relative container mx-auto px-4 py-8 max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Button variant="ghost" asChild className="mb-4 -ml-2 rounded-xl hover:bg-primary/5">
                <Link to="/developer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                    <p className="text-muted-foreground">Track your project performance and buyer engagement</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeFilter)}>
                    <SelectTrigger className="w-[180px] h-11 rounded-xl border-border bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {dateRangeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="rounded-lg">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
          {/* Stats Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={itemVariants}>
                <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                      </div>
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                        <stat.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Conversion Funnel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ConversionFunnel
              views={analytics?.totalViews || 0}
              inquiries={analytics?.totalInquiries || 0}
            />
          </motion.div>

          {/* Charts Row */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-6 lg:grid-cols-2"
          >
            <motion.div variants={itemVariants}>
              <InquiryBreakdownChart 
                data={analytics?.inquiriesByUnitType || {}} 
                title="Inquiries by Unit Type"
              />
            </motion.div>
            <motion.div variants={itemVariants}>
              <InquiryBreakdownChart 
                data={analytics?.inquiriesByBudget || {}} 
                title="Inquiries by Budget Range"
              />
            </motion.div>
          </motion.div>

          {/* Project Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ProjectPerformanceChart data={projectChartData} />
          </motion.div>

          {/* Detailed Project Performance Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">Project Performance</CardTitle>
                    <p className="text-sm text-muted-foreground">Detailed breakdown by project</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="py-12 text-center rounded-xl bg-gradient-to-br from-primary/5 to-transparent">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-2">No projects yet</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first project to see analytics
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="hidden sm:grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
                      <span className="col-span-2">Project</span>
                      <span className="text-center">Views</span>
                      <span className="text-center">Inquiries</span>
                      <span className="text-center">Available</span>
                      <span className="text-center">Rate</span>
                    </div>
                    
                    {/* Data Rows */}
                    {projects.map((project) => {
                      const projectStats = analytics?.projectAnalytics.find(p => p.projectId === project.id);
                      const views = projectStats?.views || 0;
                      const inquiries = projectStats?.inquiries || 0;
                      const convRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0';
                      
                      return (
                        <div 
                          key={project.id}
                          className="group grid grid-cols-2 sm:grid-cols-6 gap-4 px-4 py-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer"
                        >
                          <div className="col-span-2 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-card border border-border flex items-center justify-center group-hover:border-primary/30 transition-colors flex-shrink-0">
                              <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {project.name}
                              </p>
                              <p className="text-sm text-muted-foreground">{project.city}</p>
                            </div>
                          </div>
                          
                          <div className="hidden sm:flex items-center justify-center">
                            <div className="flex items-center gap-1.5">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{views}</span>
                            </div>
                          </div>
                          
                          <div className="hidden sm:flex items-center justify-center">
                            <div className="flex items-center gap-1.5">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium text-foreground">{inquiries}</span>
                            </div>
                          </div>
                          
                          <div className="hidden sm:flex items-center justify-center">
                            <span className="font-medium text-foreground">{project.available_units || 0}</span>
                          </div>
                          
                          <div className="flex items-center justify-end sm:justify-center">
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/10">
                              <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
                              <span className="font-medium text-primary">{convRate}%</span>
                            </div>
                          </div>
                          
                          {/* Mobile stats */}
                          <div className="col-span-2 sm:hidden flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{views}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{inquiries}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {project.available_units || 0} available
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
      </div>
    </Layout>
  );
}
