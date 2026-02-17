import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, CheckCircle, Eye, Heart, MessageSquare, Coins, Rocket } from 'lucide-react';
import { useBoostAnalytics } from '@/hooks/useBoostAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';

export function BoostAnalyticsPanel() {
  const { data: analytics, isLoading } = useBoostAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="rounded-2xl border-primary/10">
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="rounded-2xl border-primary/10">
          <CardContent className="p-6">
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics || analytics.boostDetails.length === 0) {
    return (
      <Card className="rounded-2xl border-primary/10">
        <CardContent className="p-10 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No boosts yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Boost your listings to get more visibility. Boosted listings appear in priority positions on the homepage and search results.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/agent/properties">
              <Zap className="h-4 w-4 mr-2" />
              Boost a Listing
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summaryCards = [
    {
      label: 'Credits Spent',
      value: analytics.totalCreditsSpent,
      icon: Coins,
      description: 'Total boost investment',
    },
    {
      label: 'Active Boosts',
      value: analytics.activeBoostCount,
      icon: Zap,
      description: 'Currently running',
    },
    {
      label: 'Completed',
      value: analytics.completedBoostCount,
      icon: CheckCircle,
      description: 'Finished boosts',
    },
    {
      label: 'Avg Views/Boost',
      value: analytics.avgViewsPerBoost,
      icon: TrendingUp,
      description: 'Mean performance',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="rounded-2xl border-primary/10 hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Monthly Spend Chart */}
      {analytics.monthlySpend.length > 1 && (
        <Card className="rounded-2xl border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              Credits Spent Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analytics.monthlySpend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => format(new Date(v + '-01'), 'MMM yy')}
                  className="text-muted-foreground"
                  fontSize={12}
                />
                <YAxis fontSize={12} className="text-muted-foreground" />
                <Tooltip
                  labelFormatter={(v) => format(new Date(v + '-01'), 'MMMM yyyy')}
                  formatter={(value: number) => [`${value} credits`, 'Spent']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                  }}
                />
                <Bar dataKey="credits" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Boost Performance Table */}
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Boost Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analytics.boostDetails.map((boost) => (
              <div
                key={boost.boostId}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium line-clamp-1">{boost.targetName}</p>
                    <p className="text-xs text-muted-foreground">{boost.productName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-5 text-sm flex-wrap">
                  {boost.isActive ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Active · {formatDistanceToNow(new Date(boost.endsAt))} left
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      Expired {formatDistanceToNow(new Date(boost.endsAt), { addSuffix: true })}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{boost.viewsDuringBoost}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" />
                    <span>{boost.savesDuringBoost}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{boost.inquiriesDuringBoost}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" />
                    <span>{boost.creditCost}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
