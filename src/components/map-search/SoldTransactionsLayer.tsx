import { useMemo } from 'react';
import type { LatLngBounds } from 'leaflet';
import { useMapSoldTransactions } from '@/hooks/useMapSoldTransactions';
import { SoldTransactionMarker } from './SoldTransactionMarker';

interface SoldTransactionsLayerProps {
  bounds: LatLngBounds | null;
}

export function SoldTransactionsLayer({ bounds }: SoldTransactionsLayerProps) {
  const { data: transactions = [] } = useMapSoldTransactions(bounds, true);

  const visible = useMemo(() => {
    if (!bounds) return transactions;
    return transactions.filter((t) =>
      bounds.contains([t.latitude, t.longitude])
    );
  }, [transactions, bounds]);

  return (
    <>
      {visible.map((t) => (
        <SoldTransactionMarker key={t.id} transaction={t} />
      ))}
    </>
  );
}
