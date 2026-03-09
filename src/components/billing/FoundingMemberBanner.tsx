import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, X, Clock, Home, Zap, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSubscription } from '@/hooks/useSubscription';

function useIsFoundingMember(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ['founding-member', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return false;
      const { data } = await supabase
        .from('subscription_promo_redemptions')
        .select('id, promo_codes(code)')
        .eq('subscription_id', subscriptionId)
        .maybeSingle();
      const code = (data?.promo_codes as any)?.code;
      return code === 'FOUNDING2026';
    },
    enabled: !!subscriptionId,
    staleTime: 10 * 60 * 1000,
  });
}

export function FoundingMemberBanner() {
  const { data: sub } = useSubscription();
  const { data: isFoundingMember } = useIsFoundingMember(sub?.id || undefined);

  const dismissKey = `founding_banner_dismissed_${sub?.id}`;
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(dismissKey);
  });

  const handleDismiss = () => {
    localStorage.setItem(dismissKey, '1');
    setDismissed(true);
  };

  if (!sub || sub.status !== 'trialing' || !isFoundingMember || dismissed) {
    return null;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-amber-200/60 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-800/40 p-5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-amber-600/60 hover:text-amber-700 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
          <Star className="h-4 w-4 text-amber-600 fill-amber-500" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900 dark:text-amber-200 text-sm leading-tight">
            You're a Founding Partner 🎉
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Your exclusive launch partner benefits are active
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
          <Clock className="h-3 w-3" /> 60-day free trial
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
          <Home className="h-3 w-3" /> 3 free featured listings/mo
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
          <Zap className="h-3 w-3" /> Exclusive early access
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
          <Sparkles className="h-3 w-3" /> Featured case study
        </span>
      </div>
    </div>
  );
}
