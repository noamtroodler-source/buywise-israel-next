import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, X, Calendar, Building, TrendingUp, Heart, Share2, Home } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface RentalData {
  city: string;
  rooms: number;
  price_min: number;
  price_max: number;
}

interface MarketDataEntry {
  city: string;
  average_price_sqm: number | null;
  price_change_percent: number | null;
  year: number;
  month: number | null;
}

export default function Compare() {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [investorView, setInvestorView] = useState(false);
  const [rentalData, setRentalData] = useState<RentalData[]>([]);
  const [marketData, setMarketData] = useState<MarketDataEntry[]>([]);
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();

  useEffect(() => {
    async function fetchProperties() {
      if (compareIds.length === 0) {
        setProperties([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .in('id', compareIds);

      if (!error && data) {
        const ordered = compareIds
          .map(id => data.find(p => p.id === id))
          .filter(Boolean) as Property[];
        setProperties(ordered);

        // Fetch rental and market data for investor view
        const cities = [...new Set(ordered.map(p => p.city))];
        
        const [rentalResult, marketResult] = await Promise.all([
          supabase.from('rental_prices').select('*').in('city', cities),
          supabase.from('market_data').select('*').in('city', cities).order('year', { ascending: false }).order('month', { ascending: false })
        ]);

        if (rentalResult.data) setRentalData(rentalResult.data);
        if (marketResult.data) setMarketData(marketResult.data);
      }
      setLoading(false);
    }

    fetchProperties();
  }, [compareIds]);

  const formatPrice = (price: number, currency: string = 'ILS') => {
    if (currency === 'ILS') {
      return `₪${price.toLocaleString()}`;
    }
    return `$${price.toLocaleString()}`;
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      apartment: 'Apartment',
      house: 'House',
      penthouse: 'Penthouse',
      cottage: 'Cottage',
      land: 'Land',
      commercial: 'Commercial',
    };
    return labels[type] || type;
  };

  const getEstimatedRent = (property: Property) => {
    const cityData = rentalData.filter(r => r.city.toLowerCase() === property.city.toLowerCase());
    const roomMatch = cityData.find(r => r.rooms === property.bedrooms);
    if (roomMatch) {
      const avgRent = Math.round((roomMatch.price_min + roomMatch.price_max) / 2);
      return formatPrice(avgRent, 'ILS') + '/mo';
    }
    return '—';
  };

  const getRentalYield = (property: Property) => {
    const cityData = rentalData.filter(r => r.city.toLowerCase() === property.city.toLowerCase());
    const roomMatch = cityData.find(r => r.rooms === property.bedrooms);
    if (roomMatch && property.price > 0) {
      const avgRent = (roomMatch.price_min + roomMatch.price_max) / 2;
      const annualRent = avgRent * 12;
      const yieldPercent = (annualRent / property.price) * 100;
      return `${yieldPercent.toFixed(1)}%`;
    }
    return '—';
  };

  const getPriceVsCityAvg = (property: Property) => {
    const cityMarket = marketData.find(m => m.city.toLowerCase() === property.city.toLowerCase());
    if (cityMarket?.average_price_sqm && property.size_sqm) {
      const propertyPricePerSqm = property.price / property.size_sqm;
      const diff = ((propertyPricePerSqm - cityMarket.average_price_sqm) / cityMarket.average_price_sqm) * 100;
      const prefix = diff >= 0 ? '+' : '';
      return `${prefix}${diff.toFixed(0)}% vs avg`;
    }
    return '—';
  };

  const getPriceChange = (property: Property) => {
    const cityMarket = marketData.find(m => m.city.toLowerCase() === property.city.toLowerCase());
    if (cityMarket?.price_change_percent !== null && cityMarket?.price_change_percent !== undefined) {
      const prefix = cityMarket.price_change_percent >= 0 ? '+' : '';
      return `${prefix}${cityMarket.price_change_percent.toFixed(1)}%`;
    }
    return '—';
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Property Comparison',
          text: `Compare ${properties.length} properties`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Comparison link copied to clipboard');
    }
  };

  const handleToggleFavorite = (propertyId: string) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return;
    }
    toggleFavorite(propertyId);
  };

  const isFavorite = (propertyId: string) => favoriteIds.includes(propertyId);

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (properties.length === 0) {
    return (
      <Layout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Home className="h-10 w-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">No Properties to Compare</h1>
              <p className="text-muted-foreground">
                Select up to 3 properties to compare them side by side. Look for the compare button on property cards while browsing.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/listings?status=for_sale">Browse Properties</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const comparisonRows = [
    {
      label: 'Price',
      getValue: (p: Property) => formatPrice(p.price, p.currency || 'ILS'),
      highlight: true,
    },
    {
      label: 'Price/m²',
      getValue: (p: Property) => p.size_sqm ? formatPrice(Math.round(p.price / p.size_sqm), p.currency || 'ILS') : '—',
    },
    {
      label: 'Location',
      getValue: (p: Property) => `${p.city}${p.neighborhood ? `, ${p.neighborhood}` : ''}`,
    },
    {
      label: 'Property Type',
      getValue: (p: Property) => getPropertyTypeLabel(p.property_type),
    },
    {
      label: 'Bedrooms',
      getValue: (p: Property) => p.bedrooms?.toString() || '—',
      icon: Bed,
    },
    {
      label: 'Bathrooms',
      getValue: (p: Property) => p.bathrooms?.toString() || '—',
      icon: Bath,
    },
    {
      label: 'Size',
      getValue: (p: Property) => p.size_sqm ? `${p.size_sqm} m²` : '—',
      icon: Maximize,
    },
    {
      label: 'Floor',
      getValue: (p: Property) => p.floor ? `${p.floor}${p.total_floors ? ` / ${p.total_floors}` : ''}` : '—',
      icon: Building,
    },
    {
      label: 'Year Built',
      getValue: (p: Property) => p.year_built?.toString() || '—',
      icon: Calendar,
    },
    {
      label: 'Parking',
      getValue: (p: Property) => p.parking ? `${p.parking} spots` : '—',
    },
    {
      label: 'Condition',
      getValue: (p: Property) => p.condition || '—',
    },
    {
      label: 'Furnished',
      getValue: (p: Property) => p.is_furnished ? 'Yes' : 'No',
    },
  ];

  const investorRows = [
    {
      label: 'Est. Monthly Rent',
      getValue: (p: Property) => getEstimatedRent(p),
      icon: TrendingUp,
    },
    {
      label: 'Rental Yield',
      getValue: (p: Property) => getRentalYield(p),
      highlight: true,
    },
    {
      label: 'Price vs City Avg',
      getValue: (p: Property) => getPriceVsCityAvg(p),
    },
    {
      label: '12-Month Change',
      getValue: (p: Property) => getPriceChange(p),
    },
  ];

  const allRows = investorView ? [...comparisonRows, ...investorRows] : comparisonRows;

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/listings?status=for_sale">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Compare Properties</h1>
              <p className="text-muted-foreground text-sm">
                {properties.length} of 3 properties selected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="investor-view"
                checked={investorView}
                onCheckedChange={setInvestorView}
              />
              <Label htmlFor="investor-view" className="text-sm font-medium cursor-pointer">
                Investor View
              </Label>
            </div>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={clearCompare}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Property Cards Header */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map(property => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative aspect-[4/3]">
                <img
                  src={property.images?.[0] || '/placeholder.svg'}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                    onClick={() => handleToggleFavorite(property.id)}
                  >
                    <Heart className={`h-4 w-4 ${isFavorite(property.id) ? 'fill-destructive text-destructive' : ''}`} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                    onClick={() => removeFromCompare(property.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground">
                  {property.listing_status === 'for_rent' ? 'For Rent' : 'For Sale'}
                </Badge>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold line-clamp-1">{property.title}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="line-clamp-1">{property.address}</span>
                </div>
                <div className="text-lg font-bold text-primary">
                  {formatPrice(property.price, property.currency || 'ILS')}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {/* Section: Property Details */}
            <div className="bg-muted/50 px-4 py-2 font-semibold text-sm">
              Property Details
            </div>
            {comparisonRows.map((row, index) => (
              <div 
                key={row.label}
                className={`grid gap-4 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                style={{ gridTemplateColumns: `140px repeat(${properties.length}, minmax(0, 1fr))` }}
              >
                <div className="p-3 sm:p-4 font-medium text-sm flex items-center gap-2">
                  {row.icon && <row.icon className="h-4 w-4 text-muted-foreground shrink-0" />}
                  <span className="truncate">{row.label}</span>
                </div>
                {properties.map(property => (
                  <div 
                    key={property.id} 
                    className={`p-3 sm:p-4 text-sm ${row.highlight ? 'font-semibold text-primary' : ''}`}
                  >
                    {row.getValue(property)}
                  </div>
                ))}
              </div>
            ))}

            {/* Section: Investment Metrics (only when toggled) */}
            {investorView && (
              <>
                <div className="bg-primary/10 px-4 py-2 font-semibold text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Investment Metrics
                </div>
                {investorRows.map((row, index) => (
                  <div 
                    key={row.label}
                    className={`grid gap-4 ${index % 2 === 0 ? 'bg-primary/5' : ''}`}
                    style={{ gridTemplateColumns: `140px repeat(${properties.length}, minmax(0, 1fr))` }}
                  >
                    <div className="p-3 sm:p-4 font-medium text-sm flex items-center gap-2">
                      {row.icon && <row.icon className="h-4 w-4 text-primary shrink-0" />}
                      <span className="truncate">{row.label}</span>
                    </div>
                    {properties.map(property => (
                      <div 
                        key={property.id} 
                        className={`p-3 sm:p-4 text-sm ${row.highlight ? 'font-semibold text-primary' : ''}`}
                      >
                        {row.getValue(property)}
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map(property => (
            <div key={property.id} className="flex gap-2">
              <Button asChild variant="default" className="flex-1">
                <Link to={`/property/${property.id}`}>
                  View Details
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => handleToggleFavorite(property.id)}
              >
                <Heart className={`h-4 w-4 ${isFavorite(property.id) ? 'fill-destructive text-destructive' : ''}`} />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
