import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Input } from "@/components/ui/input";
interface PriceRangeSliderProps {
  minValue: number | undefined;
  maxValue: number | undefined;
  /** Preferred: single callback that updates both values at once (prevents stale-props overwrites) */
  onRangeChange?: (min: number | undefined, max: number | undefined) => void;
  /** Legacy callbacks (still supported) */
  onMinChange?: (value: number | undefined) => void;
  onMaxChange?: (value: number | undefined) => void;
  /** Base bounds in ILS - will be converted for display if currency is USD */
  baseMin?: number;
  baseMax?: number;
  baseStep?: number;
  /** Current display currency */
  currency?: 'ILS' | 'USD';
  /** Exchange rate (ILS per USD) */
  exchangeRate?: number;
  minLabel?: string;
  maxLabel?: string;
}

// Round to a "nice" number for display
const roundToNice = (value: number, preferredStep: number): number => {
  return Math.round(value / preferredStep) * preferredStep;
};

// Get nice step for USD based on the max value
const getNiceUsdStep = (usdMax: number): number => {
  if (usdMax <= 5000) return 50;
  if (usdMax <= 20000) return 100;
  if (usdMax <= 100000) return 500;
  if (usdMax <= 500000) return 1000;
  if (usdMax <= 2000000) return 5000;
  return 10000;
};

// Get nice max for USD (round up to nice number)
const getNiceUsdMax = (rawUsdMax: number): number => {
  if (rawUsdMax <= 5000) return Math.ceil(rawUsdMax / 500) * 500;
  if (rawUsdMax <= 20000) return Math.ceil(rawUsdMax / 1000) * 1000;
  if (rawUsdMax <= 100000) return Math.ceil(rawUsdMax / 5000) * 5000;
  if (rawUsdMax <= 500000) return Math.ceil(rawUsdMax / 10000) * 10000;
  if (rawUsdMax <= 2000000) return Math.ceil(rawUsdMax / 50000) * 50000;
  return Math.ceil(rawUsdMax / 100000) * 100000;
};

const formatWithCommas = (value: number | undefined): string => {
  if (value === undefined || value === null) return '';
  return value.toLocaleString('en-US');
};

const parseCommaNumber = (value: string): number | undefined => {
  const cleaned = value.replace(/,/g, '');
  if (cleaned === '') return undefined;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? undefined : num;
};

