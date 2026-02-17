import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tag, Check } from 'lucide-react';

interface PromoCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  applied?: boolean;
}

export function PromoCodeInput({ value, onChange, applied }: PromoCodeInputProps) {
  const [open, setOpen] = useState(!!value);

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
    <div className="flex items-center gap-2 max-w-sm">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          className="pl-9 h-10 rounded-xl uppercase"
          disabled={applied}
        />
      </div>
      {applied && (
        <span className="inline-flex items-center gap-1 text-sm text-primary font-medium">
          <Check className="h-4 w-4" />
          Applied
        </span>
      )}
    </div>
  );
}
