import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Phone,
  Mail,
  BarChart3,
  ArrowLeft,
  MousePointerClick,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAgentInquiryAnalytics } from "@/hooks/useAgentInquiryAnalytics";
import { InquiryPieChart } from "@/components/agent/analytics/InquiryPieChart";
import { HourlyActivityChart } from "@/components/agent/analytics/HourlyActivityChart";
import { PropertyEngagementTable } from "@/components/agent/analytics/PropertyEngagementTable";
import { Skeleton } from "@/components/ui/skeleton";

type DateRange = '7d' | '30d' | '90d' | 'all';

const dateRangeLabels: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all': 'All time',
};

export default function AgentLeads() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { data: analytics, isLoading } = useAgentInquiryAnalytics(dateRange);

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10 mb-4">
                <Link to="/agent">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
                <div className="relative flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                      <BarChart3 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">Inquiry Analytics</h1>
                      <p className="text-muted-foreground">
                        See how buyers are engaging with your listings
                      </p>
                    </div>
                  </div>
                  
                  {/* Date Range Selector */}
                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                    <SelectTrigger className="w-[160px] rounded-xl border-primary/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(dateRangeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="rounded-lg">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4].map((i) => (
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
                        <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-2xl font-bold">{analytics?.totalClicks || 0}</p>
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
                  <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-2xl font-bold text-primary">{analytics?.callClicks || 0}</p>
                      <p className="text-sm text-muted-foreground">Calls</p>
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

            {/* Charts Row */}
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
                  <InquiryPieChart
                    data={{
                      whatsapp: analytics?.whatsappClicks || 0,
                      call: analytics?.callClicks || 0,
                      email: analytics?.emailClicks || 0,
                      form: analytics?.formClicks || 0,
                    }}
                  />
                  <HourlyActivityChart data={analytics?.hourlyDistribution || []} />
                </>
              )}
            </div>

            {/* Property Engagement Table */}
            {isLoading ? (
              <Card className="rounded-2xl border-primary/10">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PropertyEngagementTable data={analytics?.propertyEngagement || []} />
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
