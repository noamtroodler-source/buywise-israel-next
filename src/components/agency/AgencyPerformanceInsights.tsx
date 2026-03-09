import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MessageSquare, TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMyAgency, useAgencyTeam } from '@/hooks/useAgencyManagement';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

interface MetricCardProps {
  title: string;
  value: number;
  previousValue: number;
  icon: React.ElementType;
  suffix?: string;
}

function MetricCard({ title, value, previousValue, icon: Icon, suffix = '' }: MetricCardProps) {
  const change = previousValue > 0 
    ? ((value - previousValue) / previousValue) * 100 
    : value > 0 ? 100 : 0;
  const isPositive = change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="rounded-2xl border-border/50 hover:shadow-lg hover:border-primary/30 transition-all">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {value.toLocaleString()}{suffix}
                </p>
                <p className="text-xs text-muted-foreground">{title}</p>
              </div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? 'text-primary' : 'text-muted-foreground'}`}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{isPositive ? '+' : ''}{change.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function AgencyPerformanceInsights() {
  const { data: agency } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);

  const agentIds = team.map(member => member.id);

  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });

  const { data: thisWeekViews = 0 } = useQuery({
    queryKey: ['agency-views-this-week', agency?.id],
    queryFn: async () => {
      if (agentIds.length === 0) return 0;
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .in('agent_id', agentIds);
      if (!properties?.length) return 0;
      const propertyIds = properties.map(p => p.id);
      const { count } = await supabase
        .from('property_views')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .gte('created_at', format(thisWeekStart, 'yyyy-MM-dd'))
        .lte('created_at', format(thisWeekEnd, 'yyyy-MM-dd'));
      return count ?? 0;
    },
    enabled: !!agency?.id && agentIds.length > 0,
  });

  const { data: lastWeekViews = 0 } = useQuery({
    queryKey: ['agency-views-last-week', agency?.id],
    queryFn: async () => {
      if (agentIds.length === 0) return 0;
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .in('agent_id', agentIds);
      if (!properties?.length) return 0;
      const propertyIds = properties.map(p => p.id);
      const { count } = await supabase
        .from('property_views')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .gte('created_at', format(lastWeekStart, 'yyyy-MM-dd'))
        .lte('created_at', format(lastWeekEnd, 'yyyy-MM-dd'));
      return count ?? 0;
    },
    enabled: !!agency?.id && agentIds.length > 0,
  });

  const { data: thisWeekInquiries = 0 } = useQuery({
    queryKey: ['agency-inquiries-this-week', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return 0;
      const { count } = await supabase
        .from('property_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agency.id)
        .gte('created_at', format(thisWeekStart, 'yyyy-MM-dd'))
        .lte('created_at', format(thisWeekEnd, 'yyyy-MM-dd'));
      return count ?? 0;
    },
    enabled: !!agency?.id,
  });

  const { data: lastWeekInquiries = 0 } = useQuery({
    queryKey: ['agency-inquiries-last-week', agency?.id],
    queryFn: async () => {
      if (!agency?.id) return 0;
      const { count } = await supabase
        .from('property_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('agency_id', agency.id)
        .gte('created_at', format(lastWeekStart, 'yyyy-MM-dd'))
        .lte('created_at', format(lastWeekEnd, 'yyyy-MM-dd'));
      return count ?? 0;
    },
    enabled: !!agency?.id,
  });

  const conversionRate = thisWeekViews > 0 
    ? (thisWeekInquiries / thisWeekViews) * 100 
    : 0;
  const lastWeekConversionRate = lastWeekViews > 0 
    ? (lastWeekInquiries / lastWeekViews) * 100 
    : 0;

  // Demo mode — flip to false for production
  const DEMO_MODE = true;

  const displayViews = DEMO_MODE ? 847 : thisWeekViews;
  const displayPrevViews = DEMO_MODE ? 612 : lastWeekViews;
  const displayInquiries = DEMO_MODE ? 23 : thisWeekInquiries;
  const displayPrevInquiries = DEMO_MODE ? 19 : lastWeekInquiries;
  const displayConversion = DEMO_MODE ? 2.7 : Number(conversionRate.toFixed(1));
  const displayPrevConversion = DEMO_MODE ? 3.1 : Number(lastWeekConversionRate.toFixed(1));

  const allZero = !DEMO_MODE && thisWeekViews === 0 && thisWeekInquiries === 0 && conversionRate === 0;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          This Week's Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allZero ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-2xl bg-muted/50 mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">No activity this week yet</p>
            <p className="text-xs text-muted-foreground max-w-[280px]">
              Views and inquiries will appear here as buyers discover your listings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              title="Team Views"
              value={thisWeekViews}
              previousValue={lastWeekViews}
              icon={Eye}
            />
            <MetricCard
              title="Team Inquiries"
              value={thisWeekInquiries}
              previousValue={lastWeekInquiries}
              icon={MessageSquare}
            />
            <MetricCard
              title="Conversion Rate"
              value={Number(conversionRate.toFixed(1))}
              previousValue={Number(lastWeekConversionRate.toFixed(1))}
              icon={Users}
              suffix="%"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
