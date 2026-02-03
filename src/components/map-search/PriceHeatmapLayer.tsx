import { useMemo } from 'react';
import { Circle, useMap } from '@/vendor/react-leaflet';
import { useCities } from '@/hooks/useCities';

interface PriceHeatmapLayerProps {
  visible: boolean;
}

// Color scale based on price per sqm (in ILS)
function getPriceColor(pricePerSqm: number | null): string {
  if (!pricePerSqm) return 'hsl(0 0% 50%)'; // Gray for unknown
  
  if (pricePerSqm < 25000) return 'hsl(142 76% 50%)';   // Green - affordable
  if (pricePerSqm < 40000) return 'hsl(80 65% 50%)';    // Light green
  if (pricePerSqm < 55000) return 'hsl(45 100% 51%)';   // Yellow - moderate
  if (pricePerSqm < 70000) return 'hsl(25 95% 53%)';    // Orange
  return 'hsl(0 84% 60%)';                               // Red - expensive
}

// Get radius based on population/importance
function getCityRadius(population: number | null, name: string): number {
  // Major cities get larger radius
  const majorCities = ['Tel Aviv', 'Jerusalem', 'Haifa', 'Beer Sheva'];
  if (majorCities.includes(name)) return 8000;
  
  if (population && population > 100000) return 6000;
  if (population && population > 50000) return 5000;
  return 4000;
}

export function PriceHeatmapLayer({ visible }: PriceHeatmapLayerProps) {
  const { data: cities, isLoading } = useCities();
  const map = useMap();

  const citiesWithCoords = useMemo(() => {
    if (!cities) return [];
    
    return cities
      .filter((city) => city.center_lat && city.center_lng && city.average_price_sqm)
      .map((city) => ({
        id: city.id,
        name: city.name,
        lat: city.center_lat!,
        lng: city.center_lng!,
        pricePerSqm: city.average_price_sqm,
        population: city.population,
        color: getPriceColor(city.average_price_sqm ?? null),
        radius: getCityRadius(city.population ?? null, city.name),
      }));
  }, [cities]);

  if (!visible || isLoading) return null;

  return (
    <>
      {citiesWithCoords.map((city) => (
        <Circle
          key={city.id}
          center={[city.lat, city.lng]}
          radius={city.radius}
          pathOptions={{
            color: city.color,
            fillColor: city.color,
            fillOpacity: 0.2,
            weight: 1,
            opacity: 0.4,
          }}
        />
      ))}
    </>
  );
}
