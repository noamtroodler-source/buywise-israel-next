import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Eye, Heart, MessageSquare, TrendingUp, Loader2, Calendar, 
  Building2, Users, BarChart3, Home, FileSpreadsheet
} from 'lucide-react';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyAgency } from '@/hooks/useAgencyManagement';
import { useAgencyAnalytics } from '@/hooks/useAgencyAnalytics';
import { DateRangeFilter } from '@/hooks/useAgentAnalytics';
import { InquiryPieChart, FunnelMetrics } from '@/components/agent/analytics';
import { AgencyAnalyticsSkeleton } from '@/components/agency/skeletons/AgencyPageSkeletons';

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

export default function AgencyAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: analytics, isLoading: analyticsLoading } = useAgencyAnalytics(dateRange);

  const isLoading = agencyLoading || analyticsLoading;

  if (isLoading) {
    return <AgencyAnalyticsSkeleton />;
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16">
          <EnhancedEmptyState
            icon={BarChart3}
            title="No Agency Found"
            description="You need an agency to view analytics. Register your agency to start tracking performance."
            primaryAction={{ label: 'Register Agency', href: '/agency/register', icon: Building2 }}
            secondaryAction={{ label: 'Go to Agency', href: '/agency' }}
          />
        </div>
      </Layout>
    );
  }

  const conversionRateDisplay = analytics?.totalViews && analytics.totalViews > 0 
    ? `${analytics.conversionRate.toFixed(1)}%`
    : '—';

  const dateRangeLabel = dateRangeOptions.find(o => o.value === dateRange)?.label || 'All time';

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
                <Link to="/agency">
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
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                      <BarChart3 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{agency.name} Analytics</h1>
                      <p className="text-muted-foreground">Team performance overview</p>
                    </div>
                  </div>
                  
                  {/* Date Range Selector */}
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
                </div>
              </div>
            </motion.div>

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
              
              {/* Team Performance Card */}
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/20 hover:shadow-lg transition-all">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
                    <CardTitle className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      Team Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {!analytics?.agentPerformance?.length ? (
                      <div className="py-8 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="font-medium text-foreground mb-1">No team members yet</p>
                        <p className="text-sm text-muted-foreground">
                          Team members with listings will appear here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {analytics.agentPerformance.map((agent, index) => (
                          <motion.div 
                            key={agent.agentId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden">
                                {agent.avatarUrl ? (
                                  <img 
                                    src={agent.avatarUrl} 
                                    alt={agent.agentName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-sm font-medium">
                                    {agent.agentName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{agent.agentName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {agent.activeListings} active listing{agent.activeListings !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-medium">{agent.views}</p>
                                <p className="text-xs text-muted-foreground">views</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium">{agent.inquiries}</p>
                                <p className="text-xs text-muted-foreground">inquiries</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
