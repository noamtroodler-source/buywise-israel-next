import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PriceRangeSliderProps {
  minValue: number | undefined;
  maxValue: number | undefined;
  onMinChange: (value: number | undefined) => void;
  onMaxChange: (value: number | undefined) => void;
  sliderMin?: number;
  sliderMax?: number;
  step?: number;
  currency?: string;
  minLabel?: string;
  maxLabel?: string;
}

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

const formatShortLabel = (value: number, currency: string): string => {
  if (value >= 1000000) {
    const millions = value / 1000000;
    return `${currency}${millions % 1 === 0 ? millions : millions.toFixed(1)}M`;
  }
  if (value >= 1000) {
    const thousands = value / 1000;
    return `${currency}${thousands % 1 === 0 ? thousands : thousands.toFixed(0)}K`;
  }
  return `${currency}${value}`;
};

export function PriceRangeSlider({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  sliderMin = 0,
  sliderMax = 10000000,
  step = 50000,
  currency = "₪",
  minLabel,
  maxLabel,
}: PriceRangeSliderProps) {
  // Convert undefined values to slider bounds for display
  const sliderValues: [number, number] = [
    minValue ?? sliderMin,
    maxValue ?? sliderMax
  ];

  const handleSliderChange = (values: number[]) => {
    // If at bounds, set to undefined (meaning "no limit")
    onMinChange(values[0] === sliderMin ? undefined : values[0]);
    onMaxChange(values[1] === sliderMax ? undefined : values[1]);
  };

  const defaultMinLabel = minLabel ?? formatShortLabel(sliderMin, currency);
  const defaultMaxLabel = maxLabel ?? `${formatShortLabel(sliderMax, currency)}+`;

  return (
    <div className="space-y-4">
      {/* Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{defaultMinLabel}</span>
          <span>{defaultMaxLabel}</span>
        </div>
        <SliderPrimitive.Root
          className="relative flex w-full touch-none select-none items-center h-5"
          value={sliderValues}
          onValueChange={handleSliderChange}
          min={sliderMin}
          max={sliderMax}
          step={step}
          minStepsBetweenThumbs={1}
        >
          <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb 
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:border-primary/80 hover:scale-110 z-10 focus:z-20" 
            aria-label="Minimum price"
          />
          <SliderPrimitive.Thumb 
            className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing hover:border-primary/80 hover:scale-110 z-10 focus:z-20" 
            aria-label="Maximum price"
          />
        </SliderPrimitive.Root>
      </div>

      {/* Input boxes */}
      <div className="flex gap-3">
        <div className="flex-1 space-y-1">
          <Input
            type="text"
            inputMode="numeric"
            placeholder={`Min (${currency})`}
            value={formatWithCommas(minValue)}
            onChange={(e) => onMinChange(parseCommaNumber(e.target.value))}
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
            placeholder={`Max (${currency})`}
            value={formatWithCommas(maxValue)}
            onChange={(e) => onMaxChange(parseCommaNumber(e.target.value))}
            className="rounded-lg"
          />
          <span className="text-xs text-muted-foreground">Max</span>
        </div>
      </div>
    </div>
  );
}
