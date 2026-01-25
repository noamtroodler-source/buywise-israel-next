import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { safeSessionGet, safeSessionSet, safeSessionRemove } from '@/utils/sessionStorage';

const GUEST_FAVORITES_KEY = 'buywise_guest_favorites';
const GUEST_PROJECT_FAVORITES_KEY = 'buywise_guest_project_favorites';

interface GuestFavorite {
  property_id: string;
  price?: number;
}

interface FavoritesContextType {
  // Property favorites
  guestFavorites: GuestFavorite[];
  setGuestFavorites: React.Dispatch<React.SetStateAction<GuestFavorite[]>>;
  // Project favorites
  guestProjectFavoriteIds: string[];
  setGuestProjectFavoriteIds: React.Dispatch<React.SetStateAction<string[]>>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  // Initialize from sessionStorage
  const [guestFavorites, setGuestFavorites] = useState<GuestFavorite[]>(() => 
    safeSessionGet<GuestFavorite[]>(GUEST_FAVORITES_KEY, [])
  );
  
  const [guestProjectFavoriteIds, setGuestProjectFavoriteIds] = useState<string[]>(() =>
    safeSessionGet<string[]>(GUEST_PROJECT_FAVORITES_KEY, [])
  );
  
  // Sync property favorites to sessionStorage
  useEffect(() => {
    if (guestFavorites.length > 0) {
      safeSessionSet(GUEST_FAVORITES_KEY, guestFavorites);
    } else {
      safeSessionRemove(GUEST_FAVORITES_KEY);
    }
  }, [guestFavorites]);
  
  // Sync project favorites to sessionStorage
  useEffect(() => {
    if (guestProjectFavoriteIds.length > 0) {
      safeSessionSet(GUEST_PROJECT_FAVORITES_KEY, guestProjectFavoriteIds);
    } else {
      safeSessionRemove(GUEST_PROJECT_FAVORITES_KEY);
    }
  }, [guestProjectFavoriteIds]);
  
  return (
    <FavoritesContext.Provider value={{ 
      guestFavorites, 
      setGuestFavorites,
      guestProjectFavoriteIds,
      setGuestProjectFavoriteIds
    }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}
