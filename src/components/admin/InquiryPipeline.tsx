import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, Clock, AlertTriangle, CheckCircle2, 
  Mail, Phone, MessageCircle 
} from 'lucide-react';
import { InquiryMetricsData } from '@/hooks/useInquiryMetrics';

interface InquiryPipelineProps {
  data: InquiryMetricsData | undefined;
  isLoading?: boolean;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  'WhatsApp': MessageCircle,
  'Phone Call': Phone,
  'Email': Mail,
  'Contact Form': MessageSquare,
};

const STATUS_COLORS: Record<string, string> = {
  'New': 'bg-blue-500',
  'Contacted': 'bg-yellow-500',
  'Qualified': 'bg-green-500',
  'Closed': 'bg-muted-foreground',
  'Spam': 'bg-red-500',
};

export function InquiryPipeline({ data, isLoading }: InquiryPipelineProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inquiry Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Inquiry Pipeline
          </span>
          {(data?.overdueCount || 0) > 0 && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {data?.overdueCount} overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{data?.totalInquiries || 0}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10">
            <p className="text-2xl font-bold text-blue-600">{data?.unreadCount || 0}</p>
            <p className="text-xs text-muted-foreground">Unread</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <p className="text-2xl font-bold text-green-600">{data?.contactedCount || 0}</p>
            <p className="text-xs text-muted-foreground">Contacted</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="flex items-center justify-center gap-1">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {data?.avgResponseTimeHours !== null 
                  ? data.avgResponseTimeHours.toFixed(1) 
                  : '-'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Avg Hours</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Status Pipeline */}
          <div>
            <p className="text-sm font-medium mb-3">By Status</p>
            {(data?.statusBreakdown || []).length === 0 ? (
              <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                No inquiry data
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.statusBreakdown || []).map((status) => (
                  <div key={status.status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`h-2 w-2 rounded-full ${STATUS_COLORS[status.status] || 'bg-muted-foreground'}`}
                        />
                        <span>{status.status}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {status.count} ({status.percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${STATUS_COLORS[status.status] || 'bg-muted-foreground'}`}
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Type Breakdown */}
          <div>
            <p className="text-sm font-medium mb-3">By Source</p>
            {(data?.typeBreakdown || []).length === 0 ? (
              <div className="h-[120px] flex items-center justify-center text-muted-foreground text-sm">
                No inquiry data
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.typeBreakdown || []).map((type) => {
                  const Icon = TYPE_ICONS[type.type] || MessageSquare;
                  return (
                    <div 
                      key={type.type}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{type.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{type.count}</span>
                        <span className="text-xs text-muted-foreground ml-1">
                          ({type.percentage.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Alert Banner */}
        {(data?.overdueCount || 0) > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {data?.overdueCount} inquiries have not been contacted within 24 hours
              </span>
            </div>
          </div>
        )}

        {(data?.overdueCount || 0) === 0 && (data?.totalInquiries || 0) > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">
                All inquiries responded to within 24 hours
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
