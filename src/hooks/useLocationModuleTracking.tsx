import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

type LocationEventType = 
  | 'module_open'
  | 'anchor_click'
  | 'nearby_place_expand'
  | 'custom_place_add'
  | 'travel_mode_toggle'
  | 'route_click'
  | 'search_area_click'
  | 'map_interaction';

type AnchorType = 'orientation' | 'daily' | 'mobility' | 'saved';
type TravelMode = 'walk' | 'drive' | 'transit';
type CustomPlaceType = 'school' | 'work' | 'family' | 'other';

interface LocationEventMetadata {
  anchorName?: string;
  placeName?: string;
  travelTimeMinutes?: number;
  destinationCoords?: { lat: number; lng: number };
  zoomLevel?: number;
  mapCenter?: { lat: number; lng: number };
}

export function useLocationModuleTracking(propertyId: string) {
  const { user } = useAuth();

  const trackEvent = useCallback(async (
    eventType: LocationEventType,
    options?: {
      anchorType?: AnchorType;
      travelMode?: TravelMode;
      customPlaceType?: CustomPlaceType;
      metadata?: LocationEventMetadata;
    }
  ) => {
    try {
      await supabase.from('location_module_events').insert([{
        session_id: getSessionId(),
        user_id: user?.id || null,
        property_id: propertyId,
        event_type: eventType,
        anchor_type: options?.anchorType || null,
        travel_mode: options?.travelMode || null,
        custom_place_type: options?.customPlaceType || null,
        metadata: options?.metadata as any || null,
      }]);
    } catch (error) {
      console.debug('Location module tracking error:', error);
    }
  }, [propertyId, user]);

  const trackModuleOpen = useCallback(() => {
    trackEvent('module_open');
  }, [trackEvent]);

  const trackAnchorClick = useCallback((anchorType: AnchorType, anchorName: string) => {
    trackEvent('anchor_click', { 
      anchorType, 
      metadata: { anchorName } 
    });
  }, [trackEvent]);

  const trackNearbyPlaceExpand = useCallback((placeName: string) => {
    trackEvent('nearby_place_expand', { 
      metadata: { placeName } 
    });
  }, [trackEvent]);

  const trackCustomPlaceAdd = useCallback((placeType: CustomPlaceType, placeName: string) => {
    trackEvent('custom_place_add', { 
      customPlaceType: placeType,
      metadata: { placeName } 
    });
  }, [trackEvent]);

  const trackTravelModeToggle = useCallback((mode: TravelMode) => {
    trackEvent('travel_mode_toggle', { travelMode: mode });
  }, [trackEvent]);

  const trackRouteClick = useCallback((travelMode: TravelMode, destinationName: string, travelTimeMinutes: number) => {
    trackEvent('route_click', { 
      travelMode,
      metadata: { 
        placeName: destinationName,
        travelTimeMinutes 
      } 
    });
  }, [trackEvent]);

  const trackSearchAreaClick = useCallback((mapCenter: { lat: number; lng: number }, zoomLevel: number) => {
    trackEvent('search_area_click', { 
      metadata: { mapCenter, zoomLevel } 
    });
  }, [trackEvent]);

  const trackMapInteraction = useCallback((zoomLevel: number, mapCenter: { lat: number; lng: number }) => {
    trackEvent('map_interaction', { 
      metadata: { zoomLevel, mapCenter } 
    });
  }, [trackEvent]);

  return {
    trackModuleOpen,
    trackAnchorClick,
    trackNearbyPlaceExpand,
    trackCustomPlaceAdd,
    trackTravelModeToggle,
    trackRouteClick,
    trackSearchAreaClick,
    trackMapInteraction,
  };
}
