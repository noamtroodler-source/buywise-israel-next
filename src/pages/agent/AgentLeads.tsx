import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Mail,
  BarChart3,
  ArrowLeft,
  MousePointerClick,
  Eye,
  Heart,
  Download,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAgentInquiryAnalytics } from "@/hooks/useAgentInquiryAnalytics";
import { InquiryPieChart } from "@/components/agent/analytics/InquiryPieChart";
import { HourlyActivityChart } from "@/components/agent/analytics/HourlyActivityChart";
import { PropertyEngagementTable } from "@/components/agent/analytics/PropertyEngagementTable";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useAgentLeads, useUpsertLeadQualityFeedback, type Lead } from "@/hooks/useAgentLeads";
import type { InquiryAnalytics } from "@/hooks/useAgentInquiryAnalytics";

type DateRange = '7d' | '30d' | '90d' | 'all';

const dateRangeLabels: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  'all': 'All time',
};

function exportAnalyticsToCSV(engagement: InquiryAnalytics['propertyEngagement']) {
  const headers = ['Property Title', 'Views', 'Saves', 'WhatsApp Clicks', 'Email Clicks', 'Form Clicks'];
  const rows = engagement.map(e => [
    `"${(e.title || '').replace(/"/g, '""')}"`,
    e.views || 0,
    e.saves || 0,
    e.whatsappClicks || 0,
    e.emailClicks || 0,
    e.formClicks || 0,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const preparednessLabels: Record<'well_prepared' | 'some_context' | 'unclear' | 'unqualified', string> = {
  well_prepared: 'Well prepared',
  some_context: 'Some context',
  unclear: 'Unclear intent',
  unqualified: 'Not qualified',
};

function LeadQualityCard({ lead }: { lead: Lead }) {
  const [preparedness, setPreparedness] = useState<'well_prepared' | 'some_context' | 'unclear' | 'unqualified'>(
    (lead.quality_feedback?.buyer_preparedness as 'well_prepared' | 'some_context' | 'unclear' | 'unqualified' | null) ?? 'some_context'
  );
  const qualityMutation = useUpsertLeadQualityFeedback();
  const priceContextComplete = lead.property?.price_context_badge_status === 'complete'
    || lead.property?.price_context_confidence_tier === 'strong_comparable_match'
    || lead.property?.price_context_percentage_suppressed === false;

  const handleRating = (rating: number) => {
    qualityMutation.mutate({
      lead,
      rating,
      buyerPreparedness: preparedness,
    });
  };

  return (
    <div className="rounded-xl border border-border/70 bg-background/70 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground truncate">{lead.property?.title || 'Property inquiry'}</p>
            <Badge variant={priceContextComplete ? 'default' : 'secondary'} className="text-xs">
              {priceContextComplete ? 'Price Context complete' : 'Limited context'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {lead.name || 'Buyer'} · {lead.inquiry_type} · {lead.property?.city || 'Unknown city'}
          </p>
          <p className="text-xs text-muted-foreground">
            {lead.property?.price ? `₪${lead.property.price.toLocaleString()}` : 'Price unavailable'} · {lead.property?.price_context_public_label || 'No public price label'}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-[260px]">
          <Select value={preparedness} onValueChange={(value) => setPreparedness(value as typeof preparedness)}>
            <SelectTrigger className="h-9 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(preparednessLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((rating) => {
              const active = (lead.quality_feedback?.lead_quality_rating ?? 0) >= rating;
              return (
                <Button
                  key={rating}
                  type="button"
                  size="icon"
                  variant={active ? 'default' : 'outline'}
                  className="h-8 w-8 rounded-lg"
                  disabled={qualityMutation.isPending}
                  onClick={() => handleRating(rating)}
                  aria-label={`Rate lead quality ${rating} out of 5`}
                >
                  <Star className="h-3.5 w-3.5" />
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentLeads() {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const { data: analytics, isLoading } = useAgentInquiryAnalytics(dateRange);
  const { data: leads = [], isLoading: isLoadingLeads } = useAgentLeads('all');

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
                      <h1 className="text-2xl font-bold">Analytics</h1>
                      <p className="text-muted-foreground">
                        See how buyers are engaging with your listings
                      </p>
                    </div>
                  </div>
                  
                  {/* Date Range Selector + Export */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-primary/20"
                      onClick={() => exportAnalyticsToCSV(analytics?.propertyEngagement || [])}
                      disabled={!analytics?.propertyEngagement?.length}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
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
            </div>

            {/* Stats Cards */}
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
                      email: analytics?.emailClicks || 0,
                      form: analytics?.formClicks || 0,
                    }}
                  />
                  <HourlyActivityChart data={analytics?.hourlyDistribution || []} />
                </>
              )}
            </div>

            {/* Lead Quality Feedback */}
            <Card className="rounded-2xl border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="h-5 w-5 text-primary" />
                  Lead quality feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoadingLeads ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                  </div>
                ) : leads.length > 0 ? (
                  leads.slice(0, 6).map((lead) => <LeadQualityCard key={lead.id} lead={lead} />)
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">No inquiries to rate yet.</p>
                )}
              </CardContent>
            </Card>

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
