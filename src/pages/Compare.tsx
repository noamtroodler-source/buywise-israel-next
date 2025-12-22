import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bed, Bath, Maximize, MapPin, X, Calendar, Building } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';

export default function Compare() {
  const { compareIds, removeFromCompare, clearCompare } = useCompare();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

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
        // Maintain order from compareIds
        const ordered = compareIds
          .map(id => data.find(p => p.id === id))
          .filter(Boolean) as Property[];
        setProperties(ordered);
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

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
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
        <div className="container py-12">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">No Properties to Compare</h1>
            <p className="text-muted-foreground">
              Add properties to compare by clicking the compare button on property cards.
            </p>
            <Button asChild>
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

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/listings?status=for_sale">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Compare Properties</h1>
              <p className="text-muted-foreground text-sm">
                {properties.length} properties side by side
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearCompare}>
            Clear All
          </Button>
        </div>

        {/* Property Cards Header */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${properties.length}, minmax(0, 1fr))` }}>
          {properties.map(property => (
            <Card key={property.id} className="overflow-hidden">
              <div className="relative aspect-[4/3]">
                <img
                  src={property.images?.[0] || '/placeholder.svg'}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 hover:bg-background"
                  onClick={() => removeFromCompare(property.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
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
              </div>
            </Card>
          ))}
        </div>

        {/* Comparison Table */}
        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {comparisonRows.map((row, index) => (
              <div 
                key={row.label}
                className={`grid gap-4 ${index % 2 === 0 ? 'bg-muted/30' : ''}`}
                style={{ gridTemplateColumns: `160px repeat(${properties.length}, minmax(0, 1fr))` }}
              >
                <div className="p-4 font-medium text-sm flex items-center gap-2">
                  {row.icon && <row.icon className="h-4 w-4 text-muted-foreground" />}
                  {row.label}
                </div>
                {properties.map(property => (
                  <div 
                    key={property.id} 
                    className={`p-4 text-sm ${row.highlight ? 'font-semibold text-primary' : ''}`}
                  >
                    {row.getValue(property)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>

        {/* View Property Buttons */}
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${properties.length}, minmax(0, 1fr))` }}>
          {properties.map(property => (
            <Button key={property.id} asChild variant="outline" className="w-full">
              <Link to={`/property/${property.id}`}>
                View Full Details
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </Layout>
  );
}
