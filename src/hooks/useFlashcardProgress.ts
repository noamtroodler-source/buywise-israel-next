import { useState, useCallback, useMemo } from 'react';
import { safeGetJSON, safeSetJSON } from '@/utils/safeStorage';

const STORAGE_KEY = 'flashcardProgress';

interface FlashcardProgress {
  masteredTermIds: string[];
  lastStudyDate: string | null;
  sessionsCompleted: number;
  currentStreak: number;
}

const DEFAULT_PROGRESS: FlashcardProgress = {
  masteredTermIds: [],
  lastStudyDate: null,
  sessionsCompleted: 0,
  currentStreak: 0,
};

function isValidProgress(data: unknown): data is FlashcardProgress {
  if (typeof data !== 'object' || data === null) return false;
  const p = data as Record<string, unknown>;
  return (
    Array.isArray(p.masteredTermIds) &&
    (p.lastStudyDate === null || typeof p.lastStudyDate === 'string') &&
    typeof p.sessionsCompleted === 'number' &&
    typeof p.currentStreak === 'number'
  );
}

export function useFlashcardProgress() {
  const [progress, setProgress] = useState<FlashcardProgress>(() => 
    safeGetJSON(STORAGE_KEY, DEFAULT_PROGRESS, isValidProgress)
  );

  const masteredSet = useMemo(() => new Set(progress.masteredTermIds), [progress.masteredTermIds]);

  const markMastered = useCallback((termId: string) => {
    setProgress(prev => {
      if (prev.masteredTermIds.includes(termId)) return prev;
      const updated = {
        ...prev,
        masteredTermIds: [...prev.masteredTermIds, termId],
      };
      safeSetJSON(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const unmarkMastered = useCallback((termId: string) => {
    setProgress(prev => {
      if (!prev.masteredTermIds.includes(termId)) return prev;
      const updated = {
        ...prev,
        masteredTermIds: prev.masteredTermIds.filter(id => id !== termId),
      };
      safeSetJSON(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const completeSession = useCallback(() => {
    setProgress(prev => {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = prev.lastStudyDate;
      
      // Check if continuing a streak (studied yesterday or today)
      let newStreak = 1;
      if (lastDate) {
        const lastStudy = new Date(lastDate);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastStudy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
          // Same day, keep streak
          newStreak = prev.currentStreak;
        } else if (diffDays === 1) {
          // Consecutive day, increment streak
          newStreak = prev.currentStreak + 1;
        }
        // else: streak resets to 1
      }

      const updated = {
        ...prev,
        lastStudyDate: today,
        sessionsCompleted: prev.sessionsCompleted + 1,
        currentStreak: newStreak,
      };
      safeSetJSON(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(DEFAULT_PROGRESS);
    safeSetJSON(STORAGE_KEY, DEFAULT_PROGRESS);
  }, []);

  const isMastered = useCallback((termId: string) => masteredSet.has(termId), [masteredSet]);

  return {
    progress,
    masteredSet,
    masteredCount: progress.masteredTermIds.length,
    markMastered,
    unmarkMastered,
    completeSession,
    resetProgress,
    isMastered,
  };
}
