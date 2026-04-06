import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

interface TrackOutboundOptions {
  propertyId?: string | null;
  source: string;
  sourceUrl: string;
  page?: 'card' | 'detail';
}

/**
 * Tracks outbound clicks to source platforms (Yad2, Madlan, agency websites).
 * Logs to outbound_clicks table then opens the URL in a new tab.
 *
 * Usage:
 *   const { trackOutbound } = useOutboundTracking();
 *   trackOutbound({ propertyId, source: 'yad2', sourceUrl, page: 'detail' });
 */
export function useOutboundTracking() {
  const { user } = useAuth();

  const trackOutbound = useCallback(
    ({ propertyId, source, sourceUrl, page = 'detail' }: TrackOutboundOptions) => {
      // Fire-and-forget — never block navigation on tracking
      supabase
        .from('outbound_clicks')
        .insert({
          property_id: propertyId ?? null,
          source,
          source_url: sourceUrl,
          user_id: user?.id ?? null,
          session_id: getSessionId(),
          page,
        })
        .then(() => {/* ignore result */});

      window.open(sourceUrl, '_blank', 'noopener,noreferrer');
    },
    [user?.id]
  );

  return { trackOutbound };
}
