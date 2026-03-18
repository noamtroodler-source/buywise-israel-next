import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useJsApiLoader, Libraries } from '@react-google-maps/api';

const libraries: Libraries = ['places', 'drawing'];

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: undefined,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [authFailed, setAuthFailed] = useState(false);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries,
    preventGoogleFontsLoading: !apiKey,
  });

  // Google Maps fires this global callback when API key auth fails at runtime
  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps auth failure detected');
      setAuthFailed(true);
    };
    return () => {
      delete (window as any).gm_authFailure;
    };
  }, []);

  const contextValue: GoogleMapsContextType = !apiKey
    ? { isLoaded: false, loadError: new Error('Google Maps API key not configured') }
    : authFailed
    ? { isLoaded: false, loadError: new Error('Google Maps authentication failed') }
    : { isLoaded, loadError };

  return (
    <GoogleMapsContext.Provider value={contextValue}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
