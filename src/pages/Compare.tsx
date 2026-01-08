import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Bed, Bath, Maximize, Building, Calendar, Car, Sofa, Accessibility, TrendingUp, Home, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/types/database';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/useAuth';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { toast } from 'sonner';
import {
  CompareHero,
  ComparePropertyCard,
  CompareQuickInsights,
  CompareSection,
  CompareEmptyState,
  CompareWinnerSummary,
  type ComparisonRow,
} from '@/components/compare';

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
  const { compareIds, removeFromCompare, clearCompare, maxItems } = useCompare();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [investorView, setInvestorView] = useState(false);
  const [rentalData, setRentalData] = useState<RentalData[]>([]);
  const [marketData, setMarketData] = useState<MarketDataEntry[]>([]);
  const { user } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Property Comparison',
          text: `Compare ${properties.length} properties`,
          url: url,
        });
      } catch {
        // User cancelled
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

  // Helper functions for investment metrics
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

  // Comparison row definitions
  const coreDetailsRows: ComparisonRow[] = useMemo(() => [
    {
      label: 'Price',
      getValue: (p: Property) => formatPrice(p.price, p.currency || 'ILS'),
      highlight: true,
      getBestPropertyId: (props: Property[]) => {
        if (props.length < 2) return null;
        const min = props.reduce((best, p) => p.price < best.price ? p : best);
        return min.id;
      },
    },
    {
      label: 'Price/m²',
      getValue: (p: Property) => p.size_sqm ? formatPrice(Math.round(p.price / p.size_sqm), p.currency || 'ILS') : '—',
      getBestPropertyId: (props: Property[]) => {
        const withSize = props.filter(p => p.size_sqm && p.size_sqm > 0);
        if (withSize.length < 2) return null;
        const min = withSize.reduce((best, p) => {
          const current = p.price / (p.size_sqm || 1);
          const bestVal = best.price / (best.size_sqm || 1);
          return current < bestVal ? p : best;
        });
        return min.id;
      },
    },
    {
      label: 'Size',
      getValue: (p: Property) => p.size_sqm ? formatArea(p.size_sqm) : '—',
      icon: Maximize,
      getBestPropertyId: (props: Property[]) => {
        const withSize = props.filter(p => p.size_sqm);
        if (withSize.length < 2) return null;
        const max = withSize.reduce((best, p) => (p.size_sqm || 0) > (best.size_sqm || 0) ? p : best);
        return max.id;
      },
    },
    {
      label: 'Bedrooms',
      getValue: (p: Property) => p.bedrooms?.toString() || '—',
      icon: Bed,
      getBestPropertyId: (props: Property[]) => {
        const withBeds = props.filter(p => p.bedrooms);
        if (withBeds.length < 2) return null;
        const max = withBeds.reduce((best, p) => (p.bedrooms || 0) > (best.bedrooms || 0) ? p : best);
        return max.id;
      },
    },
    {
      label: 'Bathrooms',
      getValue: (p: Property) => p.bathrooms?.toString() || '—',
      icon: Bath,
    },
    {
      label: 'Floor',
      getValue: (p: Property) => p.floor ? `${p.floor}${p.total_floors ? ` / ${p.total_floors}` : ''}` : '—',
      icon: Building,
    },
    {
      label: 'Property Type',
      getValue: (p: Property) => getPropertyTypeLabel(p.property_type),
    },
  ], [formatPrice, formatArea]);

  const locationRows: ComparisonRow[] = useMemo(() => [
    {
      label: 'City',
      getValue: (p: Property) => p.city,
      icon: MapPin,
    },
    {
      label: 'Neighborhood',
      getValue: (p: Property) => p.neighborhood || '—',
    },
    {
      label: 'Address',
      getValue: (p: Property) => p.address,
    },
  ], []);

  const characterRows: ComparisonRow[] = useMemo(() => [
    {
      label: 'Condition',
      getValue: (p: Property) => p.condition ? p.condition.charAt(0).toUpperCase() + p.condition.slice(1) : '—',
    },
    {
      label: 'Year Built',
      getValue: (p: Property) => p.year_built?.toString() || '—',
      icon: Calendar,
    },
    {
      label: 'Parking',
      getValue: (p: Property) => p.parking ? `${p.parking} spots` : 'None',
      icon: Car,
    },
    {
      label: 'Furnished',
      getValue: (p: Property) => p.is_furnished ? 'Yes' : 'No',
      icon: Sofa,
    },
    {
      label: 'Accessible',
      getValue: (p: Property) => p.is_accessible ? 'Yes' : 'No',
      icon: Accessibility,
    },
  ], []);

  const investorRows: ComparisonRow[] = useMemo(() => [
    {
      label: 'Est. Monthly Rent',
      getValue: (p: Property) => getEstimatedRent(p),
      tooltip: 'Estimated monthly rent based on similar properties in the area.',
    },
    {
      label: 'Rental Yield',
      getValue: (p: Property) => getRentalYield(p),
      highlight: true,
      tooltip: 'Annual rent divided by purchase price. Higher = better investment return.',
      getBestPropertyId: (props: Property[]) => {
        const yields = props.map(p => {
          const cityData = rentalData.filter(r => r.city.toLowerCase() === p.city.toLowerCase());
          const roomMatch = cityData.find(r => r.rooms === p.bedrooms);
          if (roomMatch && p.price > 0) {
            const avgRent = (roomMatch.price_min + roomMatch.price_max) / 2;
            return { id: p.id, yield: (avgRent * 12 / p.price) * 100 };
          }
          return { id: p.id, yield: 0 };
        }).filter(y => y.yield > 0);
        if (yields.length < 2) return null;
        const max = yields.reduce((best, y) => y.yield > best.yield ? y : best);
        return max.id;
      },
    },
    {
      label: 'Price vs City Avg',
      getValue: (p: Property) => getPriceVsCityAvg(p),
      tooltip: 'How this property\'s price per m² compares to the city average.',
    },
    {
      label: '12-Month Change',
      getValue: (p: Property) => getPriceChange(p),
      tooltip: 'How prices in this area changed over the past year.',
    },
  ], [rentalData, marketData]);

  // Calculate winner counts
  const winnerCounts = useMemo(() => {
    if (properties.length < 2) return [];
    
    const allRows = [...coreDetailsRows, ...(investorView ? investorRows : [])];
    const counts: Record<string, { title: string; wins: number }> = {};
    
    properties.forEach(p => {
      counts[p.id] = { title: p.title, wins: 0 };
    });

    allRows.forEach(row => {
      if (row.getBestPropertyId) {
        const bestId = row.getBestPropertyId(properties);
        if (bestId && counts[bestId]) {
          counts[bestId].wins++;
        }
      }
    });

    return Object.entries(counts).map(([propertyId, data]) => ({
      propertyId,
      title: data.title,
      wins: data.wins,
    }));
  }, [properties, coreDetailsRows, investorRows, investorView]);

  // Generate winner badges for cards
  const getWinnerBadge = (propertyId: string): string | null => {
    if (properties.length < 2) return null;
    
    const lowestPrice = properties.reduce((min, p) => p.price < min.price ? p : min);
    if (lowestPrice.id === propertyId) return 'Lowest Price';
    
    const withSize = properties.filter(p => p.size_sqm);
    if (withSize.length > 0) {
      const largest = withSize.reduce((max, p) => (p.size_sqm || 0) > (max.size_sqm || 0) ? p : max);
      if (largest.id === propertyId) return 'Largest';
    }

    return null;
  };

  if (loading) {
    return (
      <Layout>
        <div className="bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-48" />
              <div className="h-6 bg-muted rounded w-72" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-80 bg-muted rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (properties.length === 0) {
    return (
      <Layout>
        <CompareEmptyState />
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Header */}
      <CompareHero
        propertyCount={properties.length}
        maxProperties={maxItems}
        investorView={investorView}
        onInvestorViewChange={setInvestorView}
        onShare={handleShare}
        onClearAll={clearCompare}
      />

      <div className="container py-8 space-y-8">
        {/* Property Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {properties.map(property => (
              <ComparePropertyCard
                key={property.id}
                property={property}
                formatPrice={formatPrice}
                formatArea={formatArea}
                isFavorite={favoriteIds.includes(property.id)}
                onRemove={() => removeFromCompare(property.id)}
                onToggleFavorite={() => handleToggleFavorite(property.id)}
                winnerBadge={getWinnerBadge(property.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Insights */}
        <CompareQuickInsights
          properties={properties}
          formatPrice={formatPrice}
          formatArea={formatArea}
        />

        {/* Comparison Sections */}
        <div className="space-y-6">
          <CompareSection
            title="Core Details"
            icon={Home}
            rows={coreDetailsRows}
            properties={properties}
          />

          <CompareSection
            title="Location"
            icon={MapPin}
            rows={locationRows}
            properties={properties}
          />

          <CompareSection
            title="Property Character"
            icon={Building}
            rows={characterRows}
            properties={properties}
          />

          {investorView && (
            <CompareSection
              title="Investment Metrics"
              icon={TrendingUp}
              rows={investorRows}
              properties={properties}
              variant="investor"
            />
          )}
        </div>

        {/* Winner Summary */}
        <CompareWinnerSummary
          properties={properties}
          winnerCounts={winnerCounts}
        />
      </div>
    </Layout>
  );
}
