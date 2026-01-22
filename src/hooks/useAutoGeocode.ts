import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoGeocodeResult {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook that auto-geocodes a property/project address if lat/lng are missing.
 * Uses Nominatim (OpenStreetMap) - no API key needed.
 */
export function useAutoGeocode(
  entityType: 'property' | 'project',
  entityId: string | undefined,
  address: string,
  city: string,
  existingLat?: number | null,
  existingLng?: number | null
): AutoGeocodeResult {
  const [latitude, setLatitude] = useState<number | null>(existingLat ?? null);
  const [longitude, setLongitude] = useState<number | null>(existingLng ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have coordinates, use them
    if (existingLat != null && existingLng != null) {
      setLatitude(existingLat);
      setLongitude(existingLng);
      return;
    }

    // Don't geocode if we don't have required info
    if (!entityId || !address || !city) {
      return;
    }

    const geocodeAddress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build a full address for geocoding
        const fullAddress = `${address}, ${city}, Israel`;
        
        // Use Nominatim (OpenStreetMap) - free, no API key needed
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&countrycodes=il&limit=1`,
          {
            headers: {
              'User-Agent': 'BuyWiseIsrael/1.0 (contact@buywise.co.il)'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const results = await response.json();

        if (results && results.length > 0) {
          const lat = parseFloat(results[0].lat);
          const lng = parseFloat(results[0].lon);

          // Validate coordinates are in Israel (roughly)
          if (lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36) {
            setLatitude(lat);
            setLongitude(lng);

            // Save to database for future use
            const table = entityType === 'property' ? 'properties' : 'projects';
            await supabase
              .from(table)
              .update({ latitude: lat, longitude: lng })
              .eq('id', entityId);
          } else {
            setError('Geocoded location outside Israel bounds');
          }
        } else {
          setError('No geocoding results found');
        }
      } catch (err) {
        console.error('Auto-geocode error:', err);
        setError(err instanceof Error ? err.message : 'Geocoding failed');
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to avoid hammering Nominatim on rapid navigation
    const timeoutId = setTimeout(geocodeAddress, 500);
    return () => clearTimeout(timeoutId);
  }, [entityId, address, city, existingLat, existingLng, entityType]);

  return { latitude, longitude, isLoading, error };
}
