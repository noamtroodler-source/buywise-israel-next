import { useState, useEffect, useCallback } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SliderWithInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  formatDisplay?: (value: number) => string;
  parseInput?: (input: string) => number;
  prefix?: string;
  suffix?: string;
  inputClassName?: string;
  className?: string;
}

export function SliderWithInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  formatDisplay,
  parseInput,
  prefix,
  suffix,
  inputClassName,
  className,
}: SliderWithInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format number with commas
  const formatNumber = useCallback((num: number) => {
    return num.toLocaleString('en-US');
  }, []);

  // Parse string to number (remove commas, handle decimals)
  const parseNumber = useCallback((str: string): number => {
    if (parseInput) return parseInput(str);
    const cleaned = str.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? min : parsed;
  }, [parseInput, min]);

  // Update input display when value changes externally
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatDisplay ? formatDisplay(value) : formatNumber(value));
    }
  }, [value, isFocused, formatDisplay, formatNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    const parsed = parseNumber(inputValue);
    const clamped = Math.min(Math.max(parsed, min), max);
    // Round to nearest step
    const stepped = Math.round(clamped / step) * step;
    onChange(stepped);
    setInputValue(formatDisplay ? formatDisplay(stepped) : formatNumber(stepped));
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    // Show raw number for editing
    setInputValue(value.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-1">
        {prefix && <span className="text-sm text-muted-foreground">{prefix}</span>}
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          className={cn(
            "text-right font-bold text-lg h-9 px-2",
            inputClassName
          )}
        />
        {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatDisplay ? formatDisplay(min) : formatNumber(min)}</span>
        <span>{formatDisplay ? formatDisplay(max) : formatNumber(max)}</span>
      </div>
    </div>
  );
}

// Specialized component for down payment with both % and ₪ inputs
interface DownPaymentSliderProps {
  percent: number;
  propertyPrice: number;
  onPercentChange: (percent: number) => void;
  minPercent: number;
  maxPercent?: number;
  formatCurrency: (value: number) => string;
}

export function DownPaymentSlider({
  percent,
  propertyPrice,
  onPercentChange,
  minPercent,
  maxPercent = 80,
  formatCurrency,
}: DownPaymentSliderProps) {
  const [percentInput, setPercentInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [focusedField, setFocusedField] = useState<'percent' | 'amount' | null>(null);

  const amount = Math.round((propertyPrice * percent) / 100);

  // Update displays when not focused
  useEffect(() => {
    if (focusedField !== 'percent') {
      setPercentInput(`${percent}`);
    }
    if (focusedField !== 'amount') {
      setAmountInput(amount.toLocaleString('en-US'));
    }
  }, [percent, amount, focusedField]);

  const handlePercentBlur = () => {
    setFocusedField(null);
    const parsed = parseFloat(percentInput.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, minPercent), maxPercent);
      onPercentChange(Math.round(clamped));
    }
  };

  const handleAmountBlur = () => {
    setFocusedField(null);
    const parsed = parseFloat(amountInput.replace(/[^0-9]/g, ''));
    if (!isNaN(parsed) && propertyPrice > 0) {
      const newPercent = Math.round((parsed / propertyPrice) * 100);
      const clamped = Math.min(Math.max(newPercent, minPercent), maxPercent);
      onPercentChange(clamped);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Percentage Input */}
        <div className="flex items-center gap-1 flex-1">
          <Input
            type="text"
            value={percentInput}
            onChange={(e) => setPercentInput(e.target.value)}
            onFocus={() => setFocusedField('percent')}
            onBlur={handlePercentBlur}
            onKeyDown={handleKeyDown}
            className="text-right font-bold text-lg h-9 px-2 w-20"
          />
          <span className="text-sm font-medium text-muted-foreground">%</span>
        </div>
        
        <span className="text-muted-foreground">=</span>
        
        {/* Amount Input */}
        <div className="flex items-center gap-1 flex-1">
          <span className="text-sm font-medium text-muted-foreground">₪</span>
          <Input
            type="text"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            onFocus={() => setFocusedField('amount')}
            onBlur={handleAmountBlur}
            onKeyDown={handleKeyDown}
            className="text-right font-bold text-lg h-9 px-2"
          />
        </div>
      </div>
      
      <Slider
        value={[percent]}
        onValueChange={([v]) => onPercentChange(v)}
        min={minPercent}
        max={maxPercent}
        step={1}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{minPercent}% (min)</span>
        <span>{maxPercent}%</span>
      </div>
    </div>
  );
}

// Specialized component for interest rate with decimal precision
interface InterestRateSliderProps {
  rate: number;
  onChange: (rate: number) => void;
  min?: number;
  max?: number;
}

export function InterestRateSlider({
  rate,
  onChange,
  min = 3,
  max = 8,
}: InterestRateSliderProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setInputValue(rate.toFixed(1));
    }
  }, [rate, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) {
      const clamped = Math.min(Math.max(parsed, min), max);
      // Round to nearest 0.1
      const rounded = Math.round(clamped * 10) / 10;
      onChange(rounded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-1">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="text-right font-bold text-lg h-9 px-2 w-20"
        />
        <span className="text-sm font-medium text-muted-foreground">%</span>
      </div>
      
      <Slider
        value={[rate]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={0.1}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min}%</span>
        <span>{max}%</span>
      </div>
    </div>
  );
}
