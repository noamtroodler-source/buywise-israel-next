import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Eye, MessageSquare, Building2, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { useDeveloperProjects } from '@/hooks/useDeveloperProjects';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  icon: typeof Eye;
  suffix?: string;
}

function MetricCard({ title, value, previousValue, icon: Icon, suffix = '' }: MetricCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const change = previousValue !== undefined ? numericValue - previousValue : 0;
  const changePercent = previousValue && previousValue > 0 
    ? ((change / previousValue) * 100).toFixed(0) 
    : '0';
  
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <Card className="h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {previousValue !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
              isPositive && "bg-semantic-green text-semantic-green-foreground",
              !isPositive && !isNeutral && "bg-muted text-muted-foreground",
              isNeutral && "bg-muted text-muted-foreground"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {isNeutral ? '0%' : `${isPositive ? '+' : ''}${changePercent}%`}
            </div>
          )}
        </div>
        <div className="mt-3 flex-grow">
          <p className="text-2xl font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {previousValue !== undefined 
            ? `vs ${previousValue.toLocaleString()} last week`
            : '\u00A0'
          }
        </p>
      </CardContent>
    </Card>
  );
}

export function DeveloperPerformanceInsights() {
  const { data: developer } = useDeveloperProfile();
  const { data: projects = [] } = useDeveloperProjects();

  // Fetch this week's views
  const { data: thisWeekViews = 0 } = useQuery({
    queryKey: ['developerViewsThisWeek', developer?.id],
    queryFn: async () => {
      if (!developer?.id) return 0;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const projectIds = projects.map(p => p.id);
      if (projectIds.length === 0) return 0;

      const { count } = await supabase
        .from('project_views')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .gte('created_at', oneWeekAgo.toISOString());

      return count ?? 0;
    },
    enabled: !!developer?.id && projects.length > 0,
  });

  // Fetch last week's views
  const { data: lastWeekViews = 0 } = useQuery({
    queryKey: ['developerViewsLastWeek', developer?.id],
    queryFn: async () => {
      if (!developer?.id) return 0;
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const projectIds = projects.map(p => p.id);
      if (projectIds.length === 0) return 0;

      const { count } = await supabase
        .from('project_views')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', oneWeekAgo.toISOString());

      return count ?? 0;
    },
    enabled: !!developer?.id && projects.length > 0,
  });

  // Fetch this week's inquiries
  const { data: thisWeekInquiries = 0 } = useQuery({
    queryKey: ['developerInquiriesThisWeek', developer?.id],
    queryFn: async () => {
      if (!developer?.id) return 0;
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count } = await supabase
        .from('project_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', developer.id)
        .gte('created_at', oneWeekAgo.toISOString());

      return count ?? 0;
    },
    enabled: !!developer?.id,
  });

  // Fetch last week's inquiries
  const { data: lastWeekInquiries = 0 } = useQuery({
    queryKey: ['developerInquiriesLastWeek', developer?.id],
    queryFn: async () => {
      if (!developer?.id) return 0;
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { count } = await supabase
        .from('project_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('developer_id', developer.id)
        .gte('created_at', twoWeeksAgo.toISOString())
        .lt('created_at', oneWeekAgo.toISOString());

      return count ?? 0;
    },
    enabled: !!developer?.id,
  });

  const activeProjects = projects.filter(p => p.verification_status === 'approved').length;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">This Week's Performance</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <MetricCard
            title="Project Views"
            value={thisWeekViews}
            previousValue={lastWeekViews}
            icon={Eye}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <MetricCard
            title="New Inquiries"
            value={thisWeekInquiries}
            previousValue={lastWeekInquiries}
            icon={MessageSquare}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <MetricCard
            title="Active Projects"
            value={activeProjects}
            icon={Building2}
          />
        </motion.div>
      </div>
    </div>
  );
}
