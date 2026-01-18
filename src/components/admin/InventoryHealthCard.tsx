import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, CheckCircle2, Home, ImageOff, 
  FileText, Clock, DollarSign 
} from 'lucide-react';
import { InventoryHealth } from '@/hooks/useInventoryHealth';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface InventoryHealthCardProps {
  data: InventoryHealth | undefined;
  isLoading?: boolean;
}

// BuyWise brand-compliant palette
const STATUS_COLORS: Record<string, string> = {
  'For Sale': 'hsl(var(--primary))',
  'For Rent': 'hsl(213, 70%, 55%)',
  'Sold': 'hsl(213, 50%, 70%)',
  'Rented': 'hsl(213, 40%, 80%)',
  'Other': 'hsl(var(--muted-foreground))',
};

const VERIFICATION_COLORS: Record<string, string> = {
  'Approved': 'hsl(var(--primary))',
  'Pending Review': 'hsl(213, 60%, 65%)',
  'Draft': 'hsl(var(--muted-foreground))',
  'Rejected': 'hsl(213, 30%, 50%)',
};

export function InventoryHealthCard({ data, isLoading }: InventoryHealthCardProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl border-border/50">
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
    },
    {
      label: 'Short Descriptions',
      count: data?.qualityMetrics.shortDescriptions || 0,
      icon: FileText,
    },
    {
      label: 'Stale (30+ days)',
      count: data?.qualityMetrics.staleListings || 0,
      icon: Clock,
    },
    {
      label: 'Missing Price',
      count: data?.qualityMetrics.missingPrice || 0,
      icon: DollarSign,
    },
  ];

  const totalIssues = qualityIssues.reduce((sum, issue) => sum + issue.count, 0);

  return (
    <Card className="rounded-2xl border-border/50 overflow-hidden">
      <CardHeader className="pb-2 bg-gradient-to-r from-primary/5 to-transparent">
        <CardTitle className="text-lg flex items-center gap-2">
          <Home className="h-5 w-5 text-primary" />
          Inventory Health
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {data?.totalListings || 0} listings
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-6">
          {/* Listing Type Breakdown */}
          <div>
            <p className="text-sm font-semibold mb-2 text-foreground">By Listing Type</p>
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
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {(data?.listingTypeBreakdown || []).map((item) => (
                <div key={item.type} className="flex items-center gap-1 text-xs">
                  <div 
                    className="h-2 w-2 rounded-full" 
                    style={{ backgroundColor: STATUS_COLORS[item.type] || STATUS_COLORS['Other'] }}
                  />
                  <span className="text-foreground">{item.type}: {item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Status */}
          <div>
            <p className="text-sm font-semibold mb-2 text-foreground">By Status</p>
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
                    <span className="text-sm text-foreground">{item.status}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Issues */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold flex items-center gap-2 text-foreground">
              {totalIssues > 0 ? (
                <AlertCircle className="h-4 w-4 text-primary" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
              Quality Issues
            </p>
            {totalIssues > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalIssues} items need attention
              </Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {qualityIssues.map((issue) => (
              <div 
                key={issue.label}
                className={`flex items-center gap-2 p-2 rounded-xl text-sm transition-colors ${
                  issue.count > 0 
                    ? 'bg-primary/10 text-foreground' 
                    : 'bg-muted/30 text-muted-foreground'
                }`}
              >
                <issue.icon className={`h-4 w-4 ${issue.count > 0 ? 'text-primary' : ''}`} />
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