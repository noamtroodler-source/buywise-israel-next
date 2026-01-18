import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Eye, Heart, MessageSquare, Clock } from 'lucide-react';
import { ConversionMetrics } from '@/hooks/useConversionMetrics';

interface ConversionFunnelProps {
  data: ConversionMetrics | undefined;
  isLoading?: boolean;
}

export function ConversionFunnel({ data, isLoading }: ConversionFunnelProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const funnelSteps = [
    {
      label: 'Views',
      value: data?.totalViews || 0,
      icon: Eye,
      color: 'bg-primary',
    },
    {
      label: 'Saves',
      value: data?.totalSaves || 0,
      icon: Heart,
      rate: data?.viewsToSavesRate || 0,
      color: 'bg-[hsl(190,80%,42%)]',
    },
    {
      label: 'Inquiries',
      value: data?.totalInquiries || 0,
      icon: MessageSquare,
      rate: data?.viewsToInquiriesRate || 0,
      color: 'bg-[hsl(258,55%,52%)]',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Conversion Funnel
          {data?.avgResponseTimeHours !== null && (
            <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Avg Response: {data.avgResponseTimeHours.toFixed(1)}h
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          {funnelSteps.map((step, index) => (
            <div key={step.label} className="flex items-center flex-1">
              <div className="flex-1">
                <div 
                  className={`${step.color} rounded-lg p-4 text-white text-center relative`}
                  style={{ 
                    opacity: 1 - (index * 0.15),
                  }}
                >
                  <step.icon className="h-5 w-5 mx-auto mb-1 opacity-80" />
                  <p className="text-2xl font-bold">{step.value.toLocaleString()}</p>
                  <p className="text-xs opacity-80">{step.label}</p>
                  {step.rate !== undefined && (
                    <p className="text-xs mt-1 opacity-90 font-medium">
                      {step.rate.toFixed(2)}% of views
                    </p>
                  )}
                </div>
              </div>
              {index < funnelSteps.length - 1 && (
                <ArrowRight className="h-5 w-5 text-muted-foreground mx-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
        
        {/* Additional metrics */}
        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {data?.inquiriesContacted || 0}
            </p>
            <p className="text-sm text-muted-foreground">Inquiries Contacted</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {(data?.inquiryContactRate || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">Contact Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
