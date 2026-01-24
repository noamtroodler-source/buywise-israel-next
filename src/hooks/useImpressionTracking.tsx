import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

function generateFilterHash(filters: Record<string, any>): string {
  const sorted = JSON.stringify(filters, Object.keys(filters).sort());
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

interface ImpressionData {
  entityType: 'property' | 'project';
  entityId: string;
  searchId?: string;
  position: number;
  pageNumber: number;
  sortOption?: string;
  filters?: Record<string, any>;
  wasPromoted?: boolean;
  promotionType?: string;
  cardVariant?: string;
}

interface TrackedImpression {
  entityId: string;
  enteredAt: number;
  exitedAt?: number;
  visible: boolean;
}

export function useImpressionTracking() {
  const { user } = useAuth();
  const impressionsRef = useRef<Map<string, TrackedImpression>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const pendingFlushRef = useRef<ImpressionData[]>([]);

  // Batch flush impressions every 5 seconds
  useEffect(() => {
    const flushInterval = setInterval(() => {
      flushImpressions();
    }, 5000);

    return () => clearInterval(flushInterval);
  }, []);

  // Flush on page unload
  useEffect(() => {
    const handleUnload = () => {
      flushImpressions();
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const flushImpressions = useCallback(async () => {
    if (pendingFlushRef.current.length === 0) return;

    const toFlush = [...pendingFlushRef.current];
    pendingFlushRef.current = [];

    const sessionId = getSessionId();

    try {
      const records = toFlush.map(imp => ({
        entity_type: imp.entityType,
        entity_id: imp.entityId,
        search_id: imp.searchId || null,
        session_id: sessionId,
        user_id: user?.id || null,
        position_in_results: imp.position,
        page_number: imp.pageNumber,
        sort_option: imp.sortOption || null,
        filter_hash: imp.filters ? generateFilterHash(imp.filters) : null,
        viewport_visible: true,
        time_visible_ms: impressionsRef.current.get(imp.entityId)?.exitedAt 
          ? (impressionsRef.current.get(imp.entityId)!.exitedAt! - impressionsRef.current.get(imp.entityId)!.enteredAt)
          : null,
        was_promoted: imp.wasPromoted || false,
        promotion_type: imp.promotionType || null,
        card_variant: imp.cardVariant || null,
      }));

      await supabase.from('listing_impressions').insert(records);
    } catch (error) {
      console.debug('Impression tracking error:', error);
    }
  }, [user]);

  const trackImpression = useCallback((data: ImpressionData) => {
    const existing = impressionsRef.current.get(data.entityId);
    
    if (!existing) {
      impressionsRef.current.set(data.entityId, {
        entityId: data.entityId,
        enteredAt: Date.now(),
        visible: true,
      });
      pendingFlushRef.current.push(data);
    }
  }, []);

  const trackVisibilityChange = useCallback((entityId: string, isVisible: boolean) => {
    const impression = impressionsRef.current.get(entityId);
    if (impression) {
      if (!isVisible && impression.visible) {
        impression.exitedAt = Date.now();
        impression.visible = false;
      } else if (isVisible && !impression.visible) {
        impression.enteredAt = Date.now();
        impression.visible = true;
      }
    }
  }, []);

  const createObserver = useCallback((
    searchId: string | undefined,
    pageNumber: number,
    sortOption: string | undefined,
    filters: Record<string, any> | undefined,
    getPositionForElement: (element: Element) => number,
    getEntityForElement: (element: Element) => { type: 'property' | 'project'; id: string } | null
  ) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const entity = getEntityForElement(entry.target);
          if (!entity) return;

          if (entry.isIntersecting) {
            trackImpression({
              entityType: entity.type,
              entityId: entity.id,
              searchId,
              position: getPositionForElement(entry.target),
              pageNumber,
              sortOption,
              filters,
            });
          }
          
          trackVisibilityChange(entity.id, entry.isIntersecting);
        });
      },
      {
        threshold: 0.5, // 50% visible
        rootMargin: '0px',
      }
    );

    return observerRef.current;
  }, [trackImpression, trackVisibilityChange]);

  const observeElement = useCallback((element: Element) => {
    observerRef.current?.observe(element);
  }, []);

  const unobserveElement = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
  }, []);

  const clearImpressions = useCallback(() => {
    impressionsRef.current.clear();
    pendingFlushRef.current = [];
  }, []);

  return {
    trackImpression,
    trackVisibilityChange,
    createObserver,
    observeElement,
    unobserveElement,
    clearImpressions,
    flushImpressions,
  };
}
