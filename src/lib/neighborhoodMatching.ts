export function normalizeNeighborhoodName(name: string | null | undefined): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[׳'’`]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\u0590-\u05ff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findNamedMatch<T extends { name: string }>(items: T[], targetName: string): T | undefined {
  const exactMatch = items.find((item) => item.name === targetName);
  if (exactMatch) return exactMatch;

  const normalizedTarget = normalizeNeighborhoodName(targetName);
  return items.find((item) => normalizeNeighborhoodName(item.name) === normalizedTarget);
}

export function findValueByNeighborhoodName<T>(
  record: Record<string, T> | undefined,
  targetName: string
): T | undefined {
  if (!record) return undefined;
  if (record[targetName]) return record[targetName];

  const normalizedTarget = normalizeNeighborhoodName(targetName);
  return Object.entries(record).find(([name]) => normalizeNeighborhoodName(name) === normalizedTarget)?.[1];
}