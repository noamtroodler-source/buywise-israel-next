import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

/**
 * Hook to track project inquiries (WhatsApp clicks, calls, emails, form submissions)
 */
export function useProjectInquiryTracking() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: TrackProjectInquiryParams) => {
      const { data, error } = await supabase
        .from('project_inquiries')
        .insert({
          project_id: params.projectId,
          developer_id: params.developerId,
          user_id: user?.id || null,
          name: params.name || 'Website Visitor',
          email: params.email || 'not-provided@placeholder.com',
          phone: params.phone || null,
          message: params.message || `${params.inquiryType} inquiry from website`,
          budget_range: params.budgetRange || null,
          preferred_unit_type: params.preferredUnitType || null,
        });

      if (error) throw error;

      // Send notification to developer (async, don't wait)
      sendProjectInquiryNotification(params);

      return data;
    },
    // Silent tracking - don't show errors to users
    onError: (error) => {
      console.error('Failed to track project inquiry:', error);
    },
  });
}

/**
 * Simple function to track a project inquiry without needing the full hook
 * Useful for quick tracking in event handlers
 */
export async function trackProjectInquiry(params: TrackProjectInquiryParams & { userId?: string }) {
  try {
    await supabase
      .from('project_inquiries')
      .insert({
        project_id: params.projectId,
        developer_id: params.developerId,
        user_id: params.userId || null,
        name: params.name || 'Website Visitor',
        email: params.email || 'not-provided@placeholder.com',
        phone: params.phone || null,
        message: params.message || `${params.inquiryType} inquiry from website`,
        budget_range: params.budgetRange || null,
        preferred_unit_type: params.preferredUnitType || null,
      });

    // Send notification to developer (async, don't wait)
    sendProjectInquiryNotification(params);
  } catch (error) {
    console.error('Failed to track project inquiry:', error);
  }
}
