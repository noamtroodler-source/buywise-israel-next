import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Scroll, ArrowRight } from 'lucide-react';
import { useContentAnalytics } from '@/hooks/useContentAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ContentPerformanceTabProps {
  dateRange: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

export function ContentPerformanceTab({ dateRange }: ContentPerformanceTabProps) {
  const { data, isLoading } = useContentAnalytics(dateRange);

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
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatContentType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-3xl font-bold">{metrics?.totalViews || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Completion</p>
                <p className="text-3xl font-bold">{metrics?.avgCompletionPercent.toFixed(0) || 0}%</p>
              </div>
              <Scroll className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Active Time</p>
                <p className="text-3xl font-bold">{formatTime(metrics?.avgActiveTimeMs || 0)}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Scroll Depth</p>
                <p className="text-3xl font-bold">{metrics?.avgScrollDepth.toFixed(0) || 0}%</p>
              </div>
              <Scroll className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Content Type Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance by Content Type</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.contentTypePerformance && data.contentTypePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.contentTypePerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="contentType" className="text-xs" tickFormatter={formatContentType} />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'avgActiveTimeMs') return formatTime(value);
                      if (name === 'avgCompletionPercent') return `${value.toFixed(0)}%`;
                      return value;
                    }}
                  />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Views" />
                  <Bar dataKey="avgCompletionPercent" fill="hsl(var(--primary)/0.5)" radius={[4, 4, 0, 0]} name="Completion %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No content data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Action Attribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowRight className="h-5 w-5" />
              Content-to-Action Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.nextActionAttribution && data.nextActionAttribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.nextActionAttribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="action"
                    label={({ action, percentage }) => `${action}: ${percentage.toFixed(0)}%`}
                  >
                    {data.nextActionAttribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No attribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Content Pieces */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Performing Content</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.topContent && data.topContent.length > 0 ? (
            <div className="space-y-3">
              {data.topContent.map((content, i) => (
                <div key={content.contentId} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
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
                      <p className="font-medium">{content.contentId.slice(0, 12)}...</p>
                      <Badge variant="outline" className="mt-1">
                        {formatContentType(content.contentType)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">{content.views}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{content.avgCompletionPercent.toFixed(0)}%</p>
                      <p className="text-xs text-muted-foreground">completion</p>
                    </div>
                    <Badge variant="default" className="bg-primary/20 text-primary">
                      {content.engagementScore.toFixed(1)} score
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No content engagement data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
