import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, X, Home, Zap, Sparkles } from 'lucide-react';
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

  if (!sub || (!sub.isFoundingAgency && !isFoundingMember) || dismissed) {
    return null;
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-primary/20 bg-card shadow-sm p-5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Star className="h-4 w-4 text-primary fill-primary/20" />
        </div>
        <div>
          <h3 className="flex items-center gap-1.5 font-bold text-foreground text-sm leading-tight">
            You're a Founding Partner
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </h3>
          <p className="text-xs text-muted-foreground">
            Your exclusive launch partner benefits are active
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="h-3 w-3" /> Free founding agency access
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Home className="h-3 w-3" /> 3 free featured listings/mo
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Zap className="h-3 w-3" /> Exclusive early access
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
          <Sparkles className="h-3 w-3" /> Featured case study
        </span>
      </div>
    </div>
  );
}
