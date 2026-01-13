import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfessionalFee {
  id: string;
  fee_type: string;
  hebrew_name: string | null;
  rate_min_percent: number | null;
  rate_max_percent: number | null;
  flat_fee_min: number | null;
  flat_fee_max: number | null;
  includes_vat: boolean | null;
  applies_to: string[] | null;
  notes: string | null;
}

export function useProfessionalFees(purchaseType?: 'new_construction' | 'resale') {
  return useQuery({
    queryKey: ['professional-fees', purchaseType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('professional_fees')
        .select('*');

      if (error) throw error;

      let fees = data as ProfessionalFee[];
      
      if (purchaseType) {
        fees = fees.filter(fee => 
          !fee.applies_to || fee.applies_to.includes(purchaseType)
        );
      }

      return fees;
    },
  });
}

export function calculateFeeAmount(fee: ProfessionalFee, price: number): { min: number; max: number } {
  const vatMultiplier = fee.includes_vat ? 1 : 1.18; // VAT 18% as of Jan 2025
  
  if (fee.rate_min_percent !== null) {
    return {
      min: Math.round(price * (fee.rate_min_percent / 100) * vatMultiplier),
      max: Math.round(price * ((fee.rate_max_percent || fee.rate_min_percent) / 100) * vatMultiplier),
    };
  }
  
  return {
    min: Math.round((fee.flat_fee_min || 0) * vatMultiplier),
    max: Math.round((fee.flat_fee_max || fee.flat_fee_min || 0) * vatMultiplier),
  };
}
