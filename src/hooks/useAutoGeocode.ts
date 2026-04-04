import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutoGeocodeResult {
  latitude: number | null;
  longitude: number | null;
  isLoading: boolean;
  error: string | null;
  source: string | null;
}

/**
 * Hook that auto-geocodes a property/project address if lat/lng are missing.
 * Uses Google Maps as primary provider with Nominatim fallback.
 */
export function useAutoGeocode(
  entityType: 'property' | 'project',
  entityId: string | undefined,
  address: string,
  city: string,
  existingLat?: number | null,
  existingLng?: number | null,
  neighborhood?: string
): AutoGeocodeResult {
  const [latitude, setLatitude] = useState<number | null>(existingLat ?? null);
  const [longitude, setLongitude] = useState<number | null>(existingLng ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (existingLat != null && existingLng != null) {
      setLatitude(existingLat);
      setLongitude(existingLng);
      return;
    }

    // For sourced listings with no address, geocode using neighborhood or city
    const geocodeTarget = address?.trim() || neighborhood?.trim() || '';
    if (!entityId || !geocodeTarget || !city) return;

    const geocodeAddress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Use address if available, otherwise fall back to neighborhood for approximate location
        const geocodeAddress_str = address?.trim() || neighborhood?.trim() || city;
        const { data, error: fnError } = await supabase.functions.invoke('geocode-address', {
          body: { entityType, entityId, address: geocodeAddress_str, city, neighborhood, skipDbSave: !address?.trim() }
        });

        if (fnError) {
          console.error('[useAutoGeocode] Function error:', fnError);
          throw new Error(fnError.message || 'Geocoding service error');
        }

        if (!data.success) {
          console.error('[useAutoGeocode] Geocoding failed:', data.error);
          throw new Error(data.error || 'Failed to geocode address');
        }

        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setSource(data.source || null);
        console.log(`[useAutoGeocode] Geocoded via ${data.source}: ${data.latitude}, ${data.longitude}`);
      } catch (err) {
        console.error('[useAutoGeocode] Error:', err);
        setError(err instanceof Error ? err.message : 'Geocoding failed');
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(geocodeAddress, 300);
    return () => clearTimeout(timeoutId);
  }, [entityId, address, city, neighborhood, existingLat, existingLng, entityType]);

  return { latitude, longitude, isLoading, error, source };
}
