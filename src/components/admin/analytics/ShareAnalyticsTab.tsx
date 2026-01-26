import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Link, MessageCircle, Send, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { format, subDays } from 'date-fns';

interface ShareAnalyticsTabProps {
  dateRange: number;
}

const SHARE_METHOD_COLORS = {
  copy_link: 'hsl(var(--primary))',
  whatsapp: '#25D366',
  telegram: '#0088cc',
  native_share: 'hsl(var(--muted-foreground))',
};

const SHARE_METHOD_LABELS = {
  copy_link: 'Copy Link',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  native_share: 'Native Share',
};

export function ShareAnalyticsTab({ dateRange }: ShareAnalyticsTabProps) {
  const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');

  // Share method breakdown
  const { data: methodBreakdown, isLoading: methodLoading } = useQuery({
    queryKey: ['share-method-breakdown', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('share_events')
        .select('share_method')
        .gte('created_at', startDate);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((row) => {
        counts[row.share_method] = (counts[row.share_method] || 0) + 1;
      });

      return Object.entries(counts).map(([method, count]) => ({
        method,
        label: SHARE_METHOD_LABELS[method as keyof typeof SHARE_METHOD_LABELS] || method,
        count,
        color: SHARE_METHOD_COLORS[method as keyof typeof SHARE_METHOD_COLORS] || '#888',
      }));
    },
  });

  // Total shares
  const totalShares = methodBreakdown?.reduce((sum, item) => sum + item.count, 0) || 0;

  // Entity type breakdown
  const { data: entityBreakdown, isLoading: entityLoading } = useQuery({
    queryKey: ['share-entity-breakdown', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('share_events')
        .select('entity_type')
        .gte('created_at', startDate);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((row) => {
        counts[row.entity_type] = (counts[row.entity_type] || 0) + 1;
      });

      return Object.entries(counts).map(([type, count]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1),
        count,
      }));
    },
  });

  // Daily shares trend
  const { data: dailyTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['share-daily-trend', dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('share_events')
        .select('created_at, share_method')
        .gte('created_at', startDate)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dayMap: Record<string, Record<string, number>> = {};
      (data || []).forEach((row) => {
        const day = format(new Date(row.created_at), 'MMM dd');
        if (!dayMap[day]) {
          dayMap[day] = { copy_link: 0, whatsapp: 0, telegram: 0, native_share: 0 };
        }
        dayMap[day][row.share_method] = (dayMap[day][row.share_method] || 0) + 1;
      });

      return Object.entries(dayMap).map(([date, methods]) => ({
        date,
        ...methods,
        total: Object.values(methods).reduce((sum, val) => sum + val, 0),
      }));
    },
  });

  const isLoading = methodLoading || entityLoading || trendLoading;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Shares</p>
                <p className="text-3xl font-bold">{isLoading ? '...' : totalShares}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp Shares</p>
                <p className="text-3xl font-bold text-green-600">
                  {isLoading ? '...' : methodBreakdown?.find(m => m.method === 'whatsapp')?.count || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Telegram Shares</p>
                <p className="text-3xl font-bold text-blue-600">
                  {isLoading ? '...' : methodBreakdown?.find(m => m.method === 'telegram')?.count || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Link Copies</p>
                <p className="text-3xl font-bold">
                  {isLoading ? '...' : methodBreakdown?.find(m => m.method === 'copy_link')?.count || 0}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <Link className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Share Method Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Shares by Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : methodBreakdown && methodBreakdown.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={methodBreakdown}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {methodBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No share data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entity Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Shares by Content Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : entityBreakdown && entityBreakdown.length > 0 ? (
              <div className="space-y-4">
                {entityBreakdown.map((entity) => (
                  <div key={entity.type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{entity.type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 rounded-full bg-muted overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(entity.count / totalShares) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">{entity.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No share data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Shares Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : dailyTrend && dailyTrend.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="whatsapp" 
                    name="WhatsApp"
                    stroke="#25D366" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="telegram" 
                    name="Telegram"
                    stroke="#0088cc" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="copy_link" 
                    name="Copy Link"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No share data yet - shares will appear here as users share content
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
