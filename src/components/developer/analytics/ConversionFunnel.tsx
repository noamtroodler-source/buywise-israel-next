import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, TrendingUp, Eye, MessageSquare } from 'lucide-react';

interface ConversionFunnelProps {
  views: number;
  inquiries: number;
}

export function ConversionFunnel({ views, inquiries }: ConversionFunnelProps) {
  const inquiryRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0';
  const inquiryHeight = views > 0 ? Math.max((inquiries / views) * 100, 8) : 8;

  return (
    <Card className="rounded-2xl border-border/50 hover:shadow-lg transition-all h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">Conversion Funnel</CardTitle>
            <p className="text-sm text-muted-foreground">Views to inquiry conversion</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-center gap-8 py-4">
          {/* Views Bar */}
          <div className="flex-1 text-center max-w-[140px]">
            <div className="h-32 flex items-end justify-center mb-4">
              <div
                className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-xl shadow-lg shadow-primary/20 transition-all"
                style={{ height: '100%' }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-4 w-4 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{views}</span>
            </div>
            <p className="text-sm text-muted-foreground">Views</p>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center pb-16">
            <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Inquiries Bar */}
          <div className="flex-1 text-center max-w-[140px]">
            <div className="h-32 flex items-end justify-center mb-4">
              <div
                className="w-full bg-gradient-to-t from-primary/60 to-primary/40 rounded-xl shadow-lg shadow-primary/10 transition-all"
                style={{ height: `${inquiryHeight}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{inquiries}</span>
            </div>
            <p className="text-sm text-muted-foreground">Inquiries</p>
          </div>
        </div>

        {/* Conversion Rate Badge */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-primary/10">
              <span className="text-lg font-bold text-primary">{inquiryRate}%</span>
            </div>
            <p className="text-sm text-muted-foreground">
              of viewers submitted an inquiry
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
