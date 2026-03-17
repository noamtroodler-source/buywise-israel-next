import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BuyerContextSnapshot } from '@/components/shared/InquiryModal';

export type ProjectInquiryType = 'whatsapp' | 'email' | 'form';

interface TrackProjectInquiryParams {
  projectId: string;
  developerId: string;
  inquiryType: ProjectInquiryType;
  projectName?: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  budgetRange?: string;
  preferredUnitType?: string;
  buyerContextSnapshot?: BuyerContextSnapshot | null;
  sessionId?: string;
}

async function sendProjectInquiryNotification(params: TrackProjectInquiryParams) {
  try {
    await supabase.functions.invoke('send-notification', {
      body: {
        type: 'new_project_inquiry',
        developerId: params.developerId,
        projectId: params.projectId,
        projectName: params.projectName || 'Your project',
        inquiryType: params.inquiryType,
        inquirerName: params.name,
        inquirerEmail: params.email,
      },
    });
  } catch (error) {
    console.error('Failed to send project inquiry notification:', error);
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
 * Hook to track project inquiries with buyer context and dedupe
 */
export function useProjectInquiryTracking() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: TrackProjectInquiryParams) => {
      const sessionId = getSessionId();

      // Dedupe check
      const { data: isDupe } = await supabase.rpc('check_project_inquiry_dedupe', {
        p_user_id: user?.id || null,
        p_project_id: params.projectId,
        p_inquiry_type: params.inquiryType,
        p_session_id: !user ? sessionId : null,
      });

      if (isDupe) {
        console.debug('Duplicate project inquiry suppressed');
        return null;
      }

      const insertData = {
        project_id: params.projectId,
        developer_id: params.developerId,
        user_id: user?.id || null,
        name: params.name || 'Website Visitor',
        email: params.email || 'not-provided@placeholder.com',
        phone: params.phone || null,
        message: params.message || `${params.inquiryType} inquiry from website`,
        budget_range: params.budgetRange || null,
        preferred_unit_type: params.preferredUnitType || null,
        buyer_context_snapshot: (params.buyerContextSnapshot || null) as any,
        session_id: !user ? sessionId : null,
      };

      const { data, error } = await supabase
        .from('project_inquiries')
        .insert(insertData as any);

      if (error) throw error;

      sendProjectInquiryNotification(params);
      return data;
    },
    onError: (error) => {
      console.error('Failed to track project inquiry:', error);
    },
  });
}

/**
 * Simple function to track a project inquiry without needing the full hook
 */
export async function trackProjectInquiry(params: TrackProjectInquiryParams & { userId?: string }) {
  try {
    const sessionId = getSessionId();

    const { data: isDupe } = await supabase.rpc('check_project_inquiry_dedupe', {
      p_user_id: params.userId || null,
      p_project_id: params.projectId,
      p_inquiry_type: params.inquiryType,
      p_session_id: !params.userId ? sessionId : null,
    });

    if (isDupe) {
      console.debug('Duplicate project inquiry suppressed');
      return;
    }

    const insertData = {
      project_id: params.projectId,
      developer_id: params.developerId,
      user_id: params.userId || null,
      name: params.name || 'Website Visitor',
      email: params.email || 'not-provided@placeholder.com',
      phone: params.phone || null,
      message: params.message || `${params.inquiryType} inquiry from website`,
      budget_range: params.budgetRange || null,
      preferred_unit_type: params.preferredUnitType || null,
      buyer_context_snapshot: (params.buyerContextSnapshot || null) as any,
      session_id: !params.userId ? sessionId : null,
    };

    await supabase
      .from('project_inquiries')
      .insert(insertData as any);

    sendProjectInquiryNotification(params);
  } catch (error) {
    console.error('Failed to track project inquiry:', error);
  }
}
