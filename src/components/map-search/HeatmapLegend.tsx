import { useFormatPrice } from '@/contexts/PreferencesContext';

interface HeatmapLegendProps {
  visible: boolean;
}

const PRICE_RANGES = [
  { label: '< ₪25K', color: 'hsl(142 76% 50%)', maxPrice: 25000 },
  { label: '₪25-40K', color: 'hsl(80 65% 50%)', maxPrice: 40000 },
  { label: '₪40-55K', color: 'hsl(45 100% 51%)', maxPrice: 55000 },
  { label: '₪55-70K', color: 'hsl(25 95% 53%)', maxPrice: 70000 },
  { label: '> ₪70K', color: 'hsl(0 84% 60%)', maxPrice: Infinity },
];

export function HeatmapLegend({ visible }: HeatmapLegendProps) {
  if (!visible) return null;

  return (
    <div className="heatmap-legend">
      <p className="heatmap-legend-title">Price per m²</p>
      {PRICE_RANGES.map((range) => (
        <div key={range.label} className="heatmap-legend-item">
          <div
            className="heatmap-legend-color"
            style={{ backgroundColor: range.color }}
          />
          <span>{range.label}</span>
        </div>
      ))}
    </div>
  );
}
