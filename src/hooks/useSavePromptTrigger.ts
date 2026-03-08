import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface UseSavePromptTriggerOptions {
  /** Minimum number of distinct field changes before triggering */
  minChanges?: number;
  /** Milliseconds of inactivity after last change before showing prompt */
  idleMs?: number;
}

/**
 * Reusable hook for triggering the "Save Results" prompt.
 * Shows the prompt only when:
 *  - User is NOT logged in
 *  - User has made ≥ minChanges distinct field changes
 *  - User has been idle for idleMs after the last change
 */
export function useSavePromptTrigger({
  minChanges = 2,
  idleMs = 5000,
}: UseSavePromptTriggerOptions = {}) {
  const { user } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const changeCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const trackChange = useCallback(() => {
    if (user || firedRef.current) return;

    changeCountRef.current += 1;
    clearTimer();

    if (changeCountRef.current >= minChanges) {
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        setShowPrompt(true);
      }, idleMs);
    }
  }, [user, minChanges, idleMs, clearTimer]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    firedRef.current = true;
    clearTimer();
  }, [clearTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Hide prompt if user logs in
  useEffect(() => {
    if (user) {
      setShowPrompt(false);
      clearTimer();
    }
  }, [user, clearTimer]);

  return { showPrompt, dismissPrompt, trackChange };
}
