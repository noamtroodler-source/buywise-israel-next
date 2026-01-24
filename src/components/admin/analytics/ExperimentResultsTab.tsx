import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Beaker, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { useExperimentAnalytics } from '@/hooks/useExperimentAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ExperimentResultsTabProps {
  dateRange: number;
}

export function ExperimentResultsTab({ dateRange }: ExperimentResultsTabProps) {
  const { data, isLoading } = useExperimentAnalytics(dateRange);

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

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Experiments</p>
                <p className="text-3xl font-bold">{metrics?.totalExperiments || 0}</p>
              </div>
              <Beaker className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Exposures</p>
                <p className="text-3xl font-bold">{metrics?.totalExposures || 0}</p>
              </div>
              <Users className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Conversions</p>
                <p className="text-3xl font-bold">{metrics?.totalConversions || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overall Conversion</p>
                <p className="text-3xl font-bold">{metrics?.overallConversionRate.toFixed(1) || 0}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Experiment Details</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.experiments && data.experiments.length > 0 ? (
            <div className="space-y-6">
              {data.experiments.map((experiment) => (
                <div key={experiment.experimentName} className="p-4 rounded-xl bg-muted/50 border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Beaker className="h-5 w-5 text-primary" />
                      <h4 className="font-medium">{experiment.experimentName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={experiment.isActive ? "default" : "secondary"}>
                        {experiment.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {experiment.totalExposures} exposures
                      </span>
                    </div>
                  </div>
                  
                  {/* Variants Comparison */}
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {experiment.variants.map((variant) => (
                      <div key={variant.variant} className="p-3 rounded-lg bg-background border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{variant.variant}</Badge>
                          <span className={`text-sm font-medium ${
                            variant.conversionRate >= (experiment.variants[0]?.conversionRate || 0) 
                              ? 'text-green-600' 
                              : ''
                          }`}>
                            {variant.conversionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Exposures</p>
                            <p className="font-medium">{variant.exposures}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Conversions</p>
                            <p className="font-medium">{variant.conversions}</p>
                          </div>
                        </div>
                        {/* Conversion bar */}
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${Math.min(variant.conversionRate * 2, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Beaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Experiments Running</h3>
              <p className="text-muted-foreground">
                Start an A/B test to see variant performance comparison here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversion Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.conversionTrend && data.conversionTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis className="text-xs" yAxisId="left" />
                <YAxis className="text-xs" yAxisId="right" orientation="right" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="exposures" 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeWidth={2}
                  dot={false}
                  name="Exposures"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="conversionRate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={false}
                  name="Conversion Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              No conversion trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
