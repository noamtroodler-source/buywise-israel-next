export interface NeighborhoodQuarterPrice {
  avg_price_nis: number | null;
  year: number;
  quarter: number;
}

export interface NeighborhoodSnapshot {
  currentAvgPrice: number | null;
  comparisonAvgPrice: number | null;
  yoyChangePercent: number | null;
  yoyWarning: boolean;
  latestYear: number | null;
  latestQuarter: number | null;
}

const WINDOW_SIZE = 4;
const COMPARISON_OFFSET = 12;
const OUTLIER_DEVIATION_RATIO = 0.45;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function isFinitePrice(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function sortPricesDesc(prices: NeighborhoodQuarterPrice[]): NeighborhoodQuarterPrice[] {
  return [...prices]
    .filter((price) => isFinitePrice(price.avg_price_nis))
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.quarter - a.quarter;
    });
}

function filterWindowOutliers(values: number[]): { values: number[]; removed: boolean } {
  if (values.length < 3) return { values, removed: false };

  const windowMedian = median(values);
  if (!isFinitePrice(windowMedian)) return { values, removed: false };

  const filtered = values.filter(
    (value) => Math.abs(value - windowMedian) / windowMedian <= OUTLIER_DEVIATION_RATIO
  );

  if (filtered.length < Math.max(2, values.length - 1)) {
    return { values, removed: false };
  }

  return {
    values: filtered,
    removed: filtered.length !== values.length,
  };
}

function getWindowValues(prices: NeighborhoodQuarterPrice[], startIndex: number): number[] {
  return prices
    .slice(startIndex, startIndex + WINDOW_SIZE)
    .map((price) => price.avg_price_nis)
    .filter(isFinitePrice);
}

function isNewerSnapshot(current: NeighborhoodSnapshot, latest: NeighborhoodSnapshot | null): boolean {
  if (!latest) return true;
  if ((current.latestYear ?? 0) !== (latest.latestYear ?? 0)) {
    return (current.latestYear ?? 0) > (latest.latestYear ?? 0);
  }

  return (current.latestQuarter ?? 0) > (latest.latestQuarter ?? 0);
}

export function computeNeighborhoodSnapshot(prices: NeighborhoodQuarterPrice[]): NeighborhoodSnapshot {
  const sortedPrices = sortPricesDesc(prices);
  const latest = sortedPrices[0];

  if (!latest) {
    return {
      currentAvgPrice: null,
      comparisonAvgPrice: null,
      yoyChangePercent: null,
      yoyWarning: false,
      latestYear: null,
      latestQuarter: null,
    };
  }

  const recentWindow = filterWindowOutliers(getWindowValues(sortedPrices, 0));
  const comparisonWindow = filterWindowOutliers(getWindowValues(sortedPrices, COMPARISON_OFFSET));

  const currentAvgBase = recentWindow.values.length > 0 ? average(recentWindow.values) : null;
  const comparisonAvgBase = comparisonWindow.values.length > 0 ? average(comparisonWindow.values) : null;

  const yoyChangePercent =
    currentAvgBase != null &&
    comparisonAvgBase != null &&
    comparisonWindow.values.length >= 2
      ? roundToTenth(((currentAvgBase - comparisonAvgBase) / comparisonAvgBase) * 100)
      : null;

  return {
    currentAvgPrice: currentAvgBase != null ? Math.round(currentAvgBase) : null,
    comparisonAvgPrice: comparisonAvgBase != null ? Math.round(comparisonAvgBase) : null,
    yoyChangePercent,
    yoyWarning:
      recentWindow.removed ||
      comparisonWindow.removed ||
      recentWindow.values.length < 3 ||
      comparisonWindow.values.length < 3 ||
      (yoyChangePercent != null && Math.abs(yoyChangePercent) > 25),
    latestYear: latest.year,
    latestQuarter: latest.quarter,
  };
}

export function combineNeighborhoodSnapshots(snapshots: NeighborhoodSnapshot[]): NeighborhoodSnapshot {
  const validSnapshots = snapshots.filter((snapshot) => isFinitePrice(snapshot.currentAvgPrice));

  if (validSnapshots.length === 0) {
    return {
      currentAvgPrice: null,
      comparisonAvgPrice: null,
      yoyChangePercent: null,
      yoyWarning: false,
      latestYear: null,
      latestQuarter: null,
    };
  }

  const avgPrice = Math.round(average(validSnapshots.map((snapshot) => snapshot.currentAvgPrice as number)));

  const comparableSnapshots = validSnapshots.filter((snapshot) => isFinitePrice(snapshot.comparisonAvgPrice));
  const currentComparableAvg = comparableSnapshots.length
    ? average(comparableSnapshots.map((snapshot) => snapshot.currentAvgPrice as number))
    : null;
  const comparisonAvgPrice = comparableSnapshots.length
    ? Math.round(average(comparableSnapshots.map((snapshot) => snapshot.comparisonAvgPrice as number)))
    : null;

  const yoyChangePercent =
    currentComparableAvg != null && comparisonAvgPrice != null && comparisonAvgPrice > 0
      ? roundToTenth(((currentComparableAvg - comparisonAvgPrice) / comparisonAvgPrice) * 100)
      : null;

  const latestSnapshot = validSnapshots.reduce<NeighborhoodSnapshot | null>((latest, snapshot) => {
    return isNewerSnapshot(snapshot, latest) ? snapshot : latest;
  }, null);

  return {
    currentAvgPrice: avgPrice,
    comparisonAvgPrice,
    yoyChangePercent,
    yoyWarning:
      validSnapshots.some((snapshot) => snapshot.yoyWarning) ||
      (yoyChangePercent != null && Math.abs(yoyChangePercent) > 25),
    latestYear: latestSnapshot?.latestYear ?? null,
    latestQuarter: latestSnapshot?.latestQuarter ?? null,
  };
}