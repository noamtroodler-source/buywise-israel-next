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
 * Uses a backend edge function for reliable server-side geocoding.
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

        // Call the backend geocoding function
        const { data, error: fnError } = await supabase.functions.invoke('geocode-address', {
          body: {
            entityType,
            entityId,
            address,
            city,
            neighborhood
          }
        });

        if (fnError) {
          console.error('[useAutoGeocode] Function error:', fnError);
          throw new Error(fnError.message || 'Geocoding service error');
        }

        if (!data.success) {
          console.error('[useAutoGeocode] Geocoding failed:', data.error);
          throw new Error(data.error || 'Failed to geocode address');
        }

        // Successfully geocoded
        setLatitude(data.latitude);
        setLongitude(data.longitude);

      } catch (err) {
        console.error('[useAutoGeocode] Error:', err);
        setError(err instanceof Error ? err.message : 'Geocoding failed');
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to avoid rapid calls on navigation
    const timeoutId = setTimeout(geocodeAddress, 300);
    return () => clearTimeout(timeoutId);
  }, [entityId, address, city, neighborhood, existingLat, existingLng, entityType]);

  return { latitude, longitude, isLoading, error };
}
