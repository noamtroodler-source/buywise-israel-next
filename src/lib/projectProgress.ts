/**
 * Single source of truth for project construction progress.
 * 
 * Progress is derived from the project's stage, NOT raw DB percentages,
 * to ensure consistency across all components.
 */

export const PROJECT_STAGES = [
  { name: 'Planning', status: 'planning' },
  { name: 'Pre-Sale', status: 'pre_sale' },
  { name: 'Foundation', status: 'foundation' },
  { name: 'Structure', status: 'structure' },
  { name: 'Finishing', status: 'finishing' },
  { name: 'Delivery', status: 'delivery' },
] as const;

export const STAGE_PROGRESS = [0, 10, 30, 50, 75, 100] as const;

/** Map non-standard DB statuses to the closest timeline stage */
const STATUS_MAP: Record<string, string> = {
  under_construction: 'structure',
  completed: 'delivery',
};

/** Given a raw percentage, pick the closest stage index */
const inferStageFromPercent = (percent: number): number => {
  let closest = 0;
  let minDiff = Infinity;
  for (let i = 0; i < STAGE_PROGRESS.length; i++) {
    const diff = Math.abs(STAGE_PROGRESS[i] - percent);
    if (diff < minDiff) { minDiff = diff; closest = i; }
  }
  return closest;
};

/** Get the current stage index (0-5) for a project */
export const getProjectStageIndex = (
  status: string | null | undefined,
  rawPercent?: number | null
): number => {
  const normalizedStatus = STATUS_MAP[status || ''] || status || '';
  const idx = PROJECT_STAGES.findIndex(stage => stage.status === normalizedStatus);
  if (idx !== -1) return idx;
  return inferStageFromPercent(rawPercent || 0);
};

/** Get the canonical progress percentage for display */
export const getProjectProgress = (
  status: string | null | undefined,
  rawPercent?: number | null
): number => {
  return STAGE_PROGRESS[getProjectStageIndex(status, rawPercent)];
};
