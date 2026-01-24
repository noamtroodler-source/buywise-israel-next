import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Car, Footprints, Train, Building } from 'lucide-react';
import { useLocationModuleAnalytics } from '@/hooks/useLocationModuleAnalytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface LocationModuleTabProps {
  dateRange: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];

export function LocationModuleTab({ dateRange }: LocationModuleTabProps) {
  const { data, isLoading } = useLocationModuleAnalytics(dateRange);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  const metrics = data?.metrics;

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'walk': return Footprints;
      case 'drive': return Car;
      case 'transit': return Train;
      default: return Navigation;
    }
  };

  const getPlaceTypeIcon = (type: string) => {
    switch (type) {
      case 'school': return Building;
      case 'work': return Building;
      default: return MapPin;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold">{metrics?.totalEvents || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unique Properties</p>
                <p className="text-3xl font-bold">{metrics?.uniqueProperties || 0}</p>
              </div>
              <Building className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Events/Property</p>
                <p className="text-3xl font-bold">{metrics?.avgEventsPerProperty.toFixed(1) || 0}</p>
              </div>
              <Navigation className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Event Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Event Type Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.eventTypeBreakdown && data.eventTypeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.eventTypeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="count"
                    nameKey="eventType"
                    label={({ eventType, percentage }) => `${eventType.replace(/_/g, ' ')}: ${percentage.toFixed(0)}%`}
                  >
                    {data.eventTypeBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No event data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anchor Type Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Anchor Type Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.anchorTypePerformance && data.anchorTypePerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.anchorTypePerformance}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="anchorType" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="clicks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No anchor data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Travel Mode & Custom Places */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Travel Mode Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Travel Mode Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.travelModeUsage && data.travelModeUsage.length > 0 ? (
                data.travelModeUsage.map((mode) => {
                  const Icon = getTravelModeIcon(mode.mode);
                  return (
                    <div key={mode.mode} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium capitalize">{mode.mode}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{mode.toggles} toggles</span>
                        <Badge variant="outline">{mode.percentage.toFixed(0)}%</Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">No travel mode data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Place Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Custom Place Additions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.customPlaceTypes && data.customPlaceTypes.length > 0 ? (
                data.customPlaceTypes.map((place) => {
                  const Icon = getPlaceTypeIcon(place.placeType);
                  return (
                    <div key={place.placeType} className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium capitalize">{place.placeType}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{place.additions} added</span>
                        <Badge variant="outline">{place.percentage.toFixed(0)}%</Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">No custom places added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
