import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

export interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  isDirty: boolean;
  error: string | null;
}

interface UseAutoSaveOptions<T> {
  data: T;
  storageKey: string;
  onSave?: () => Promise<void>;
  autoSaveInterval?: number; // in milliseconds, 0 to disable
  debounceMs?: number;
  useSessionKey?: boolean; // If true, generates unique key per session
}

// Generate a unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAutoSave<T>({
  data,
  storageKey,
  onSave,
  autoSaveInterval = 30000, // 30 seconds default
  debounceMs = 500,
  useSessionKey = true, // Default to session-unique keys
}: UseAutoSaveOptions<T>) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSavedAt: null,
    isDirty: false,
    error: null,
  });

  // Generate or reuse session ID for this wizard instance
  const sessionIdRef = useRef<string>(generateSessionId());
  
  // Compute the actual storage key (session-unique if enabled)
  const actualStorageKey = useMemo(() => {
    if (useSessionKey) {
      return `${storageKey}-${sessionIdRef.current}`;
    }
    return storageKey;
  }, [storageKey, useSessionKey]);

  const initialDataRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string | null>(null);

  // Debounced save to localStorage
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const currentData = JSON.stringify(data);
      
      // Check if data has changed from last saved
      if (currentData !== lastSavedDataRef.current) {
        try {
          const saveData = {
            data,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(actualStorageKey, JSON.stringify(saveData));
          lastSavedDataRef.current = currentData;
          setState(prev => ({
            ...prev,
            lastSavedAt: new Date(),
            isDirty: false,
          }));
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }
    }, debounceMs);

    // Mark as dirty when data changes
    const currentData = JSON.stringify(data);
    if (lastSavedDataRef.current && currentData !== lastSavedDataRef.current) {
      setState(prev => ({ ...prev, isDirty: true }));
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, actualStorageKey, debounceMs]);

  // Auto-save to database at intervals
  useEffect(() => {
    if (!onSave || autoSaveInterval <= 0) return;

    autoSaveTimerRef.current = setInterval(async () => {
      const currentData = JSON.stringify(data);
      if (state.isDirty && currentData !== initialDataRef.current) {
        await saveToDatabase();
      }
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [onSave, autoSaveInterval, state.isDirty, data]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty]);

  const saveToDatabase = useCallback(async () => {
    if (!onSave || state.isSaving) return;

    setState(prev => ({ ...prev, isSaving: true, error: null }));
    try {
      await onSave();
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSavedAt: new Date(),
        isDirty: false,
      }));
      initialDataRef.current = JSON.stringify(data);
    } catch (e) {
      setState(prev => ({
        ...prev,
        isSaving: false,
        error: 'Failed to save',
      }));
    }
  }, [onSave, state.isSaving, data]);

  const clearSavedData = useCallback(() => {
    localStorage.removeItem(actualStorageKey);
    lastSavedDataRef.current = null;
    initialDataRef.current = null;
    setState({
      isSaving: false,
      lastSavedAt: null,
      isDirty: false,
      error: null,
    });
  }, [actualStorageKey]);

  const getSavedData = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(actualStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data || null;
      }
    } catch (e) {
      console.error('Error getting saved data:', e);
    }
    return null;
  }, [actualStorageKey]);

  const hasSavedData = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(actualStorageKey);
      return !!saved;
    } catch {
      return false;
    }
  }, [actualStorageKey]);

  return {
    ...state,
    saveToDatabase,
    clearSavedData,
    getSavedData,
    hasSavedData,
  };
}
