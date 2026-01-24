import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LocationModuleMetrics {
  totalEvents: number;
  uniqueProperties: number;
  avgEventsPerProperty: number;
}

interface EventTypeBreakdown {
  eventType: string;
  count: number;
  percentage: number;
}

interface AnchorTypePerformance {
  anchorType: string;
  clicks: number;
  percentage: number;
}

interface TravelModeUsage {
  mode: string;
  toggles: number;
  percentage: number;
}

interface CustomPlaceTypes {
  placeType: string;
  additions: number;
  percentage: number;
}

export function useLocationModuleAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['location-module-analytics', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const { data: events, error } = await supabase
        .from('location_module_events')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const data = events || [];
      const uniqueProperties = new Set(data.map(e => e.property_id)).size;

      const metrics: LocationModuleMetrics = {
        totalEvents: data.length,
        uniqueProperties,
        avgEventsPerProperty: uniqueProperties > 0 ? data.length / uniqueProperties : 0,
      };

      // Event type breakdown
      const eventTypes = ['module_open', 'anchor_click', 'nearby_place_expand', 'custom_place_add', 'travel_mode_toggle', 'route_click', 'search_area_click'];
      const eventTypeBreakdown: EventTypeBreakdown[] = eventTypes.map(type => {
        const count = data.filter(e => e.event_type === type).length;
        return {
          eventType: type,
          count,
          percentage: data.length > 0 ? (count / data.length) * 100 : 0,
        };
      }).filter(e => e.count > 0);

      // Anchor type performance
      const anchorClicks = data.filter(e => e.event_type === 'anchor_click');
      const anchorTypes = ['orientation', 'daily', 'mobility', 'other'];
      const anchorTypePerformance: AnchorTypePerformance[] = anchorTypes.map(type => {
        const clicks = anchorClicks.filter(e => e.anchor_type === type).length;
        return {
          anchorType: type,
          clicks,
          percentage: anchorClicks.length > 0 ? (clicks / anchorClicks.length) * 100 : 0,
        };
      }).filter(a => a.clicks > 0);

      // Travel mode usage
      const travelModeEvents = data.filter(e => e.event_type === 'travel_mode_toggle');
      const travelModes = ['walk', 'drive', 'transit'];
      const travelModeUsage: TravelModeUsage[] = travelModes.map(mode => {
        const toggles = travelModeEvents.filter(e => e.travel_mode === mode).length;
        return {
          mode,
          toggles,
          percentage: travelModeEvents.length > 0 ? (toggles / travelModeEvents.length) * 100 : 0,
        };
      }).filter(t => t.toggles > 0);

      // Custom place types
      const customPlaceEvents = data.filter(e => e.event_type === 'custom_place_add');
      const placeTypes = ['school', 'work', 'family', 'other'];
      const customPlaceTypes: CustomPlaceTypes[] = placeTypes.map(type => {
        const additions = customPlaceEvents.filter(e => e.custom_place_type === type).length;
        return {
          placeType: type,
          additions,
          percentage: customPlaceEvents.length > 0 ? (additions / customPlaceEvents.length) * 100 : 0,
        };
      }).filter(c => c.additions > 0);

      return {
        metrics,
        eventTypeBreakdown,
        anchorTypePerformance,
        travelModeUsage,
        customPlaceTypes,
      };
    },
    staleTime: 60000,
  });
}
