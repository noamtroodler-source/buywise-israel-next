import { memo, useMemo } from 'react';
import { Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { MapSoldTransaction } from '@/hooks/useMapSoldTransactions';

function formatSoldPrice(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `₪${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `₪${Math.round(amount / 1_000)}K`;
  }
  return `₪${Math.round(amount)}`;
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
}

interface SoldTransactionMarkerProps {
  transaction: MapSoldTransaction;
}

export const SoldTransactionMarker = memo(function SoldTransactionMarker({
  transaction,
}: SoldTransactionMarkerProps) {
  const label = useMemo(() => {
    const price = formatSoldPrice(transaction.sold_price);
    const date = formatShortDate(transaction.sold_date);
    return `${price} · ${date}`;
  }, [transaction.sold_price, transaction.sold_date]);

  const icon = useMemo(() => {
    const w = Math.ceil(label.length * 5.5 + 14);
    const h = 20;
    return L.divIcon({
      html: `<div class="sold-marker-pill">${label}</div>`,
      className: '',
      iconSize: [w, h],
      iconAnchor: [w / 2, h / 2],
    });
  }, [label]);

  return (
    <Marker
      position={[transaction.latitude, transaction.longitude]}
      icon={icon}
      interactive
    >
      <Tooltip direction="top" offset={[0, -12]}>
        <div className="text-xs space-y-0.5">
          <div className="font-semibold">{formatSoldPrice(transaction.sold_price)}</div>
          <div className="text-muted-foreground">{formatShortDate(transaction.sold_date)}</div>
          {transaction.rooms && <div>{transaction.rooms} rooms</div>}
          {transaction.size_sqm && <div>{transaction.size_sqm} sqm</div>}
          {transaction.price_per_sqm && <div>₪{Math.round(transaction.price_per_sqm).toLocaleString()}/sqm</div>}
          {transaction.address && <div className="text-muted-foreground truncate max-w-[180px]">{transaction.address}</div>}
        </div>
      </Tooltip>
    </Marker>
  );
}, (prev, next) => prev.transaction.id === next.transaction.id);
