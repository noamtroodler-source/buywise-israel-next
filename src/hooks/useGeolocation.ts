 import { useState, useCallback } from 'react';
 
 interface GeolocationState {
   coordinates: { lat: number; lng: number } | null;
   isLoading: boolean;
   error: string | null;
 }
 
 interface UseGeolocationReturn extends GeolocationState {
   getLocation: () => void;
   isSupported: boolean;
 }
 
 export function useGeolocation(): UseGeolocationReturn {
   const [state, setState] = useState<GeolocationState>({
     coordinates: null,
     isLoading: false,
     error: null,
   });
 
   const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;
 
   const getLocation = useCallback(() => {
     if (!isSupported) {
       setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
       return;
     }
 
     setState({ coordinates: null, isLoading: true, error: null });
 
     navigator.geolocation.getCurrentPosition(
       (position) => {
         setState({
           coordinates: {
             lat: position.coords.latitude,
             lng: position.coords.longitude,
           },
           isLoading: false,
           error: null,
         });
       },
       (error) => {
         let errorMessage = 'Failed to get location';
         switch (error.code) {
           case error.PERMISSION_DENIED:
             errorMessage = 'Location access denied';
             break;
           case error.POSITION_UNAVAILABLE:
             errorMessage = 'Location unavailable';
             break;
           case error.TIMEOUT:
             errorMessage = 'Location request timed out';
             break;
         }
         setState({
           coordinates: null,
           isLoading: false,
           error: errorMessage,
         });
       },
       {
         enableHighAccuracy: false,
         timeout: 10000,
         maximumAge: 300000, // 5 minutes cache
       }
     );
   }, [isSupported]);
 
   return {
     ...state,
     getLocation,
     isSupported,
   };
 }