import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormattedNumberInputProps extends Omit<React.ComponentProps<"input">, "onChange" | "value" | "type"> {
  value: number | undefined | null;
  onChange: (value: number | undefined) => void;
  /** Optional currency symbol prefix (e.g., "₪" or "$") */
  prefix?: string;
  /** Optional suffix (e.g., "m²") */
  suffix?: string;
}

export function FormattedNumberInput({
  value,
  onChange,
  prefix,
  suffix,
  className,
  ...props
}: FormattedNumberInputProps) {
  const formatWithCommas = (val: number | undefined | null): string => {
    if (val === undefined || val === null) return '';
    if (val === 0) return '';
    return val.toLocaleString('en-US');
  };

  const parseCommaNumber = (str: string): number | undefined => {
    const cleaned = str.replace(/,/g, '');
    if (cleaned === '') return undefined;
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? undefined : num;
  };

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {prefix}
        </span>
      )}
      <Input
        type="text"
        inputMode="numeric"
        value={formatWithCommas(value)}
        onChange={(e) => onChange(parseCommaNumber(e.target.value))}
        className={cn(
          prefix && "pl-8",
          suffix && "pr-12",
          className
        )}
        {...props}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
