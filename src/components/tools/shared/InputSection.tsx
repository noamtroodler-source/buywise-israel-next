import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { FormattedNumberInput } from '@/components/ui/formatted-number-input';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface InputSectionProps {
  label: string;
  value?: string | number;
  helperText?: string;
  tooltip?: string;
  children: ReactNode;
  className?: string;
}

export function InputSection({
  label,
  value,
  helperText,
  tooltip,
  children,
  className,
}: InputSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Label className="text-sm font-medium text-foreground">{label}</Label>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {value !== undefined && (
          <span className="text-sm font-semibold text-foreground">{value}</span>
        )}
      </div>
      {children}
      {helperText && (
        <p className="text-xs text-primary">{helperText}</p>
      )}
    </div>
  );
}

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  label: string;
  helperText?: string;
  tooltip?: string;
  className?: string;
}

export function SliderInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue,
  label,
  helperText,
  tooltip,
  className,
}: SliderInputProps) {
  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <InputSection
      label={label}
      value={displayValue}
      helperText={helperText}
      tooltip={tooltip}
      className={className}
    >
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </InputSection>
  );
}

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  helperText?: string;
  tooltip?: string;
  className?: string;
  /** When true, displays with comma formatting (e.g., 1,000,000) */
  formatWithCommas?: boolean;
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  placeholder,
  prefix,
  suffix,
  helperText,
  tooltip,
  className,
  formatWithCommas = false,
}: NumberInputProps) {
  return (
    <InputSection
      label={label}
      helperText={helperText}
      tooltip={tooltip}
      className={className}
    >
      {formatWithCommas ? (
        <FormattedNumberInput
          value={value || undefined}
          onChange={(v) => onChange(v ?? 0)}
          placeholder={placeholder}
          prefix={prefix}
          suffix={suffix}
        />
      ) : (
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {prefix}
            </span>
          )}
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            placeholder={placeholder}
            className={cn(prefix && "pl-8", suffix && "pr-12")}
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
      )}
    </InputSection>
  );
}
