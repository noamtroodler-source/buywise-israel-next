import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, CheckCircle2, Home, ImageOff, 
  FileText, Clock, DollarSign 
} from 'lucide-react';
import { InventoryHealth } from '@/hooks/useInventoryHealth';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InventoryHealthCardProps {
  data: InventoryHealth | undefined;
  isLoading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'For Sale': 'hsl(var(--primary))',
  'For Rent': 'hsl(190, 80%, 42%)',
  'Sold': 'hsl(258, 55%, 52%)',
  'Rented': 'hsl(142, 71%, 45%)',
  'Other': 'hsl(var(--muted-foreground))',
};

const VERIFICATION_COLORS: Record<string, string> = {
  'Approved': 'hsl(142, 71%, 45%)',
  'Pending Review': 'hsl(45, 93%, 47%)',
  'Draft': 'hsl(var(--muted-foreground))',
  'Rejected': 'hsl(0, 84%, 60%)',
};

export function InventoryHealthCard({ data, isLoading }: InventoryHealthCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Health</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const qualityIssues = [
    {
      label: 'Missing Images',
      count: data?.qualityMetrics.withoutImages || 0,
      icon: ImageOff,
      severity: 'warning',
    },
    {
      label: 'Short Descriptions',
      count: data?.qualityMetrics.shortDescriptions || 0,
      icon: FileText,
      severity: 'info',
    },
    {
      label: 'Stale (30+ days)',
      count: data?.qualityMetrics.staleListings || 0,
      icon: Clock,
      severity: 'warning',
    },
    {
      label: 'Missing Price',
      count: data?.qualityMetrics.missingPrice || 0,
      icon: DollarSign,
      severity: 'error',
    },
  ];

  const totalIssues = qualityIssues.reduce((sum, issue) => sum + issue.count, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Inventory Health
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {data?.totalListings || 0} listings
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Listing Type Breakdown */}
          <div>
            <p className="text-sm font-medium mb-2">By Listing Type</p>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.listingTypeBreakdown || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="type"
                  >
                    {(data?.listingTypeBreakdown || []).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={STATUS_COLORS[entry.type] || STATUS_COLORS['Other']} 
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                            <p className="font-medium">{item.type}</p>
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
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {(data?.listingTypeBreakdown || []).map((item) => (
                <div key={item.type} className="flex items-center gap-1 text-xs">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: STATUS_COLORS[item.type] || STATUS_COLORS['Other'] }}
                  />
                  <span>{item.type}: {item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <p className="text-sm font-medium mb-2">By Status</p>
            <div className="space-y-2">
              {(data?.verificationBreakdown || []).map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 w-2 rounded-full" 
                      style={{ 
                        backgroundColor: VERIFICATION_COLORS[item.status] || 'hsl(var(--muted-foreground))' 
                      }}
                    />
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Issues */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium flex items-center gap-2">
              {totalIssues > 0 ? (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
              Quality Issues
            </p>
            {totalIssues > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600">
                {totalIssues} items need attention
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {qualityIssues.map((issue) => (
              <div 
                key={issue.label}
                className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                  issue.count > 0 
                    ? issue.severity === 'error' 
                      ? 'bg-red-500/10 text-red-600' 
                      : issue.severity === 'warning'
                      ? 'bg-yellow-500/10 text-yellow-600'
                      : 'bg-muted/50 text-muted-foreground'
                    : 'bg-muted/30 text-muted-foreground'
                }`}
              >
                <issue.icon className="h-4 w-4" />
                <span className="flex-1">{issue.label}</span>
                <span className="font-medium">{issue.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
