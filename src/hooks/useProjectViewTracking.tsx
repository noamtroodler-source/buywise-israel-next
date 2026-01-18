import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook to track project views in the database.
 * Tracks once per project per session to avoid duplicate counts.
 */
export function useProjectViewTracking(projectId: string | undefined) {
  const { user } = useAuth();
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!projectId) return;
    
    // Don't track the same project twice in this session
    if (trackedRef.current.has(projectId)) return;

    const trackView = async () => {
      try {
        // Get or create session ID for anonymous tracking
        let sessionId = sessionStorage.getItem('bw_session_id');
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem('bw_session_id', sessionId);
        }

        await supabase.from('project_views').insert({
          project_id: projectId,
          viewer_id: user?.id || null,
          session_id: sessionId,
        });

        trackedRef.current.add(projectId);
      } catch (error) {
        // Silently fail - view tracking shouldn't break the page
        console.error('Failed to track project view:', error);
      }
    };

    trackView();
  }, [projectId, user?.id]);
}
