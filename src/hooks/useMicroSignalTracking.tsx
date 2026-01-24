import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const SESSION_KEY = 'analytics_session_id';

function getSessionId(): string {
  return sessionStorage.getItem(SESSION_KEY) || 'unknown';
}

type SignalType = 
  | 'copy_price'
  | 'copy_phone'
  | 'copy_address'
  | 'image_view'
  | 'gallery_open'
  | 'gallery_close'
  | 'floorplan_view'
  | 'mortgage_calc_launch'
  | 'cost_calc_launch'
  | 'compare_add'
  | 'compare_remove'
  | 'share_click'
  | 'save_click'
  | 'contact_form_open'
  | 'whatsapp_click'
  | 'phone_click';

interface GalleryState {
  openedAt: number;
  imagesViewed: Set<number>;
}

export function useMicroSignalTracking(entityType: 'property' | 'project', entityId: string) {
  const { user } = useAuth();
  const galleryStateRef = useRef<GalleryState | null>(null);

  const trackSignal = useCallback(async (signalType: SignalType, signalData?: Record<string, any>) => {
    try {
      await supabase.from('listing_micro_signals').insert({
        session_id: getSessionId(),
        user_id: user?.id || null,
        entity_type: entityType,
        entity_id: entityId,
        signal_type: signalType,
        signal_data: signalData || null,
      });
    } catch (error) {
      console.debug('Micro signal tracking error:', error);
    }
  }, [entityType, entityId, user]);

  // Copy events
  const trackCopyPrice = useCallback(() => {
    trackSignal('copy_price', { copied_value: 'price' });
  }, [trackSignal]);

  const trackCopyPhone = useCallback(() => {
    trackSignal('copy_phone', { copied_value: 'phone' });
  }, [trackSignal]);

  const trackCopyAddress = useCallback(() => {
    trackSignal('copy_address', { copied_value: 'address' });
  }, [trackSignal]);

  // Gallery events
  const trackGalleryOpen = useCallback(() => {
    galleryStateRef.current = {
      openedAt: Date.now(),
      imagesViewed: new Set([0]), // First image always viewed
    };
    trackSignal('gallery_open');
  }, [trackSignal]);

  const trackImageView = useCallback((imageIndex: number) => {
    if (galleryStateRef.current) {
      galleryStateRef.current.imagesViewed.add(imageIndex);
    }
    trackSignal('image_view', { image_index: imageIndex });
  }, [trackSignal]);

  const trackGalleryClose = useCallback(() => {
    if (galleryStateRef.current) {
      const timeInGalleryMs = Date.now() - galleryStateRef.current.openedAt;
      const imagesViewed = galleryStateRef.current.imagesViewed.size;
      
      trackSignal('gallery_close', {
        images_viewed: imagesViewed,
        time_in_gallery_ms: timeInGalleryMs,
      });
      
      galleryStateRef.current = null;
    }
  }, [trackSignal]);

  // Other signals
  const trackFloorplanView = useCallback(() => {
    trackSignal('floorplan_view');
  }, [trackSignal]);

  const trackMortgageCalcLaunch = useCallback(() => {
    trackSignal('mortgage_calc_launch');
  }, [trackSignal]);

  const trackCostCalcLaunch = useCallback(() => {
    trackSignal('cost_calc_launch');
  }, [trackSignal]);

  const trackCompareAdd = useCallback(() => {
    trackSignal('compare_add');
  }, [trackSignal]);

  const trackCompareRemove = useCallback(() => {
    trackSignal('compare_remove');
  }, [trackSignal]);

  const trackShareClick = useCallback((shareMethod?: string) => {
    trackSignal('share_click', { method: shareMethod });
  }, [trackSignal]);

  const trackSaveClick = useCallback((saved: boolean) => {
    trackSignal('save_click', { saved });
  }, [trackSignal]);

  const trackContactFormOpen = useCallback(() => {
    trackSignal('contact_form_open');
  }, [trackSignal]);

  const trackWhatsAppClick = useCallback(() => {
    trackSignal('whatsapp_click');
  }, [trackSignal]);

  const trackPhoneClick = useCallback(() => {
    trackSignal('phone_click');
  }, [trackSignal]);

  return {
    trackCopyPrice,
    trackCopyPhone,
    trackCopyAddress,
    trackGalleryOpen,
    trackImageView,
    trackGalleryClose,
    trackFloorplanView,
    trackMortgageCalcLaunch,
    trackCostCalcLaunch,
    trackCompareAdd,
    trackCompareRemove,
    trackShareClick,
    trackSaveClick,
    trackContactFormOpen,
    trackWhatsAppClick,
    trackPhoneClick,
  };
}
