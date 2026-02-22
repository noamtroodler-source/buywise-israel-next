import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Eye, Heart, MousePointerClick, MessageSquare, Mail, Calendar, BarChart3, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDeveloperAnalytics, DateRangeFilter } from '@/hooks/useDeveloperAnalytics';
import { ProjectEngagementTable, HourlyActivityChart, InquirySourcesChart } from '@/components/developer/analytics';
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

export default function DeveloperAnalytics() {
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const { data: analytics, isLoading } = useDeveloperAnalytics(dateRange);

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />

        <div className="relative container mx-auto px-4 py-8 max-w-6xl space-y-8">
          {/* Header */}
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
                  <p className="text-muted-foreground">See how buyers engage with your projects</p>
                </div>
              </div>

              {activeTab === 'overview' && (
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
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="rounded-xl bg-muted/50">
              <TabsTrigger value="overview" className="rounded-lg gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="boosts" className="rounded-lg gap-2">
                <Zap className="h-4 w-4" />
                Boosts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8 mt-6">
              {/* Stats Grid - 5 cards */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {isLoading ? (
                    <>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Card key={i} className="rounded-2xl border-primary/10">
                          <CardContent className="p-4 text-center">
                            <Skeleton className="h-8 w-16 mx-auto mb-2" />
                            <Skeleton className="h-4 w-20 mx-auto" />
                          </CardContent>
                        </Card>
                      ))}
                    </>
                  ) : (
                    <>
                      <Card className="rounded-2xl border-primary/10">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold">{(analytics?.totalViews || 0).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Views</p>
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl border-primary/10">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Heart className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold">{(analytics?.totalSaves || 0).toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">Total Saves</p>
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl border-primary/10">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold">{analytics?.totalInquiries || 0}</p>
                          <p className="text-sm text-muted-foreground">Total Clicks</p>
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-2xl font-bold text-primary">{analytics?.whatsappClicks || 0}</p>
                          <p className="text-sm text-muted-foreground">WhatsApp</p>
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl border-primary/10">
                        <CardContent className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-2xl font-bold">{analytics?.emailClicks || 0}</p>
                          <p className="text-sm text-muted-foreground">Emails</p>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Charts Row */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {isLoading ? (
                    <>
                      <Card className="rounded-2xl border-primary/10">
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-32 mb-4" />
                          <Skeleton className="h-[200px] w-full" />
                        </CardContent>
                      </Card>
                      <Card className="rounded-2xl border-primary/10">
                        <CardContent className="p-6">
                          <Skeleton className="h-6 w-32 mb-4" />
                          <Skeleton className="h-[200px] w-full" />
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <>
                      <InquirySourcesChart
                        data={{
                          whatsapp: analytics?.whatsappClicks || 0,
                          email: analytics?.emailClicks || 0,
                          form: analytics?.formClicks || 0,
                        }}
                      />
                      <HourlyActivityChart data={analytics?.hourlyDistribution || []} />
                    </>
                  )}
                </div>
              </motion.div>

              {/* Project Engagement Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {isLoading ? (
                  <Card className="rounded-2xl border-primary/10">
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-48 mb-4" />
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <ProjectEngagementTable data={analytics?.projectEngagement || []} />
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="boosts" className="mt-6">
              <BoostAnalyticsPanel />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
