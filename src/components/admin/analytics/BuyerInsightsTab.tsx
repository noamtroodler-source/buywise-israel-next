import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, Target, DollarSign, Clock, Home, MapPin, TrendingUp 
} from 'lucide-react';
import { useBuyerInsightsAnalytics } from '@/hooks/useBuyerInsightsAnalytics';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { SampleSizeWarning } from './SampleSizeWarning';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(213, 70%, 55%)',
  'hsl(213, 60%, 65%)',
  'hsl(213, 50%, 75%)',
  'hsl(213, 40%, 85%)',
];

export function BuyerInsightsTab() {
  const { data, isLoading } = useBuyerInsightsAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[120px] w-full" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!data || data.totalProfiles === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Buyer Profiles Yet</h3>
        <p className="text-muted-foreground">
          Buyer insights will appear as users complete their profiles.
        </p>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `₪${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `₪${(price / 1000).toFixed(0)}K`;
    return `₪${price}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">{data.totalProfiles}</p>
            <p className="text-sm text-muted-foreground">Registered Buyers</p>
            <SampleSizeWarning sampleSize={data.totalProfiles} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {data.marketFit.affordabilityPercent.toFixed(0)}%
            </p>
            <p className="text-sm text-muted-foreground">Can Afford Avg Listing</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {formatPrice(data.marketFit.avgBuyerBudgetMax)}
            </p>
            <p className="text-sm text-muted-foreground">Avg Max Budget</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">
              {data.targetCitiesDemand.length}
            </p>
            <p className="text-sm text-muted-foreground">Cities in Demand</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Buyer Type Distribution */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Buyer Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {data.buyerTypeDistribution.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.buyerTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="type"
                      >
                        {data.buyerTypeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-background border border-border/50 rounded-xl shadow-lg p-2 text-sm">
                                <p className="font-semibold text-foreground">{item.type}</p>
                                <p className="text-muted-foreground">
                                  {item.count} ({item.percentage.toFixed(1)}%)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {data.buyerTypeDistribution.map((item, idx) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="h-3 w-3 rounded-full" 
                          style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                        />
                        <span className="text-sm text-foreground">{item.type}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {item.count} ({item.percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Purchase Timeline */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Purchase Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {data.timelineDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.timelineDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis 
                    dataKey="timeline" 
                    type="category" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Buyers" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Target Cities Demand */}
      <Card className="rounded-2xl border-border/50">
        <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Target Cities (Buyer Demand)
            <Badge variant="secondary" className="ml-auto">
              {data.targetCitiesDemand.length} cities
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {data.targetCitiesDemand.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.targetCitiesDemand.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  dataKey="city" 
                  type="category" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  width={120}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Interested Buyers" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">No city preferences recorded yet</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Distribution */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Budget Range Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.budgetDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Buyers" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Preferences */}
        <Card className="rounded-2xl border-border/50">
          <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              Property Type Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {data.propertyPreferences.length > 0 ? (
              <div className="space-y-3">
                {data.propertyPreferences.slice(0, 6).map((pref, idx) => (
                  <div key={pref.type} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground capitalize">{pref.type.replace(/_/g, ' ')}</span>
                        <span className="text-muted-foreground">{pref.count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${(pref.count / data.totalProfiles) * 100}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No preferences recorded yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Market Fit Analysis */}
      <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Market Fit Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-4xl font-bold text-primary">
                {data.marketFit.affordabilityPercent.toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                of buyers can afford average listings
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(data.marketFit.avgListingPrice)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Avg Listing Price
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatPrice(data.marketFit.avgBuyerBudgetMax)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Avg Buyer Max Budget
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            {data.marketFit.buyersWithinMarket} of {data.marketFit.totalBuyersWithBudget} buyers with set budgets can afford listings at 80% of average price
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
