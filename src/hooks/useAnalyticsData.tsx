import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, startOfDay } from 'date-fns';

// ==========================================
// USER BEHAVIOR ANALYTICS
// ==========================================

export interface SessionMetrics {
  totalSessions: number;
  avgPagesPerSession: number;
  avgSessionDuration: number;
  bounceRate: number;
}

export interface PageViewData {
  path: string;
  views: number;
  uniqueSessions: number;
}

export interface DeviceBreakdown {
  device: string;
  count: number;
  percentage: number;
}

export interface HourlyActivity {
  hour: number;
  events: number;
}

export function useUserBehaviorMetrics(days: number = 30) {
  return useQuery({
    queryKey: ['admin-user-behavior', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);

      // Get all events for the period
      const { data: events, error } = await supabase
        .from('user_events')
        .select('session_id, page_path, device_type, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculate session metrics
      const sessionMap = new Map<string, { pages: Set<string>; firstEvent: Date; lastEvent: Date }>();
      
      (events || []).forEach(event => {
        const existing = sessionMap.get(event.session_id);
        const eventTime = new Date(event.created_at);
        
        if (existing) {
          existing.pages.add(event.page_path);
          if (eventTime < existing.firstEvent) existing.firstEvent = eventTime;
          if (eventTime > existing.lastEvent) existing.lastEvent = eventTime;
        } else {
          sessionMap.set(event.session_id, {
            pages: new Set([event.page_path]),
            firstEvent: eventTime,
            lastEvent: eventTime,
          });
        }
      });

      const sessions = Array.from(sessionMap.values());
      const totalSessions = sessions.length;
      const avgPagesPerSession = totalSessions > 0 
        ? sessions.reduce((sum, s) => sum + s.pages.size, 0) / totalSessions 
        : 0;
      const avgSessionDuration = totalSessions > 0
        ? sessions.reduce((sum, s) => sum + (s.lastEvent.getTime() - s.firstEvent.getTime()), 0) / totalSessions / 1000 / 60
        : 0;
      const bounceRate = totalSessions > 0
        ? sessions.filter(s => s.pages.size === 1).length / totalSessions * 100
        : 0;

      // Page views
      const pageViews = new Map<string, { views: number; sessions: Set<string> }>();
      (events || []).forEach(event => {
        const existing = pageViews.get(event.page_path);
        if (existing) {
          existing.views++;
          existing.sessions.add(event.session_id);
        } else {
          pageViews.set(event.page_path, { views: 1, sessions: new Set([event.session_id]) });
        }
      });

      const topPages: PageViewData[] = Array.from(pageViews.entries())
        .map(([path, data]) => ({ path, views: data.views, uniqueSessions: data.sessions.size }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 20);

      // Device breakdown
      const deviceCounts = new Map<string, number>();
      (events || []).forEach(event => {
        const device = event.device_type || 'unknown';
        deviceCounts.set(device, (deviceCounts.get(device) || 0) + 1);
      });

      const totalDeviceEvents = events?.length || 0;
      const devices: DeviceBreakdown[] = Array.from(deviceCounts.entries())
        .map(([device, count]) => ({ 
          device, 
          count, 
          percentage: totalDeviceEvents > 0 ? (count / totalDeviceEvents) * 100 : 0 
        }))
        .sort((a, b) => b.count - a.count);

      // Hourly activity
      const hourlyCounts = new Array(24).fill(0);
      (events || []).forEach(event => {
        const hour = new Date(event.created_at).getHours();
        hourlyCounts[hour]++;
      });

      const hourlyActivity: HourlyActivity[] = hourlyCounts.map((events, hour) => ({ hour, events }));

      return {
        sessionMetrics: {
          totalSessions,
          avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10,
          avgSessionDuration: Math.round(avgSessionDuration * 10) / 10,
          bounceRate: Math.round(bounceRate * 10) / 10,
        } as SessionMetrics,
        topPages,
        devices,
        hourlyActivity,
      };
    },
    refetchInterval: 60000,
  });
}

// ==========================================
// SEARCH INTELLIGENCE
// ==========================================

export interface SearchDemand {
  city: string;
  searchCount: number;
  avgPriceMin: number;
  avgPriceMax: number;
}

export interface PriceRangeDemand {
  range: string;
  count: number;
}

export interface FeatureDemand {
  feature: string;
  count: number;
}

export interface SearchConversion {
  totalSearches: number;
  searchesWithClicks: number;
  searchesWithSaves: number;
  searchesWithInquiries: number;
  clickRate: number;
  saveRate: number;
  inquiryRate: number;
}

export function useSearchIntelligence(days: number = 30) {
  return useQuery({
    queryKey: ['admin-search-intelligence', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);

      const { data: searches, error } = await supabase
        .from('search_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // City demand
      const cityDemand = new Map<string, { count: number; priceMin: number[]; priceMax: number[] }>();
      (searches || []).forEach(search => {
        (search.cities || []).forEach((city: string) => {
          const existing = cityDemand.get(city);
          if (existing) {
            existing.count++;
            if (search.price_min) existing.priceMin.push(Number(search.price_min));
            if (search.price_max) existing.priceMax.push(Number(search.price_max));
          } else {
            cityDemand.set(city, {
              count: 1,
              priceMin: search.price_min ? [Number(search.price_min)] : [],
              priceMax: search.price_max ? [Number(search.price_max)] : [],
            });
          }
        });
      });

      const topCities: SearchDemand[] = Array.from(cityDemand.entries())
        .map(([city, data]) => ({
          city,
          searchCount: data.count,
          avgPriceMin: data.priceMin.length > 0 
            ? Math.round(data.priceMin.reduce((a, b) => a + b, 0) / data.priceMin.length)
            : 0,
          avgPriceMax: data.priceMax.length > 0
            ? Math.round(data.priceMax.reduce((a, b) => a + b, 0) / data.priceMax.length)
            : 0,
        }))
        .sort((a, b) => b.searchCount - a.searchCount)
        .slice(0, 15);

      // Price range demand
      const priceRanges = [
        { label: '< ₪1M', min: 0, max: 1000000 },
        { label: '₪1M - 2M', min: 1000000, max: 2000000 },
        { label: '₪2M - 3M', min: 2000000, max: 3000000 },
        { label: '₪3M - 4M', min: 3000000, max: 4000000 },
        { label: '₪4M - 5M', min: 4000000, max: 5000000 },
        { label: '> ₪5M', min: 5000000, max: Infinity },
      ];

      const priceRangeCounts = priceRanges.map(range => ({
        range: range.label,
        count: (searches || []).filter(s => {
          const min = Number(s.price_min) || 0;
          const max = Number(s.price_max) || Infinity;
          return (min >= range.min && min < range.max) || (max > range.min && max <= range.max);
        }).length,
      }));

      // Feature demand
      const featureCounts = new Map<string, number>();
      (searches || []).forEach(search => {
        (search.features_required || []).forEach((feature: string) => {
          featureCounts.set(feature, (featureCounts.get(feature) || 0) + 1);
        });
      });

      const topFeatures: FeatureDemand[] = Array.from(featureCounts.entries())
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Zero results searches
      const zeroResultSearches = (searches || []).filter(s => s.results_count === 0).length;

      // Conversion metrics
      const totalSearches = searches?.length || 0;
      const searchesWithClicks = (searches || []).filter(s => 
        s.clicked_result_ids && (s.clicked_result_ids as string[]).length > 0
      ).length;
      const searchesWithSaves = (searches || []).filter(s => 
        s.saved_result_ids && (s.saved_result_ids as string[]).length > 0
      ).length;
      const searchesWithInquiries = (searches || []).filter(s => 
        s.inquired_result_ids && (s.inquired_result_ids as string[]).length > 0
      ).length;

      const conversion: SearchConversion = {
        totalSearches,
        searchesWithClicks,
        searchesWithSaves,
        searchesWithInquiries,
        clickRate: totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0,
        saveRate: totalSearches > 0 ? (searchesWithSaves / totalSearches) * 100 : 0,
        inquiryRate: totalSearches > 0 ? (searchesWithInquiries / totalSearches) * 100 : 0,
      };

      return {
        topCities,
        priceRangeDemand: priceRangeCounts,
        topFeatures,
        zeroResultSearches,
        conversion,
      };
    },
    refetchInterval: 60000,
  });
}

// ==========================================
// LISTING INTELLIGENCE
// ==========================================

export interface CityMarketMetrics {
  city: string;
  avgDaysOnMarket: number;
  avgDaysToFirstInquiry: number;
  avgPriceChange: number;
  totalListings: number;
  soldCount: number;
  activeCount: number;
}

export interface PriceDropPattern {
  daysBeforeDrop: number;
  avgDropPercent: number;
  count: number;
}

export function useListingIntelligence(days: number = 90) {
  return useQuery({
    queryKey: ['admin-listing-intelligence', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);

      const { data: lifecycle, error } = await supabase
        .from('listing_lifecycle')
        .select('*')
        .gte('listed_at', startDate.toISOString());

      if (error) throw error;

      // City metrics
      const cityMetrics = new Map<string, {
        daysOnMarket: number[];
        daysToFirstInquiry: number[];
        priceChanges: number[];
        sold: number;
        active: number;
      }>();

      (lifecycle || []).forEach(listing => {
        const existing = cityMetrics.get(listing.city) || {
          daysOnMarket: [],
          daysToFirstInquiry: [],
          priceChanges: [],
          sold: 0,
          active: 0,
        };

        if (listing.days_on_market) existing.daysOnMarket.push(listing.days_on_market);
        if (listing.days_to_first_inquiry) existing.daysToFirstInquiry.push(listing.days_to_first_inquiry);
        if (listing.price_change_percent) existing.priceChanges.push(Number(listing.price_change_percent));
        if (listing.outcome === 'sold' || listing.outcome === 'rented') existing.sold++;
        if (listing.outcome === 'active') existing.active++;

        cityMetrics.set(listing.city, existing);
      });

      const cityData: CityMarketMetrics[] = Array.from(cityMetrics.entries())
        .map(([city, data]) => ({
          city,
          avgDaysOnMarket: data.daysOnMarket.length > 0
            ? Math.round(data.daysOnMarket.reduce((a, b) => a + b, 0) / data.daysOnMarket.length)
            : 0,
          avgDaysToFirstInquiry: data.daysToFirstInquiry.length > 0
            ? Math.round(data.daysToFirstInquiry.reduce((a, b) => a + b, 0) / data.daysToFirstInquiry.length)
            : 0,
          avgPriceChange: data.priceChanges.length > 0
            ? Math.round(data.priceChanges.reduce((a, b) => a + b, 0) / data.priceChanges.length * 10) / 10
            : 0,
          totalListings: data.daysOnMarket.length + data.sold + data.active,
          soldCount: data.sold,
          activeCount: data.active,
        }))
        .sort((a, b) => b.totalListings - a.totalListings)
        .slice(0, 15);

      // Overall metrics
      const allDaysOnMarket = (lifecycle || [])
        .filter(l => l.days_on_market)
        .map(l => l.days_on_market!);
      const allDaysToInquiry = (lifecycle || [])
        .filter(l => l.days_to_first_inquiry)
        .map(l => l.days_to_first_inquiry!);

      const overallMetrics = {
        avgDaysOnMarket: allDaysOnMarket.length > 0
          ? Math.round(allDaysOnMarket.reduce((a, b) => a + b, 0) / allDaysOnMarket.length)
          : 0,
        avgDaysToFirstInquiry: allDaysToInquiry.length > 0
          ? Math.round(allDaysToInquiry.reduce((a, b) => a + b, 0) / allDaysToInquiry.length)
          : 0,
        totalActive: (lifecycle || []).filter(l => l.outcome === 'active').length,
        totalSold: (lifecycle || []).filter(l => l.outcome === 'sold' || l.outcome === 'rented').length,
        avgPriceDrops: (lifecycle || []).filter(l => l.total_price_changes && l.total_price_changes > 0).length,
      };

      return {
        cityData,
        overallMetrics,
      };
    },
    refetchInterval: 60000,
  });
}

