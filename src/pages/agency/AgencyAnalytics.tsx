import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Eye, Heart, MessageSquare, TrendingUp, Loader2, Calendar, 
  Building2, Users, BarChart3 
} from 'lucide-react';
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

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

export default function AgencyAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: analytics, isLoading: analyticsLoading } = useAgencyAnalytics(dateRange);

  const isLoading = agencyLoading || analyticsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <p className="text-muted-foreground">You need an agency to view analytics.</p>
        </div>
      </Layout>
    );
  }

  const conversionRateDisplay = analytics?.totalViews && analytics.totalViews > 0 
    ? `${analytics.conversionRate.toFixed(1)}%`
    : '—';

  const dateRangeLabel = dateRangeOptions.find(o => o.value === dateRange)?.label || 'All time';

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
                <Link to="/agency">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">{agency.name} Analytics</h1>
              <p className="text-muted-foreground">Team performance overview</p>
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
            
            {/* Agent Comparison Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!analytics?.agentPerformance?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    No team members with listings yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.agentPerformance.map((agent, index) => (
                      <div 
                        key={agent.agentId} 
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Agent Table */}
          <Card>
            <CardHeader>
              <CardTitle>Agent Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {!analytics?.agentPerformance?.length ? (
                <p className="text-center text-muted-foreground py-8">
                  No agents with listings to show.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Agent</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Listings</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Views</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Saves</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Inquiries</th>
                        <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.agentPerformance.map((agent) => {
                        const convRate = agent.views > 0 
                          ? ((agent.inquiries / agent.views) * 100).toFixed(1) 
                          : '0';
                        
                        return (
                          <tr key={agent.agentId} className="border-b last:border-0">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                  {agent.avatarUrl ? (
                                    <img 
                                      src={agent.avatarUrl} 
                                      alt={agent.agentName}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center text-xs font-medium">
                                      {agent.agentName.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <span className="font-medium">{agent.agentName}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-2">
                              <Badge variant="secondary">{agent.activeListings}</Badge>
                            </td>
                            <td className="text-center py-3 px-2 font-medium">{agent.views}</td>
                            <td className="text-center py-3 px-2 font-medium">{agent.saves}</td>
                            <td className="text-center py-3 px-2 font-medium">{agent.inquiries}</td>
                            <td className="text-center py-3 px-2 font-medium">{convRate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
