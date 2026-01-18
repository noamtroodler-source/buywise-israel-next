import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Eye, MessageSquare, TrendingUp, Users, 
  Home, Calendar, ArrowUpRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  usePlatformStats, 
  useViewsTrend, 
  useInquiryBreakdown,
  useTopProperties 
} from '@/hooks/useAdminAnalytics';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(190, 80%, 42%)',
  'hsl(258, 55%, 52%)',
  'hsl(var(--muted-foreground))',
];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const days = parseInt(dateRange);

  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: viewsTrend, isLoading: viewsLoading } = useViewsTrend(days);
  const { data: inquiryBreakdown, isLoading: inquiryLoading } = useInquiryBreakdown(days);
  const { data: topProperties, isLoading: propertiesLoading } = useTopProperties(10);

  const viewsChartConfig = {
    views: { label: "Views", color: "hsl(var(--primary))" },
  };

  const barChartConfig = {
    views: { label: "Views", color: "hsl(var(--primary))" },
    inquiries: { label: "Inquiries", color: "hsl(190, 80%, 42%)" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-muted-foreground">Detailed platform performance metrics</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? '...' : (stats?.totalViews7d || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Inquiries</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? '...' : (stats?.totalInquiries7d || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? '...' : (stats?.totalProperties || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Total properties</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Home className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Registered Users</p>
                  <p className="text-3xl font-bold text-foreground">
                    {statsLoading ? '...' : (stats?.totalUsers || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{stats?.newUsersThisWeek || 0} this week
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <Tabs defaultValue="views" className="space-y-4">
        <TabsList>
          <TabsTrigger value="views">Views Trend</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiry Sources</TabsTrigger>
          <TabsTrigger value="top">Top Properties</TabsTrigger>
        </TabsList>

        <TabsContent value="views">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Property Views Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewsLoading ? (
                <Skeleton className="h-[350px] w-full" />
              ) : (
                <ChartContainer config={viewsChartConfig} className="h-[350px]">
                  <AreaChart data={viewsTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsViewsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickMargin={8}
                      width={40}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fill="url(#analyticsViewsGradient)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inquiries">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Inquiry Sources Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inquiryLoading ? (
                  <Skeleton className="h-[300px] w-full" />
                ) : (
                  <ChartContainer config={barChartConfig} className="h-[300px]">
                    <PieChart>
                      <Pie
                        data={inquiryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="type"
                      >
                        {(inquiryBreakdown || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
                <div className="flex justify-center gap-4 mt-4">
                  {(inquiryBreakdown || []).map((item, index) => (
                    <div key={item.type} className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm">{item.type}</span>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inquiry Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(inquiryBreakdown || []).map((item, index) => {
                    const total = (inquiryBreakdown || []).reduce((sum, i) => sum + i.count, 0);
                    const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                    
                    return (
                      <div key={item.type} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.type}</span>
                          <span className="text-sm text-muted-foreground">
                            {item.count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Top Performing Properties
              </CardTitle>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : (topProperties || []).length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No property data available
                </div>
              ) : (
                <div className="space-y-3">
                  {(topProperties || []).map((property, index) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm truncate max-w-[200px]">
                            {property.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{property.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-right">
                          <p className="font-medium">{property.views.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">views</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{property.inquiries}</p>
                          <p className="text-xs text-muted-foreground">inquiries</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
