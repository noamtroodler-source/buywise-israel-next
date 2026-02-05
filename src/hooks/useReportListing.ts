import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ReportType = 
  | 'sold' 
  | 'rented' 
  | 'price_wrong' 
  | 'photos_wrong' 
  | 'info_outdated' 
  | 'scam' 
  | 'other';

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  sold: 'Already sold',
  rented: 'Already rented',
  price_wrong: 'Price is incorrect',
  photos_wrong: 'Photos don\'t match',
  info_outdated: 'Information is outdated',
  scam: 'Possible scam/fraud',
  other: 'Other issue',
};

interface ReportListingParams {
  propertyId?: string;
  projectId?: string;
  reportType: ReportType;
  description?: string;
  email?: string;
}

export function useReportListing() {
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async ({ propertyId, projectId, reportType, description, email }: ReportListingParams) => {
      const { error } = await supabase
        .from('listing_reports')
        .insert({
          property_id: propertyId || null,
          project_id: projectId || null,
          user_id: user?.id || null,
          email: user ? null : email,
          report_type: reportType,
          description: description || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Thanks for reporting! We\'ll review this listing.');
    },
    onError: (error) => {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    },
  });

  return {
    submitReport: mutation.mutate,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
