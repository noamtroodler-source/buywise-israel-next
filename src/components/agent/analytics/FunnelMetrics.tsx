import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface FunnelMetricsProps {
  views: number;
  saves: number;
  inquiries: number;
}

export function FunnelMetrics({ views, saves, inquiries }: FunnelMetricsProps) {
  const saveRate = views > 0 ? ((saves / views) * 100).toFixed(1) : '0';
  const inquiryRate = views > 0 ? ((inquiries / views) * 100).toFixed(1) : '0';
  const saveToInquiryRate = saves > 0 ? ((inquiries / saves) * 100).toFixed(1) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conversion Funnel</CardTitle>
      </CardHeader>
      <CardContent>
        {views === 0 && saves === 0 && inquiries === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-xl bg-primary/10 mb-3">
              <ArrowRight className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">No funnel data yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Views will appear once your listings go live. Saves and inquiries will follow as buyers engage.
            </p>
          </div>
        ) : (
        <>
        <div className="flex items-center justify-between gap-2">
          {/* Views */}
          <div className="flex-1 text-center">
            <div className="h-20 flex items-end justify-center">
              <div
                className="w-full max-w-[100px] bg-primary rounded-t-lg transition-all"
                style={{ height: '100%' }}
              />
            </div>
            <p className="text-2xl font-bold mt-2">{views}</p>
            <p className="text-sm text-muted-foreground">Views</p>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

          {/* Saves */}
          <div className="flex-1 text-center">
            <div className="h-20 flex items-end justify-center">
              <div
                className="w-full max-w-[100px] bg-primary/70 rounded-t-lg transition-all"
                style={{ height: views > 0 ? `${Math.max((saves / views) * 100, 5)}%` : '5%' }}
              />
            </div>
            <p className="text-2xl font-bold mt-2">{saves}</p>
            <p className="text-sm text-muted-foreground">Saves ({saveRate}%)</p>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

          {/* Inquiries */}
          <div className="flex-1 text-center">
            <div className="h-20 flex items-end justify-center">
              <div
                className="w-full max-w-[100px] bg-primary/40 rounded-t-lg transition-all"
                style={{ height: views > 0 ? `${Math.max((inquiries / views) * 100, 5)}%` : '5%' }}
              />
            </div>
            <p className="text-2xl font-bold mt-2">{inquiries}</p>
            <p className="text-sm text-muted-foreground">Inquiries ({inquiryRate}%)</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            <span className="font-medium text-foreground">{saveToInquiryRate}%</span> of users who saved also inquired
          </p>
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
