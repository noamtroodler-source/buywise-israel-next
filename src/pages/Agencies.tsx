import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Users, Home, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgencies } from '@/hooks/useAgency';
import { Layout } from '@/components/layout/Layout';
import { useExtractedColor } from '@/hooks/useExtractedColor';

export default function Agencies() {
  const { data: agencies, isLoading } = useAgencies();

  return (
    <Layout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Real Estate Agencies</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Browse trusted real estate agencies in Israel. Find the right team to help you with your property search.
          </p>
        </div>

        {/* Agencies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : agencies && agencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Agencies Yet</h2>
              <p className="text-muted-foreground">Check back soon for real estate agencies.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

interface AgencyCardProps {
  agency: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    description: string | null;
    founded_year: number | null;
    website: string | null;
    is_verified: boolean;
    cities_covered: string[] | null;
  };
}

function AgencyCard({ agency }: AgencyCardProps) {
  const [logoError, setLogoError] = useState(false);
  const accentColor = useExtractedColor(agency.logo_url);
  
  return (
    <Link to={`/agencies/${agency.slug}`}>
      <Card 
        className="h-full hover:shadow-lg transition-shadow group"
        style={accentColor ? { borderLeft: `3px solid ${accentColor}` } : undefined}
      >
        <CardContent className="p-6 space-y-4">
          {/* Logo & Name */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
              {agency.logo_url && !logoError ? (
                <img 
                  src={agency.logo_url} 
                  alt={agency.name} 
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {agency.name}
                </h3>
                {agency.is_verified && (
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
              {agency.founded_year && (
                <p className="text-sm text-muted-foreground">Est. {agency.founded_year}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {agency.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{agency.description}</p>
          )}

          {/* Cities */}
          {agency.cities_covered && agency.cities_covered.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {agency.cities_covered.slice(0, 3).map((city) => (
                <Badge key={city} variant="secondary" className="text-xs">
                  {city}
                </Badge>
              ))}
              {agency.cities_covered.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{agency.cities_covered.length - 3} more
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                View team
              </span>
              <span className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Listings
              </span>
            </div>
            {agency.website && (
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
