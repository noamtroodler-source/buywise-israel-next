import { LeaseTermOption, SublettingOption, FurnishedStatus, PetsPolicy } from '@/types/database';

// A/C type labels
const acTypeLabels: Record<string, string> = {
  none: 'No A/C',
  split: 'Split Units',
  central: 'Central A/C',
  mini_central: 'Mini Central',
};

export function formatAcTypeLabel(acType: string | null | undefined): string {
  if (!acType) return '—';
  return acTypeLabels[acType] || acType;
}

// Lease term labels
const leaseTermLabels: Record<LeaseTermOption, string> = {
  '6_months': '6 Months',
  '12_months': '12 Months',
  '24_months': '24 Months',
  'flexible': 'Flexible',
  'other': 'Other',
};

export function formatLeaseTermLabel(leaseTerm: LeaseTermOption | null | undefined): string {
  if (!leaseTerm) return '—';
  return leaseTermLabels[leaseTerm] || leaseTerm;
}

// Subletting labels
const sublettingLabels: Record<SublettingOption, string> = {
  'allowed': 'Allowed',
  'case_by_case': 'Case by Case',
  'not_allowed': 'Not Allowed',
};

export function formatSublettingLabel(subletting: SublettingOption | null | undefined): string {
  if (!subletting) return '—';
  return sublettingLabels[subletting] || subletting;
}

// Furnished status labels
const furnishedLabels: Record<FurnishedStatus, string> = {
  'fully': 'Fully Furnished',
  'semi': 'Semi Furnished',
  'unfurnished': 'Unfurnished',
};

export function formatFurnishedLabel(furnished: FurnishedStatus | null | undefined): string {
  if (!furnished) return '—';
  return furnishedLabels[furnished] || furnished;
}

// Pets policy labels
const petsLabels: Record<PetsPolicy, string> = {
  'allowed': 'Pets Allowed',
  'case_by_case': 'Case by Case',
  'not_allowed': 'No Pets',
};

export function formatPetsLabel(pets: PetsPolicy | null | undefined): string {
  if (!pets) return '—';
  return petsLabels[pets] || pets;
}

// Entry date formatting
export function formatEntryDate(entryDate: string | null | undefined): string {
  if (!entryDate) return '—';
  if (entryDate.toLowerCase() === 'immediate') return 'Immediate';
  
  try {
    const date = new Date(entryDate);
    if (isNaN(date.getTime())) return entryDate;
    
    // Check if it's in the past
    const now = new Date();
    if (date < now) return 'Immediate';
    
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return entryDate;
  }
}

// Days on market calculation
export function calculateDaysOnMarket(createdAt: string | null | undefined): number | null {
  if (!createdAt) return null;
  
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

export function formatDaysOnMarket(createdAt: string | null | undefined): string {
  const days = calculateDaysOnMarket(createdAt);
  if (days === null) return '—';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}
