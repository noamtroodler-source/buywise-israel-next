import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface ConversionFunnelProps {
  views: number;
  inquiries: number;
}

export function ConversionFunnel({ views, inquiries }: ConversionFunnelProps) {
  const inquiryRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-4">
          {/* Views */}
          <div className="flex-1 text-center max-w-[150px]">
            <div className="h-24 flex items-end justify-center">
              <div
                className="w-full bg-primary rounded-t-lg transition-all"
                style={{ height: '100%' }}
              />
            </div>
            <p className="text-2xl font-bold mt-2">{views}</p>
            <p className="text-sm text-muted-foreground">Views</p>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

          {/* Inquiries */}
          <div className="flex-1 text-center max-w-[150px]">
            <div className="h-24 flex items-end justify-center">
              <div
                className="w-full bg-primary/50 rounded-t-lg transition-all"
                style={{ height: views > 0 ? `${Math.max((inquiries / views) * 100, 5)}%` : '5%' }}
              />
            </div>
            <p className="text-2xl font-bold mt-2">{inquiries}</p>
            <p className="text-sm text-muted-foreground">Inquiries ({inquiryRate}%)</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-medium text-foreground">{inquiryRate}%</span> of viewers submitted an inquiry
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
