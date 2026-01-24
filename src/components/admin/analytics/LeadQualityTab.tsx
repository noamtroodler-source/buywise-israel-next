import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Clock, Trophy, XCircle, CheckCircle } from 'lucide-react';
import { useLeadQualityAnalytics } from '@/hooks/useLeadQualityAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LeadQualityTabProps {
  dateRange: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(142 76% 36%)', 'hsl(0 84% 60%)', 'hsl(var(--muted-foreground))'];

export function LeadQualityTab({ dateRange }: LeadQualityTabProps) {
  const { data, isLoading } = useLeadQualityAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const metrics = data?.metrics;
  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${Math.round(minutes % 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-3xl font-bold">{metrics?.totalResponses || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-3xl font-bold">{formatTime(metrics?.avgResponseTimeMinutes || 0)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold">{metrics?.conversionRate.toFixed(1) || 0}%</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Visits Scheduled</p>
                <p className="text-3xl font-bold">{metrics?.visitScheduledCount || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.responseTimeDistribution && data.responseTimeDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.responseTimeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Responses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No response time data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outcome Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.outcomeBreakdown && data.outcomeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.outcomeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="outcome"
                    label={({ outcome, percentage }) => `${outcome.replace(/_/g, ' ')}: ${percentage.toFixed(0)}%`}
                  >
                    {data.outcomeBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No outcome data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loss Reason Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <XCircle className="h-5 w-5 text-red-500" />
            Loss Reason Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.lossReasonAnalysis && data.lossReasonAnalysis.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {data.lossReasonAnalysis.map((reason) => (
                <div key={reason.reason} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">{reason.reason}</span>
                    <Badge variant="outline" className="border-red-500/50 text-red-600">
                      {reason.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold">{reason.count}</p>
                  <p className="text-xs text-muted-foreground">lost leads</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No loss reasons recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Agent Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Agent Response Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.agentPerformance && data.agentPerformance.length > 0 ? (
            <div className="space-y-3">
              {data.agentPerformance.map((agent, i) => (
                <div key={agent.agentId} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold ${
                      i === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                      i === 1 ? 'bg-gray-300/30 text-gray-600' :
                      i === 2 ? 'bg-orange-500/20 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-medium">Agent {agent.agentId.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{agent.totalResponses} responses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatTime(agent.avgResponseTimeMinutes)}</p>
                      <p className="text-xs text-muted-foreground">avg response</p>
                    </div>
                    <Badge variant={agent.conversionRate >= 30 ? "default" : "outline"} className={agent.conversionRate >= 30 ? "bg-green-500/20 text-green-700" : ""}>
                      {agent.conversionRate.toFixed(0)}% convert
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No agent performance data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
