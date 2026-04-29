export type AgencyListingDisplayStatusKey =
  | 'to_review'
  | 'ready_to_submit'
  | 'pending_buywise_review'
  | 'live'
  | 'needs_fixes'
  | 'archived';

export interface AgencyListingStatusInput {
  verification_status?: string | null;
  is_published?: boolean | null;
  agency_review_status?: string | null;
  missing_quick_fields?: string[] | null;
  has_critical_flags?: boolean | null;
}

export interface AgencyListingDisplayStatus {
  key: AgencyListingDisplayStatusKey;
  label: string;
  description: string;
  badgeClassName: string;
}

export const AGENCY_LISTING_STATUS_OPTIONS: AgencyListingDisplayStatus[] = [
  {
    key: 'to_review',
    label: 'Needs quick review',
    description: 'Mostly complete, with one or two details to check before publishing.',
    badgeClassName: 'bg-muted text-muted-foreground border-border',
  },
  {
    key: 'ready_to_submit',
    label: 'Ready to publish',
    description: 'Core required details are complete and this is ready for final approval.',
    badgeClassName: 'bg-primary/10 text-primary border-primary/25',
  },
  {
    key: 'pending_buywise_review',
    label: 'Pending BuyWise review',
    description: 'Submitted and waiting for BuyWise review.',
    badgeClassName: 'bg-secondary text-secondary-foreground border-border',
  },
  {
    key: 'live',
    label: 'Live',
    description: 'Published and visible to buyers.',
    badgeClassName: 'bg-primary/10 text-primary border-primary/25',
  },
  {
    key: 'needs_fixes',
    label: 'Needs major review',
    description: 'Several important details need real review before this can go live.',
    badgeClassName: 'bg-destructive/10 text-destructive border-destructive/25',
  },
  {
    key: 'archived',
    label: 'Archived',
    description: 'Removed from the active agency workflow.',
    badgeClassName: 'bg-muted text-muted-foreground border-border',
  },
];

export const AGENCY_LISTING_STATUS_BY_KEY = Object.fromEntries(
  AGENCY_LISTING_STATUS_OPTIONS.map((status) => [status.key, status])
) as Record<AgencyListingDisplayStatusKey, AgencyListingDisplayStatus>;

export function hasAgencyListingHardBlockers(listing: AgencyListingStatusInput): boolean {
  return Boolean(listing.has_critical_flags || (listing.missing_quick_fields?.length ?? 0) > 0);
}

export function getAgencyListingDisplayStatus(listing: AgencyListingStatusInput): AgencyListingDisplayStatus {
  if (listing.agency_review_status === 'archived_stale') {
    return AGENCY_LISTING_STATUS_BY_KEY.archived;
  }

  if (listing.verification_status === 'approved' && listing.is_published !== false) {
    return AGENCY_LISTING_STATUS_BY_KEY.live;
  }

  if (listing.verification_status === 'pending_review') {
    return AGENCY_LISTING_STATUS_BY_KEY.pending_buywise_review;
  }

  if (listing.agency_review_status === 'agency_confirmed') {
    return AGENCY_LISTING_STATUS_BY_KEY.pending_buywise_review;
  }

  if (
    listing.verification_status === 'changes_requested' ||
    listing.verification_status === 'rejected' ||
    listing.agency_review_status === 'needs_edit'
  ) {
    return AGENCY_LISTING_STATUS_BY_KEY.needs_fixes;
  }

  if (hasAgencyListingHardBlockers(listing)) {
    return AGENCY_LISTING_STATUS_BY_KEY.to_review;
  }

  return AGENCY_LISTING_STATUS_BY_KEY.ready_to_submit;
}
