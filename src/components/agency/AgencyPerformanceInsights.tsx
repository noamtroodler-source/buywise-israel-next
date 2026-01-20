import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, MessageSquare, Home, TrendingUp, TrendingDown, Users } from 'lucide-react';
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

  // Get all agent IDs in the agency
  const agentIds = team.map(member => member.id);

  // This week's date range
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 0 });
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 0 });
  
  // Last week's date range
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 0 });

  // Fetch this week's property views for all team properties
  const { data: thisWeekViews = 0 } = useQuery({
    queryKey: ['agency-views-this-week', agency?.id],
    queryFn: async () => {
      if (agentIds.length === 0) return 0;
      
      // First get all properties owned by agency agents
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

  // Fetch last week's views
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

  // Fetch this week's inquiries
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

  // Fetch last week's inquiries
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

  // Fetch active listings count
  const { data: activeListings = 0 } = useQuery({
    queryKey: ['agency-active-listings', agency?.id],
    queryFn: async () => {
      if (agentIds.length === 0) return 0;
      
      const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .in('agent_id', agentIds)
        .eq('verification_status', 'approved');
      
      return count ?? 0;
    },
    enabled: !!agency?.id && agentIds.length > 0,
  });

  // Calculate conversion rate
  const conversionRate = thisWeekViews > 0 
    ? (thisWeekInquiries / thisWeekViews) * 100 
    : 0;
  const lastWeekConversionRate = lastWeekViews > 0 
    ? (lastWeekInquiries / lastWeekViews) * 100 
    : 0;

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          This Week's Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
            title="Active Listings"
            value={activeListings}
            previousValue={activeListings}
            icon={Home}
          />
          <MetricCard
            title="Conversion Rate"
            value={Number(conversionRate.toFixed(1))}
            previousValue={Number(lastWeekConversionRate.toFixed(1))}
            icon={Users}
            suffix="%"
          />
        </div>
      </CardContent>
    </Card>
  );
}