const formatShortLabel = (value: number, symbol: string): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${symbol}${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${symbol}${thousands % 1 === 0 ? thousands : thousands.toFixed(0)}K`;
  }
  return `${symbol}${value}`;
};

export function PriceRangeSlider({
  minValue,
  maxValue,
  onRangeChange,
  onMinChange,
  onMaxChange,
  baseMin = 0,
  baseMax = 10000000,
  baseStep = 50000,
  currency = 'ILS',
  exchangeRate = 3.65,
  minLabel,
  maxLabel,
}: PriceRangeSliderProps) {
  const isUsd = currency === 'USD';
  const symbol = isUsd ? '$' : '₪';
  
  // Compute display bounds based on currency
  const displayMin = isUsd ? Math.round(baseMin / exchangeRate) : baseMin;
  const rawDisplayMax = isUsd ? baseMax / exchangeRate : baseMax;
  const displayMax = isUsd ? getNiceUsdMax(rawDisplayMax) : baseMax;
  const displayStep = isUsd ? getNiceUsdStep(displayMax) : baseStep;
  
  // Convert stored ILS values to display values
  const toDisplayValue = (ilsValue: number | undefined): number | undefined => {
    if (ilsValue === undefined) return undefined;
    if (isUsd) return Math.round(ilsValue / exchangeRate);
    return ilsValue;
  };
  
  // Convert display values back to ILS for storage
  const toBaseValue = (displayValue: number | undefined): number | undefined => {
    if (displayValue === undefined) return undefined;
    if (isUsd) return Math.round(displayValue * exchangeRate);
    return displayValue;
  };
  
  // Get display values for slider and inputs
  const displayMinValue = toDisplayValue(minValue);
  const displayMaxValue = toDisplayValue(maxValue);
  
  // Clamp values for slider (prevent weird states)
  const safeDisplayMin = displayMinValue ?? displayMin;
  const safeDisplayMax = displayMaxValue ?? displayMax;
  
  const sliderValues: [number, number] = [
    Math.min(safeDisplayMin, safeDisplayMax),
    Math.max(safeDisplayMin, safeDisplayMax)
  ];

  const emitRange = React.useCallback(
    (nextMin: number | undefined, nextMax: number | undefined) => {
      if (onRangeChange) {
        onRangeChange(nextMin, nextMax);
        return;
      }
      onMinChange?.(nextMin);
      onMaxChange?.(nextMax);
    },
    [onRangeChange, onMinChange, onMaxChange]
  );

  const handleSliderChange = (values: number[]) => {
    // Convert display values back to base (ILS) for storage
    const newMinBase = values[0] === displayMin ? undefined : toBaseValue(values[0]);
    const newMaxBase = values[1] === displayMax ? undefined : toBaseValue(values[1]);
    emitRange(newMinBase, newMaxBase);
  };
  
  const handleMinInputChange = (displayValue: number | undefined) => {
    const nextMinBase = toBaseValue(displayValue);
    emitRange(nextMinBase, maxValue);
  };
  
  const handleMaxInputChange = (displayValue: number | undefined) => {
    const nextMaxBase = toBaseValue(displayValue);
    emitRange(minValue, nextMaxBase);
  };

  const defaultMinLabel = minLabel ?? formatShortLabel(displayMin, symbol);
  const defaultMaxLabel = maxLabel ?? `${formatShortLabel(displayMax, symbol)}+`;

  return (
    <div className="space-y-4">
      {/* Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{defaultMinLabel}</span>
          <span>{defaultMaxLabel}</span>
        </div>
        {/* Added px-3 for horizontal padding so thumbs at edges are fully clickable */}
        <div className="px-3">
          <SliderPrimitive.Root
            className="relative flex w-full touch-none select-none items-center h-6 py-1"
            value={sliderValues}
            onValueChange={handleSliderChange}
            min={displayMin}
            max={displayMax}
            step={displayStep}
            minStepsBetweenThumbs={1}
          >
            <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
              <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            {/* Min thumb - higher z-index so it's always grabbable */}
            <SliderPrimitive.Thumb 
              className="relative block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:border-primary/80 hover:scale-110 z-20 focus:z-30 after:content-[''] after:absolute after:-inset-3" 
              aria-label="Minimum price"
            />
            {/* Max thumb */}
            <SliderPrimitive.Thumb 
              className="relative block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:border-primary/80 hover:scale-110 z-10 focus:z-30 after:content-[''] after:absolute after:-inset-3" 
              aria-label="Maximum price"
            />
          </SliderPrimitive.Root>
        </div>
      </div>

      {/* Input boxes */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <Input
            type="text"
            inputMode="numeric"
            placeholder={`Min (${symbol})`}
            value={formatWithCommas(displayMinValue)}
            onChange={(e) => handleMinInputChange(parseCommaNumber(e.target.value))}
            className="rounded-lg"
          />
          <span className="text-xs text-muted-foreground">Min</span>
        </div>
        <div className="flex items-start pt-2.5">
          <span className="text-muted-foreground">–</span>
        </div>
        <div className="flex-1 space-y-1">
          <Input
            type="text"
            inputMode="numeric"
            placeholder={`Max (${symbol})`}
            value={formatWithCommas(displayMaxValue)}
            onChange={(e) => handleMaxInputChange(parseCommaNumber(e.target.value))}
            className="rounded-lg"
          />
          <span className="text-xs text-muted-foreground">Max</span>
        </div>
      </div>
    </div>
  );
}
