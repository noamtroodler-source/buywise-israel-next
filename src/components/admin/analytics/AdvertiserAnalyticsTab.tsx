import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdvertiserAnalytics } from '@/hooks/useAnalyticsData';
import { Loader2, Users, Activity, MessageSquare, LogIn } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const ACTION_COLORS: Record<string, string> = {
  login: 'hsl(var(--primary))',
  dashboard_view: 'hsl(var(--chart-2))',
  listing_create: 'hsl(var(--chart-3))',
  listing_edit: 'hsl(var(--chart-4))',
  inquiry_view: 'hsl(var(--chart-5))',
  inquiry_respond: 'hsl(142 76% 36%)',
  analytics_view: 'hsl(var(--muted-foreground))',
};

interface AdvertiserAnalyticsTabProps {
  dateRange: number;
}

export function AdvertiserAnalyticsTab({ dateRange }: AdvertiserAnalyticsTabProps) {
  const { data, isLoading } = useAdvertiserAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No advertiser activity data available yet. Data will populate as agents and developers use the platform.
      </div>
    );
  }

  const { topAdvertisers, actionBreakdown, summary } = data;

  const formatActionLabel = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.uniqueAdvertisers}</p>
                <p className="text-sm text-muted-foreground">Active Advertisers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <LogIn className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalLogins}</p>
                <p className="text-sm text-muted-foreground">Total Logins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Activity className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-2xl font-bold">{summary.totalActions}</p>
                <p className="text-sm text-muted-foreground">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-2xl font-bold">{summary.avgActionsPerAdvertiser}</p>
              <p className="text-sm text-muted-foreground">Actions / Advertiser</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Action Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionBreakdown.slice(0, 8)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis 
                    type="category" 
                    dataKey="action" 
                    tick={{ fontSize: 11 }} 
                    width={100}
                    tickFormatter={formatActionLabel}
                  />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString(), 'Actions']}
                    labelFormatter={formatActionLabel}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[0, 4, 4, 0]}
                  >
                    {actionBreakdown.slice(0, 8).map((entry, index) => (
                      <Cell 
                        key={entry.action} 
                        fill={ACTION_COLORS[entry.action] || 'hsl(var(--muted-foreground))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Inquiry Response Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const withInquiries = topAdvertisers.filter(a => a.inquiriesViewed > 0);
                const highResponders = withInquiries.filter(a => a.responseRate >= 80).length;
                const medResponders = withInquiries.filter(a => a.responseRate >= 50 && a.responseRate < 80).length;
                const lowResponders = withInquiries.filter(a => a.responseRate < 50).length;
                
                return (
                  <>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-green-700">High (80%+)</span>
                      <Badge className="bg-green-600">{highResponders} advertisers</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium text-yellow-700">Medium (50-79%)</span>
                      <Badge className="bg-yellow-600">{medResponders} advertisers</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-red-700">Low (&lt;50%)</span>
                      <Badge className="bg-red-600">{lowResponders} advertisers</Badge>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Advertisers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Advertisers by Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Type</th>
                  <th className="text-right py-3 px-2 font-medium">Logins</th>
                  <th className="text-right py-3 px-2 font-medium">Created</th>
                  <th className="text-right py-3 px-2 font-medium">Edited</th>
                  <th className="text-right py-3 px-2 font-medium">Inquiries Viewed</th>
                  <th className="text-right py-3 px-2 font-medium">Responded</th>
                  <th className="text-right py-3 px-2 font-medium">Response Rate</th>
                  <th className="text-right py-3 px-2 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {topAdvertisers.map((advertiser) => (
                  <tr key={`${advertiser.actorType}-${advertiser.actorId}`} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-2">
                      <Badge variant="outline" className="capitalize">
                        {advertiser.actorType}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right">{advertiser.loginCount}</td>
                    <td className="py-3 px-2 text-right">{advertiser.listingsCreated}</td>
                    <td className="py-3 px-2 text-right">{advertiser.listingsEdited}</td>
                    <td className="py-3 px-2 text-right">{advertiser.inquiriesViewed}</td>
                    <td className="py-3 px-2 text-right">{advertiser.inquiriesResponded}</td>
                    <td className="py-3 px-2 text-right">
                      {advertiser.inquiriesViewed > 0 ? (
                        <span className={
                          advertiser.responseRate >= 80 ? 'text-green-600' :
                          advertiser.responseRate >= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }>
                          {advertiser.responseRate}%
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 px-2 text-right text-muted-foreground text-xs">
                      {advertiser.lastActive ? formatDistanceToNow(advertiser.lastActive, { addSuffix: true }) : '-'}
                    </td>
                  </tr>
                ))}
                {topAdvertisers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                      No advertiser data available yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
