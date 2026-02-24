import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, Users, Home, ExternalLink, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAgencies, type AgencyWithCounts } from '@/hooks/useAgency';
import { Layout } from '@/components/layout/Layout';
import { useExtractedColor } from '@/hooks/useExtractedColor';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

type SortOption = 'az' | 'established' | 'team' | 'listings';

export default function Agencies() {
  const { data: agencies, isLoading } = useAgencies();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('az');

  // Extract unique cities from all agencies
  const allCities = useMemo(() => {
    if (!agencies) return [];
    const citySet = new Set<string>();
    agencies.forEach((a) => {
      a.cities_covered?.forEach((c) => citySet.add(c));
    });
    return Array.from(citySet).sort();
  }, [agencies]);

  // Filter and sort
  const filteredAgencies = useMemo(() => {
    if (!agencies) return [];
    let result = [...agencies];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => a.name.toLowerCase().includes(q));
    }

    // City filter
    if (selectedCity) {
      result = result.filter((a) => a.cities_covered?.includes(selectedCity));
    }

    // Sort
    switch (sortBy) {
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'established':
        result.sort((a, b) => (a.founded_year || 9999) - (b.founded_year || 9999));
        break;
      case 'team':
        result.sort((a, b) => b.agent_count - a.agent_count);
        break;
      case 'listings':
        result.sort((a, b) => b.listing_count - a.listing_count);
        break;
    }

    return result;
  }, [agencies, searchQuery, selectedCity, sortBy]);

  const isFiltered = searchQuery.trim() !== '' || selectedCity !== null;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity(null);
    setSortBy('az');
  };

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Real Estate Agencies</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            {isLoading
              ? 'Loading agencies…'
              : isFiltered
                ? `Showing ${filteredAgencies.length} of ${agencies?.length || 0} agencies`
                : `Browse ${agencies?.length || 0} real estate agencies in Israel. Find the right team for your property search.`}
          </p>
        </div>

        {/* Search + Sort Row */}
        {!isLoading && agencies && agencies.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agencies by name…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="az">A – Z</SelectItem>
                  <SelectItem value="established">Most Established</SelectItem>
                  <SelectItem value="team">Largest Team</SelectItem>
                  <SelectItem value="listings">Most Listings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* City Filter Pills */}
            {allCities.length > 0 && (
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2 pb-2">
                  <button
                    onClick={() => setSelectedCity(null)}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                      selectedCity === null
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    All
                  </button>
                  {allCities.map((city) => (
                    <button
                      key={city}
                      onClick={() => setSelectedCity(selectedCity === city ? null : city)}
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                        selectedCity === city
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </div>
        )}

        {/* Agencies Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        ) : filteredAgencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        ) : isFiltered ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No agencies match your filters</h2>
              <p className="text-muted-foreground mb-4">Try adjusting your search or clearing the filters.</p>
              <Button variant="outline" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
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
  agency: AgencyWithCounts;
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

          {/* Specializations */}
          {agency.specializations && agency.specializations.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {agency.specializations.slice(0, 3).map((spec) => (
                <Badge key={spec} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
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

          {/* Footer with real stats */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {agency.agent_count} {agency.agent_count === 1 ? 'Agent' : 'Agents'}
              </span>
              <span className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                {agency.listing_count} {agency.listing_count === 1 ? 'Listing' : 'Listings'}
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
