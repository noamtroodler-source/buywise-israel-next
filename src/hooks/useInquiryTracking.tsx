import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type InquiryType = 'whatsapp' | 'call' | 'email' | 'form';

interface TrackInquiryParams {
  propertyId: string;
  agentId: string;
  inquiryType: InquiryType;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

/**
 * Hook to track property inquiries (WhatsApp clicks, calls, emails, form submissions)
 */
export function useInquiryTracking() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: TrackInquiryParams) => {
      const { data, error } = await supabase
        .from('property_inquiries')
        .insert({
          property_id: params.propertyId,
          agent_id: params.agentId,
          inquiry_type: params.inquiryType,
          user_id: user?.id || null,
          name: params.name || null,
          email: params.email || null,
          phone: params.phone || null,
          message: params.message || null,
        });

      if (error) throw error;
      return data;
    },
    // Silent tracking - don't show errors to users
    onError: (error) => {
      console.error('Failed to track inquiry:', error);
    },
  });
}

/**
 * Simple function to track an inquiry without needing the full hook
 * Useful for quick tracking in event handlers
 */
export async function trackInquiry(params: TrackInquiryParams & { userId?: string }) {
  try {
    await supabase
      .from('property_inquiries')
      .insert({
        property_id: params.propertyId,
        agent_id: params.agentId,
        inquiry_type: params.inquiryType,
        user_id: params.userId || null,
        name: params.name || null,
        email: params.email || null,
        phone: params.phone || null,
        message: params.message || null,
      });
  } catch (error) {
    console.error('Failed to track inquiry:', error);
  }
}