// ==========================================
// ADVERTISER ANALYTICS
// ==========================================

export interface AdvertiserMetrics {
  actorId: string;
  actorType: string;
  loginCount: number;
  listingsCreated: number;
  listingsEdited: number;
  inquiriesViewed: number;
  inquiriesResponded: number;
  lastActive: Date | null;
  responseRate: number;
}

export interface ActionBreakdown {
  action: string;
  count: number;
}

export function useAdvertiserAnalytics(days: number = 30) {
  return useQuery({
    queryKey: ['admin-advertiser-analytics', days],
    queryFn: async () => {
      const startDate = subDays(new Date(), days);

      const { data: activity, error } = await supabase
        .from('advertiser_activity')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Per-advertiser metrics
      const advertiserMap = new Map<string, {
        actorType: string;
        logins: number;
        creates: number;
        edits: number;
        inquiryViews: number;
        inquiryResponses: number;
        lastActive: Date;
      }>();

      (activity || []).forEach(act => {
        const key = `${act.actor_type}:${act.actor_id}`;
        const existing = advertiserMap.get(key) || {
          actorType: act.actor_type,
          logins: 0,
          creates: 0,
          edits: 0,
          inquiryViews: 0,
          inquiryResponses: 0,
          lastActive: new Date(0),
        };

        if (act.action_type === 'login') existing.logins++;
        if (act.action_type === 'listing_create') existing.creates++;
        if (act.action_type === 'listing_edit') existing.edits++;
        if (act.action_type === 'inquiry_view') existing.inquiryViews++;
        if (act.action_type === 'inquiry_respond') existing.inquiryResponses++;

        const actDate = new Date(act.created_at);
        if (actDate > existing.lastActive) existing.lastActive = actDate;

        advertiserMap.set(key, existing);
      });

      const topAdvertisers: AdvertiserMetrics[] = Array.from(advertiserMap.entries())
        .map(([key, data]) => ({
          actorId: key.split(':')[1],
          actorType: data.actorType,
          loginCount: data.logins,
          listingsCreated: data.creates,
          listingsEdited: data.edits,
          inquiriesViewed: data.inquiryViews,
          inquiriesResponded: data.inquiryResponses,
          lastActive: data.lastActive,
          responseRate: data.inquiryViews > 0 
            ? Math.round((data.inquiryResponses / data.inquiryViews) * 100) 
            : 0,
        }))
        .sort((a, b) => b.loginCount - a.loginCount)
        .slice(0, 20);

      // Action breakdown
      const actionCounts = new Map<string, number>();
      (activity || []).forEach(act => {
        actionCounts.set(act.action_type, (actionCounts.get(act.action_type) || 0) + 1);
      });

      const actionBreakdown: ActionBreakdown[] = Array.from(actionCounts.entries())
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);

      // Summary stats
      const totalLogins = (activity || []).filter(a => a.action_type === 'login').length;
      const uniqueAdvertisers = advertiserMap.size;
      const totalActions = activity?.length || 0;

      return {
        topAdvertisers,
        actionBreakdown,
        summary: {
          totalLogins,
          uniqueAdvertisers,
          totalActions,
          avgActionsPerAdvertiser: uniqueAdvertisers > 0 
            ? Math.round(totalActions / uniqueAdvertisers) 
            : 0,
        },
      };
    },
    refetchInterval: 60000,
  });
}
