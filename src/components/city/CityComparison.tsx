import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react';
import { useCities } from '@/hooks/useCities';
import { CityComparisonSelector } from './CityComparisonSelector';

interface CityComparisonProps {
  currentCitySlug: string;
  currentCityName: string;
}

type ComparisonMetric = {
  label: string;
  key: string;
  format: (value: number | null) => string;
  higherIsBetter: boolean;
};

const metrics: ComparisonMetric[] = [
  { 
    label: 'Avg. Price/m²', 
    key: 'average_price_sqm', 
    format: (v) => v ? `₪${v.toLocaleString()}` : 'N/A',
    higherIsBetter: false 
  },
  { 
    label: 'Gross Yield', 
    key: 'gross_yield_percent', 
    format: (v) => v ? `${v}%` : 'N/A',
    higherIsBetter: true 
  },
  { 
    label: 'Investment Score', 
    key: 'investment_score', 
    format: (v) => v ? `${v}/100` : 'N/A',
    higherIsBetter: true 
  },
  { 
    label: 'Commute to TLV', 
    key: 'commute_time_tel_aviv', 
    format: (v) => v === 0 ? 'In TLV' : v ? `${v} min` : 'N/A',
    higherIsBetter: false 
  },
  { 
    label: 'Arnona Rate', 
    key: 'arnona_rate_sqm', 
    format: (v) => v ? `₪${v}/m²` : 'N/A',
    higherIsBetter: false 
  },
  { 
    label: 'Socioeconomic', 
    key: 'socioeconomic_rank', 
    format: (v) => v ? `${v}/10` : 'N/A',
    higherIsBetter: true 
  },
];

export function CityComparison({ currentCitySlug, currentCityName }: CityComparisonProps) {
  const { data: allCities = [] } = useCities();
  const [selectedCities, setSelectedCities] = useState<string[]>([currentCityName]);
  
  const availableCities = useMemo(() => 
    allCities.map(c => ({ name: c.name, slug: c.slug })),
    [allCities]
  );
  
  const comparisonCities = useMemo(() => 
    allCities.filter(c => selectedCities.includes(c.name)),
    [allCities, selectedCities]
  );
  
  const getBestValue = (key: string, higherIsBetter: boolean): number | null => {
    const values = comparisonCities
      .map(c => (c as any)[key] as number | null)
      .filter((v): v is number => v !== null && v !== undefined);
    
    if (values.length === 0) return null;
    return higherIsBetter ? Math.max(...values) : Math.min(...values);
  };
  
  const getCellStyle = (value: number | null, bestValue: number | null, higherIsBetter: boolean) => {
    if (value === null || bestValue === null) return '';
    if (value === bestValue && comparisonCities.length > 1) {
      return 'bg-emerald-50 dark:bg-emerald-950/30';
    }
    return '';
  };
  
  const getIndicator = (value: number | null, bestValue: number | null, higherIsBetter: boolean) => {
    if (value === null || bestValue === null || comparisonCities.length <= 1) return null;
    if (value === bestValue) {
      return <Crown className="h-3.5 w-3.5 text-emerald-600 inline ml-1" />;
    }
    return null;
  };
  
  const getBestForTags = (city: any) => {
    const tags: string[] = [];
    
    // Best for investors - high yield
    if (city.gross_yield_percent && city.gross_yield_percent >= 4) {
      tags.push('Investors');
    }
    
    // Best for first-timers - lower prices
    if (city.average_price_sqm && city.average_price_sqm < 30000) {
      tags.push('First-time');
    }
    
    // Best for families - high socioeconomic
    if (city.socioeconomic_rank && city.socioeconomic_rank >= 8) {
      tags.push('Families');
    }
    
    // Anglo-friendly
    if (city.anglo_presence === 'High') {
      tags.push('Olim');
    }
    
    return tags;
  };

  if (comparisonCities.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Compare Cities
        </CardTitle>
        <CityComparisonSelector
          currentCity={currentCityName}
          selectedCities={selectedCities}
          onCitiesChange={setSelectedCities}
          availableCities={availableCities}
        />
      </CardHeader>
      <CardContent>
        {comparisonCities.length === 1 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Select more cities above to compare
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Metric</th>
                  {comparisonCities.map(city => (
                    <th key={city.slug} className="text-center py-2 px-2 font-medium">
                      <div className="flex flex-col items-center gap-1">
                        <span className={city.slug === currentCitySlug ? 'text-primary' : ''}>
                          {city.name}
                        </span>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {getBestForTags(city).slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(metric => {
                  const bestValue = getBestValue(metric.key, metric.higherIsBetter);
                  return (
                    <tr key={metric.key} className="border-b last:border-0">
                      <td className="py-3 pr-4 text-muted-foreground">{metric.label}</td>
                      {comparisonCities.map(city => {
                        const value = (city as any)[metric.key] as number | null;
                        return (
                          <td 
                            key={city.slug} 
                            className={`py-3 px-2 text-center ${getCellStyle(value, bestValue, metric.higherIsBetter)}`}
                          >
                            {metric.format(value)}
                            {getIndicator(value, bestValue, metric.higherIsBetter)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {comparisonCities.length > 1 && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Crown className="h-3.5 w-3.5 text-emerald-600" />
            <span>Best value highlighted</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
