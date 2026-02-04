import { usePreferences } from '@/contexts/PreferencesContext';

interface HeatmapLegendProps {
  visible: boolean;
}

export function HeatmapLegend({ visible }: HeatmapLegendProps) {
  const { currency, exchangeRate } = usePreferences();

  if (!visible) return null;

  // Format threshold based on currency preference
  const formatThreshold = (ilsValue: number) => {
    if (currency === 'USD') {
      const usdValue = Math.round(ilsValue / exchangeRate);
      return `$${usdValue.toLocaleString()}`;
    }
    return `₪${ilsValue.toLocaleString()}`;
  };

  // Brand-aligned blue gradient price ranges
  const PRICE_RANGES = [
    { label: `< ${formatThreshold(25000)}`, color: 'hsl(200, 80%, 70%)', maxPrice: 25000 },
    { label: `${formatThreshold(25000)}-${formatThreshold(40000)}`, color: 'hsl(200, 75%, 55%)', maxPrice: 40000 },
    { label: `${formatThreshold(40000)}-${formatThreshold(55000)}`, color: 'hsl(213, 85%, 50%)', maxPrice: 55000 },
    { label: `${formatThreshold(55000)}-${formatThreshold(70000)}`, color: 'hsl(220, 80%, 40%)', maxPrice: 70000 },
    { label: `> ${formatThreshold(70000)}`, color: 'hsl(230, 70%, 30%)', maxPrice: Infinity },
  ];

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
