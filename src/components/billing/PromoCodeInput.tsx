import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Tag, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PromoValidation {
  valid: boolean;
  summary?: string;
  promoId?: string;
  trialDays?: number;
}

interface PromoCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  onValidated?: (result: PromoValidation | null) => void;
}

export function PromoCodeInput({ value, onChange, onValidated }: PromoCodeInputProps) {
  const [open, setOpen] = useState(!!value);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<PromoValidation | null>(null);

  const validate = useCallback(async (code: string) => {
    if (!code.trim()) {
      setResult(null);
      onValidated?.(null);
      return;
    }

    setValidating(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('id, description, trial_days, discount_percent, discount_duration_months, credit_schedule, is_active, valid_from, valid_until')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) {
        const r: PromoValidation = { valid: false };
        setResult(r);
        onValidated?.(r);
        return;
      }

      const now = new Date();
      const validFrom = data.valid_from ? new Date(data.valid_from) : null;
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;

      if ((validFrom && now < validFrom) || (validUntil && now > validUntil)) {
        const r: PromoValidation = { valid: false };
        setResult(r);
        onValidated?.(r);
        return;
      }

      // Build summary
      const parts: string[] = [];
      if (data.trial_days) parts.push(`${data.trial_days}-day free trial`);
      if (data.discount_percent) parts.push(`${data.discount_percent}% off for ${data.discount_duration_months} months`);
      if (data.credit_schedule) parts.push('monthly credits');

      const r: PromoValidation = {
        valid: true,
        summary: parts.join(' + ') || data.description || 'Promo applied',
        promoId: data.id,
        trialDays: data.trial_days ?? 0,
      };
      setResult(r);
      onValidated?.(r);
    } catch {
      const r: PromoValidation = { valid: false };
      setResult(r);
      onValidated?.(r);
    } finally {
      setValidating(false);
    }
  }, [onValidated]);

  if (!open && !value) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <Tag className="h-3.5 w-3.5" />
        Have a promo code?
      </button>
    );
  }

  return (
    <div className="space-y-1.5 max-w-sm">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => {
              const v = e.target.value.toUpperCase();
              onChange(v);
              if (result) {
                setResult(null);
                onValidated?.(null);
              }
            }}
            onBlur={() => validate(value)}
            placeholder="Enter promo code"
            className="pl-9 h-10 rounded-xl uppercase"
          />
        </div>
        {validating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        {!validating && result?.valid && <Check className="h-4 w-4 text-primary" />}
        {!validating && result && !result.valid && <X className="h-4 w-4 text-destructive" />}
      </div>
      {!validating && result?.valid && result.summary && (
        <p className="text-xs text-primary font-medium pl-1">{result.summary}</p>
      )}
      {!validating && result && !result.valid && (
        <p className="text-xs text-destructive pl-1">Invalid or expired code</p>
      )}
    </div>
  );
}
