import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to track property views in the database.
 * Tracks once per property per session to avoid duplicate counts.
 */
export function usePropertyViewTracking(propertyId: string | undefined) {
  const { user } = useAuth();
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!propertyId) return;
    
    // Don't track the same property twice in this session
    if (trackedRef.current.has(propertyId)) return;

    const trackView = async () => {
      try {
        // Get or create session ID for anonymous tracking
        let sessionId = sessionStorage.getItem('bw_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('bw_session_id', sessionId);
        }

        await supabase.from('property_views').insert({
          property_id: propertyId,
          viewer_user_id: user?.id || null,
          session_id: sessionId,
        });

        trackedRef.current.add(propertyId);
      } catch (error) {
        // Silently fail - view tracking shouldn't break the page
        console.error('Failed to track property view:', error);
      }
    };

    trackView();
  }, [propertyId, user?.id]);
}
