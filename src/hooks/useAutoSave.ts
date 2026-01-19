import { useEffect, useRef, useState, useCallback } from 'react';

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
}

export function useAutoSave<T>({
  data,
  storageKey,
  onSave,
  autoSaveInterval = 30000, // 30 seconds default
  debounceMs = 500,
}: UseAutoSaveOptions<T>) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSavedAt: null,
    isDirty: false,
    error: null,
  });

  const initialDataRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && parsed.savedAt) {
          initialDataRef.current = JSON.stringify(parsed.data);
          setState(prev => ({
            ...prev,
            lastSavedAt: new Date(parsed.savedAt),
          }));
        }
      }
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
  }, [storageKey]);

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
          localStorage.setItem(storageKey, JSON.stringify(saveData));
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
  }, [data, storageKey, debounceMs]);

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
    localStorage.removeItem(storageKey);
    lastSavedDataRef.current = null;
    initialDataRef.current = null;
    setState({
      isSaving: false,
      lastSavedAt: null,
      isDirty: false,
      error: null,
    });
  }, [storageKey]);

  const getSavedData = useCallback((): T | null => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.data || null;
      }
    } catch (e) {
      console.error('Error getting saved data:', e);
    }
    return null;
  }, [storageKey]);

  const hasSavedData = useCallback((): boolean => {
    try {
      const saved = localStorage.getItem(storageKey);
      return !!saved;
    } catch {
      return false;
    }
  }, [storageKey]);

  return {
    ...state,
    saveToDatabase,
    clearSavedData,
    getSavedData,
    hasSavedData,
  };
}
