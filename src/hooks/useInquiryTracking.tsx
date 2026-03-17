import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BuyerContextSnapshot } from '@/components/shared/InquiryModal';

export type InquiryType = 'whatsapp' | 'email' | 'form';

interface TrackInquiryParams {
  propertyId: string;
  agentId: string;
  inquiryType: InquiryType;
  propertyTitle?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  buyerContextSnapshot?: BuyerContextSnapshot | null;
  sessionId?: string;
}

async function sendInquiryNotification(params: TrackInquiryParams) {
  try {
    await supabase.functions.invoke('send-notification', {
      body: {
        type: 'new_inquiry',
        agentId: params.agentId,
        propertyId: params.propertyId,
        propertyTitle: params.propertyTitle || 'Your property',
        inquiryType: params.inquiryType,
        inquirerName: params.name,
        inquirerEmail: params.email,
      },
    });
  } catch (error) {
    console.error('Failed to send inquiry notification:', error);
  }
}

function getSessionId(): string {
  const key = 'analytics_session_id';
  let sid = sessionStorage.getItem(key);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(key, sid);
  }
  return sid;
}

/**
 * Hook to track property inquiries with buyer context and dedupe
 */
export function useInquiryTracking() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: TrackInquiryParams) => {
      const sessionId = getSessionId();

      // Dedupe: check if same inquiry in last 24hrs
      const { data: isDupe } = await supabase.rpc('check_inquiry_dedupe', {
        p_user_id: user?.id || null,
        p_property_id: params.propertyId,
        p_inquiry_type: params.inquiryType,
        p_session_id: !user ? sessionId : null,
      });

      if (isDupe) {
        console.debug('Duplicate inquiry suppressed');
        return null;
      }

      const insertData = {
        property_id: params.propertyId,
        agent_id: params.agentId,
        inquiry_type: params.inquiryType,
        user_id: user?.id || null,
        name: params.name || null,
        email: params.email || null,
        phone: params.phone || null,
        message: params.message || null,
        buyer_context_snapshot: (params.buyerContextSnapshot || null) as any,
        session_id: !user ? sessionId : null,
      };

      const { data, error } = await supabase
        .from('property_inquiries')
        .insert(insertData as any);

      if (error) throw error;

      // Send notification to agent (async, don't wait)
      sendInquiryNotification(params);

      return data;
    },
    onError: (error) => {
      console.error('Failed to track inquiry:', error);
    },
  });
}

/**
 * Simple function to track an inquiry without needing the full hook
 */
export async function trackInquiry(params: TrackInquiryParams & { userId?: string }) {
  try {
    const sessionId = getSessionId();

    // Dedupe check
    const { data: isDupe } = await supabase.rpc('check_inquiry_dedupe', {
      p_user_id: params.userId || null,
      p_property_id: params.propertyId,
      p_inquiry_type: params.inquiryType,
      p_session_id: !params.userId ? sessionId : null,
    });

    if (isDupe) {
      console.debug('Duplicate inquiry suppressed');
      return;
    }

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
        buyer_context_snapshot: params.buyerContextSnapshot || null,
        session_id: !params.userId ? sessionId : null,
      });

    // Send notification to agent (async, don't wait)
    sendInquiryNotification(params);
  } catch (error) {
    console.error('Failed to track inquiry:', error);
  }
}
