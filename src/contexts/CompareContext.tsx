import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CompareContextType {
  compareIds: string[];
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
  maxItems: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 3;
const STORAGE_KEY = 'property-compare';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const addToCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) return prev;
      return [...prev, id];
    });
  };

  const removeFromCompare = (id: string) => {
    setCompareIds(prev => prev.filter(item => item !== id));
  };

  const isInCompare = (id: string) => compareIds.includes(id);

  const clearCompare = () => setCompareIds([]);

  return (
    <CompareContext.Provider value={{
      compareIds,
      addToCompare,
      removeFromCompare,
      isInCompare,
      clearCompare,
      maxItems: MAX_COMPARE_ITEMS,
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
