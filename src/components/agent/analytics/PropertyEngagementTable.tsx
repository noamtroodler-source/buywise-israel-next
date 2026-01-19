import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, Eye, Heart, MousePointerClick } from 'lucide-react';

interface PropertyEngagement {
  propertyId: string;
  title: string;
  city: string;
  image: string | null;
  views: number;
  saves: number;
  clicks: number;
}

interface PropertyEngagementTableProps {
  data: PropertyEngagement[];
}

export function PropertyEngagementTable({ data }: PropertyEngagementTableProps) {
  if (data.length === 0) {
    return (
      <Card className="rounded-2xl border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Property Engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No property data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-primary/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Property Engagement</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-2 border-b border-border/50 text-xs text-muted-foreground font-medium">
          <span>Property</span>
          <span className="text-center flex items-center justify-center gap-1">
            <Eye className="h-3 w-3" /> Views
          </span>
          <span className="text-center flex items-center justify-center gap-1">
            <Heart className="h-3 w-3" /> Saves
          </span>
          <span className="text-center flex items-center justify-center gap-1">
            <MousePointerClick className="h-3 w-3" /> Clicks
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {data.map((property) => (
            <Link
              key={property.propertyId}
              to={`/properties/${property.propertyId}`}
              className="grid grid-cols-[1fr_60px_60px_60px] sm:grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-3 hover:bg-muted/30 transition-colors items-center"
            >
              {/* Property Info */}
              <div className="flex items-center gap-3 min-w-0">
                {property.image ? (
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Home className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{property.title}</p>
                  <p className="text-xs text-muted-foreground">{property.city}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="text-center">
                <span className="text-sm font-medium">{property.views}</span>
                <span className="sm:hidden text-xs text-muted-foreground block">views</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium">{property.saves}</span>
                <span className="sm:hidden text-xs text-muted-foreground block">saves</span>
              </div>
              <div className="text-center">
                <span className="text-sm font-medium text-primary">{property.clicks}</span>
                <span className="sm:hidden text-xs text-muted-foreground block">clicks</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
