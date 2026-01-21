import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

export type CompareCategory = 'buy' | 'rent' | 'projects';

interface CompareContextType {
  compareIds: string[];
  compareCategory: CompareCategory | null;
  addToCompare: (id: string, category: CompareCategory) => void;
  removeFromCompare: (id: string) => void;
  isInCompare: (id: string) => boolean;
  clearCompare: () => void;
  maxItems: number;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 3;
const STORAGE_KEY = 'property-compare';
const CATEGORY_STORAGE_KEY = 'property-compare-category';

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [compareCategory, setCompareCategory] = useState<CompareCategory | null>(() => {
    try {
      const stored = localStorage.getItem(CATEGORY_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as CompareCategory) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  useEffect(() => {
    localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(compareCategory));
  }, [compareCategory]);

  const addToCompare = (id: string, category: CompareCategory) => {
    // Check if mixing categories
    if (compareCategory && compareCategory !== category && compareIds.length > 0) {
      toast.error(`You can only compare items from the same category. Clear current selection first.`);
      return;
    }

    setCompareIds(prev => {
      if (prev.includes(id)) return prev;
      if (prev.length >= MAX_COMPARE_ITEMS) {
        toast.error(`You can compare up to ${MAX_COMPARE_ITEMS} items`);
        return prev;
      }
      return [...prev, id];
    });
    
    // Set category if first item
    if (compareIds.length === 0 || !compareCategory) {
      setCompareCategory(category);
    }
  };

  const removeFromCompare = (id: string) => {
    setCompareIds(prev => {
      const newIds = prev.filter(item => item !== id);
      // Clear category if no items left
      if (newIds.length === 0) {
        setCompareCategory(null);
      }
      return newIds;
    });
  };

  const isInCompare = (id: string) => compareIds.includes(id);

  const clearCompare = () => {
    setCompareIds([]);
    setCompareCategory(null);
  };

  return (
    <CompareContext.Provider value={{
      compareIds,
      compareCategory,
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
