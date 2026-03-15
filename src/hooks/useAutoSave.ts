import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

export interface AutoSaveState {
  isSaving: boolean;
  lastSavedAt: Date | null;
  isDirty: boolean;
  error: string | null;
}

interface SavePayload<T, M = Record<string, unknown>> {
  data: T;
  metadata?: M;
  savedAt: string;
}

interface UseAutoSaveOptions<T, M = Record<string, unknown>> {
  data: T;
  storageKey: string;
  onSave?: () => Promise<void>;
  autoSaveInterval?: number;
  debounceMs?: number;
  useSessionKey?: boolean;
  metadata?: M;
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function useAutoSave<T, M = Record<string, unknown>>({
  data,
  storageKey,
  onSave,
  autoSaveInterval = 30000,
  debounceMs = 500,
  useSessionKey = false,
  metadata,
}: UseAutoSaveOptions<T, M>) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSavedAt: null,
    isDirty: false,
    error: null,
  });

  const sessionIdRef = useRef<string>(generateSessionId());

  const actualStorageKey = useMemo(() => {
    if (useSessionKey) {
      return `${storageKey}-${sessionIdRef.current}`;
    }
    return storageKey;
  }, [storageKey, useSessionKey]);

  // Track initial data at mount to determine real dirty state
  const initialDataRef = useRef<string>(JSON.stringify(data));
  const mountedRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<string | null>(null);

  // After first render, start tracking changes
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // Debounced save to localStorage + dirty tracking against initial data
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const currentData = JSON.stringify(data);

    // Mark dirty if data differs from initial mount data
    if (mountedRef.current && currentData !== initialDataRef.current) {
      setState(prev => prev.isDirty ? prev : { ...prev, isDirty: true });
    }

    debounceTimerRef.current = setTimeout(() => {
      if (currentData !== lastSavedDataRef.current) {
        try {
          const saveData: SavePayload<T, M> = {
            data,
            metadata,
            savedAt: new Date().toISOString(),
          };
          localStorage.setItem(actualStorageKey, JSON.stringify(saveData));
          lastSavedDataRef.current = currentData;
          setState(prev => ({
            ...prev,
            lastSavedAt: new Date(),
          }));
        } catch (e) {
          console.error('Error saving to localStorage:', e);
        }
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, metadata, actualStorageKey, debounceMs]);

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

  // Unsaved changes warning — fires when data differs from initial
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
    initialDataRef.current = JSON.stringify(data);
    setState({
      isSaving: false,
      lastSavedAt: null,
      isDirty: false,
      error: null,
    });
  }, [actualStorageKey, data]);

  const getSavedData = useCallback((): SavePayload<T, M> | null => {
    try {
      const saved = localStorage.getItem(actualStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as SavePayload<T, M>;
        if (parsed.data) return parsed;
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
