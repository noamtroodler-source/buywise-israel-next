import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Insight } from '../components/admin/analytics/shared/ChapterInsightCard';
import type { ChapterSignal } from '../components/admin/analytics/shared/ChapterHeader';

type ChapterType = 'discovery' | 'engagement' | 'conversion' | 'supply' | 'operations';

interface ChapterInsightsResult {
  insights: Insight[];
  signals: ChapterSignal[];
  isLoading: boolean;
}

export function useChapterInsights(chapter: ChapterType, dateRange: number): ChapterInsightsResult {
  // Fetch relevant data for cross-referencing
  const { data: searchData, isLoading: searchLoading } = useQuery({
    queryKey: ['chapter-insights-search', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const { data, error } = await supabase
        .from('search_analytics')
        .select('cities, price_min, price_max, results_count, features_required')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'discovery'
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['chapter-insights-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, city, listing_status, created_at, price')
        .eq('is_published', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'discovery' || chapter === 'supply'
  });

  const { data: engagementData, isLoading: engagementLoading } = useQuery({
    queryKey: ['chapter-insights-engagement', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const { data, error } = await supabase
        .from('page_engagement')
        .select('page_path, scroll_depth_max, active_time_ms, entity_type')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'engagement'
  });

  const { data: toolData, isLoading: toolLoading } = useQuery({
    queryKey: ['chapter-insights-tools', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const { data, error } = await supabase
        .from('tool_runs')
        .select('tool_name, completion_status')
        .gte('started_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'engagement'
  });

  const { data: inquiryData, isLoading: inquiryLoading } = useQuery({
    queryKey: ['chapter-insights-inquiries', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const { data, error } = await supabase
        .from('inquiries')
        .select('id, is_read, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'conversion'
  });

  const { data: journeyData, isLoading: journeyLoading } = useQuery({
    queryKey: ['chapter-insights-journeys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_journeys')
        .select('journey_stage, key_milestones, touchpoint_count');
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'conversion'
  });

  const { data: lifecycleData, isLoading: lifecycleLoading } = useQuery({
    queryKey: ['chapter-insights-lifecycle'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_lifecycle')
        .select('days_on_market, total_price_changes, total_inquiries, outcome, city')
        .is('sold_rented_at', null);
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'supply'
  });

  const { data: errorData, isLoading: errorLoading } = useQuery({
    queryKey: ['chapter-insights-errors', dateRange],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const { data, error } = await supabase
        .from('client_errors')
        .select('id, error_type, page_path')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: chapter === 'operations'
  });

  const result = useMemo(() => {
    const insights: Insight[] = [];
    const signals: ChapterSignal[] = [];

    switch (chapter) {
      case 'discovery': {
        if (searchData && inventoryData) {
          // Calculate city demand vs supply
          const citySearchCounts: Record<string, number> = {};
          const cityInventoryCounts: Record<string, number> = {};
          
          searchData.forEach(search => {
            const cities = search.cities as string[] || [];
            cities.forEach(city => {
              citySearchCounts[city] = (citySearchCounts[city] || 0) + 1;
            });
          });
          
          inventoryData.forEach(prop => {
            if (prop.city) {
              cityInventoryCounts[prop.city] = (cityInventoryCounts[prop.city] || 0) + 1;
            }
          });

          // Find supply gaps
          Object.entries(citySearchCounts).forEach(([city, searches]) => {
            const inventory = cityInventoryCounts[city] || 0;
            if (searches > 20 && inventory < 5) {
              insights.push({
                id: `gap-${city}`,
                message: `${city} has ${searches} searches but only ${inventory} listings - supply gap detected`,
                category: 'action',
                metric: `Demand: ${searches}, Supply: ${inventory}`,
                relatedSection: 'cities'
              });
            }
          });

          // Zero-result searches
          const zeroResults = searchData.filter(s => s.results_count === 0).length;
          const zeroResultRate = searchData.length > 0 ? (zeroResults / searchData.length * 100) : 0;
          
          if (zeroResultRate > 10) {
            signals.push({
              status: 'red',
              label: 'Action',
              message: `${zeroResultRate.toFixed(1)}% zero-result searches`
            });
            insights.push({
              id: 'zero-results',
              message: `${zeroResults} searches returned no results. Review search criteria to identify inventory gaps.`,
              category: 'warning',
              metric: `${zeroResultRate.toFixed(1)}% of all searches`,
              relatedSection: 'search'
            });
          } else if (zeroResultRate > 5) {
            signals.push({
              status: 'yellow',
              label: 'Watch',
              message: `${zeroResultRate.toFixed(1)}% zero-result searches`
            });
          } else {
            signals.push({
              status: 'green',
              label: 'Strong',
              message: 'Search results matching well'
            });
          }

          // Price range analysis
          const priceRanges: Record<string, number> = {};
          searchData.forEach(s => {
            const min = s.price_min || 0;
            const max = s.price_max || 10000000;
            const range = min < 1500000 ? 'Under 1.5M' : 
                         min < 2500000 ? '1.5M-2.5M' : 
                         min < 4000000 ? '2.5M-4M' : 'Over 4M';
            priceRanges[range] = (priceRanges[range] || 0) + 1;
          });
          
          const topRange = Object.entries(priceRanges).sort((a, b) => b[1] - a[1])[0];
          if (topRange && searchData.length > 10) {
            const pct = ((topRange[1] / searchData.length) * 100).toFixed(0);
            insights.push({
              id: 'price-range',
              message: `${pct}% of searches are in the ${topRange[0]} range. Ensure inventory visibility in this bracket.`,
              category: 'opportunity',
              metric: `${topRange[1]} searches`,
              relatedSection: 'price'
            });
          }
        }
        break;
      }

      case 'engagement': {
        if (engagementData && engagementData.length > 0) {
          // Overall scroll depth analysis (since we don't have device_type in page_engagement)
          const avgScrollDepth = engagementData.reduce((a, b) => a + (b.scroll_depth_max || 0), 0) / engagementData.length;
          
          if (avgScrollDepth > 60) {
            signals.push({
              status: 'green',
              label: 'Strong',
              message: `${Math.round(avgScrollDepth)}% avg. scroll depth`
            });
          } else if (avgScrollDepth > 40) {
            signals.push({
              status: 'yellow',
              label: 'Watch',
              message: `${Math.round(avgScrollDepth)}% scroll depth - room for improvement`
            });
          } else {
            signals.push({
              status: 'red',
              label: 'Action',
              message: `${Math.round(avgScrollDepth)}% scroll depth - users leaving early`
            });
            insights.push({
              id: 'low-scroll',
              message: `Users only scroll ${Math.round(avgScrollDepth)}% of pages on average. Consider moving key content higher or improving above-the-fold experience.`,
              category: 'warning',
              metric: `${engagementData.length} sessions analyzed`,
              relatedSection: 'behavior'
            });
          }

          // Time on page analysis
          const avgTimeMs = engagementData.reduce((a, b) => a + (b.active_time_ms || 0), 0) / engagementData.length;
          const avgTimeSec = avgTimeMs / 1000;
          
          if (avgTimeSec > 60) {
            signals.push({
              status: 'green',
              label: 'Strong',
              message: `${avgTimeSec.toFixed(0)}s avg. time on page`
            });
          } else if (avgTimeSec > 30) {
            signals.push({
              status: 'yellow',
              label: 'Watch',
              message: `${avgTimeSec.toFixed(0)}s avg. time - could improve`
            });
          }
        }

        if (toolData && toolData.length > 0) {
          // Tool completion analysis
          const toolGroups: Record<string, { total: number; completed: number }> = {};
          toolData.forEach(t => {
            if (!toolGroups[t.tool_name]) {
              toolGroups[t.tool_name] = { total: 0, completed: 0 };
            }
            toolGroups[t.tool_name].total++;
            if (t.completion_status === 'completed') toolGroups[t.tool_name].completed++;
          });

          Object.entries(toolGroups).forEach(([tool, stats]) => {
            const rate = (stats.completed / stats.total) * 100;
            if (rate < 50 && stats.total > 10) {
              insights.push({
                id: `tool-${tool}`,
                message: `${tool} has ${rate.toFixed(0)}% completion rate. Consider simplifying the flow.`,
                category: 'warning',
                metric: `${stats.completed}/${stats.total} completed`,
                relatedSection: 'tools'
              });
            }
          });
        }
        break;
      }

      case 'conversion': {
        if (journeyData && journeyData.length > 0) {
          const stageCount: Record<string, number> = {};
          journeyData.forEach(j => {
            const stage = j.journey_stage || 'awareness';
            stageCount[stage] = (stageCount[stage] || 0) + 1;
          });

          const actionUsers = stageCount['action'] || 0;
          const totalUsers = journeyData.length;
          const conversionRate = (actionUsers / totalUsers) * 100;

          if (conversionRate > 10) {
            signals.push({
              status: 'green',
              label: 'Strong',
              message: `${conversionRate.toFixed(1)}% reaching action stage`
            });
          } else if (conversionRate > 5) {
            signals.push({
              status: 'yellow',
              label: 'Watch',
              message: `${conversionRate.toFixed(1)}% conversion - room to grow`
            });
          } else {
            signals.push({
              status: 'red',
              label: 'Action',
              message: `${conversionRate.toFixed(1)}% conversion - needs attention`
            });
          }

          // Funnel drop-off analysis
          const awareness = stageCount['awareness'] || 0;
          const consideration = stageCount['consideration'] || 0;
          const decision = stageCount['decision'] || 0;
          
          if (awareness > 0 && consideration / awareness < 0.3) {
            insights.push({
              id: 'funnel-awareness',
              message: 'High drop-off from awareness to consideration. Users may not be finding relevant content.',
              category: 'action',
              metric: `${((consideration / awareness) * 100).toFixed(0)}% progression`,
              relatedSection: 'funnel'
            });
          }
        }

        if (inquiryData && inquiryData.length > 0) {
          // Use is_read to determine pending inquiries
          const unreadInquiries = inquiryData.filter(i => !i.is_read);
          if (unreadInquiries.length > 10) {
            insights.push({
              id: 'pending-inquiries',
              message: `${unreadInquiries.length} inquiries are unread. Fast responses improve conversion.`,
              category: 'action',
              metric: `${unreadInquiries.length} unread`,
              relatedSection: 'inquiries'
            });
          }
        }
        break;
      }

      case 'supply': {
        if (lifecycleData && lifecycleData.length > 0) {
          // Stale listings
          const staleListings = lifecycleData.filter(l => (l.days_on_market || 0) > 90);
          if (staleListings.length > 5) {
            signals.push({
              status: 'red',
              label: 'Action',
              message: `${staleListings.length} listings over 90 days`
            });
            insights.push({
              id: 'stale-listings',
              message: `${staleListings.length} listings have been active for 90+ days. Consider prompting agents to refresh or reduce prices.`,
              category: 'action',
              metric: 'Avg DOM: ' + Math.round(staleListings.reduce((a, b) => a + (b.days_on_market || 0), 0) / staleListings.length) + ' days',
              relatedSection: 'lifecycle'
            });
          } else {
            signals.push({
              status: 'green',
              label: 'Strong',
              message: 'Inventory freshness good'
            });
          }

          // Zero-inquiry listings
          const noInquiries = lifecycleData.filter(l => l.total_inquiries === 0 && (l.days_on_market || 0) > 14);
          if (noInquiries.length > 10) {
            insights.push({
              id: 'no-inquiries',
              message: `${noInquiries.length} listings have zero inquiries after 2+ weeks. Review pricing and presentation.`,
              category: 'warning',
              metric: `${noInquiries.length} listings`,
              relatedSection: 'inventory'
            });
          }

          // Price change patterns
          const withPriceChanges = lifecycleData.filter(l => (l.total_price_changes || 0) > 0);
          if (withPriceChanges.length > 0) {
            const pct = ((withPriceChanges.length / lifecycleData.length) * 100).toFixed(0);
            if (parseInt(pct) > 30) {
              signals.push({
                status: 'yellow',
                label: 'Watch',
                message: `${pct}% of listings had price changes`
              });
            }
          }
        }

        if (inventoryData && inventoryData.length > 0) {
          // City distribution
          const cityCount: Record<string, number> = {};
          inventoryData.forEach(p => {
            if (p.city) {
              cityCount[p.city] = (cityCount[p.city] || 0) + 1;
            }
          });
          
          const topCity = Object.entries(cityCount).sort((a, b) => b[1] - a[1])[0];
          if (topCity) {
            insights.push({
              id: 'top-city',
              message: `${topCity[0]} leads with ${topCity[1]} listings (${((topCity[1] / inventoryData.length) * 100).toFixed(0)}% of inventory).`,
              category: 'opportunity',
              metric: `${Object.keys(cityCount).length} cities total`,
              relatedSection: 'inventory'
            });
          }
        }
        break;
      }

      case 'operations': {
        if (errorData && errorData.length > 0) {
          // Error rate analysis
          const errorsByPage: Record<string, number> = {};
          errorData.forEach(e => {
            const page = e.page_path || 'unknown';
            errorsByPage[page] = (errorsByPage[page] || 0) + 1;
          });

          const worstPage = Object.entries(errorsByPage).sort((a, b) => b[1] - a[1])[0];
          
          if (errorData.length > 50) {
            signals.push({
              status: 'red',
              label: 'Action',
              message: `${errorData.length} errors in period`
            });
            if (worstPage) {
              insights.push({
                id: 'error-hotspot',
                message: `${worstPage[0]} has the most errors (${worstPage[1]}). Investigate and fix.`,
                category: 'action',
                metric: `${errorData.length} total errors`,
                relatedSection: 'performance'
              });
            }
          } else if (errorData.length > 10) {
            signals.push({
              status: 'yellow',
              label: 'Watch',
              message: `${errorData.length} errors logged`
            });
          } else {
            signals.push({
              status: 'green',
              label: 'Strong',
              message: 'Error rate low'
            });
          }
        } else {
          signals.push({
            status: 'green',
            label: 'Strong',
            message: 'No errors detected'
          });
        }

        // Always add a tracking health insight
        insights.push({
          id: 'tracking-health',
          message: 'Review data quality metrics to ensure all tracking is firing correctly.',
          category: 'opportunity',
          relatedSection: 'data-health'
        });
        break;
      }
    }

    return { insights, signals };
  }, [chapter, searchData, inventoryData, engagementData, toolData, inquiryData, journeyData, lifecycleData, errorData]);

  const isLoading = searchLoading || inventoryLoading || engagementLoading || 
                    toolLoading || inquiryLoading || journeyLoading || 
                    lifecycleLoading || errorLoading;

  return {
    insights: result.insights,
    signals: result.signals,
    isLoading
  };
}
