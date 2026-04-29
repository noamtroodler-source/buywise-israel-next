import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Home, Plus, Search, Download, FileSpreadsheet,
  Eye, Clock, CheckCircle2, Building2, Heart, MessageSquare,
  Edit, Trash2, Send, MoreHorizontal, Copy, Key, ArrowLeftRight, X,
  ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, Archive, CheckCheck,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { useMyAgency, useAgencyTeam } from '@/hooks/useAgencyManagement';
import {
  AgencyListing,
  AgencyReviewStatus,
  useAgencyListingsManagement,
  useArchiveAgencyListing,
  useBulkApproveAgencyListings,
  useMarkAgencyListingNeedsEdit,
  useUnpublishAgencyListing,
} from '@/hooks/useAgencyListings';
import { useDeleteProperty, useSubmitForReview, useBulkDeleteProperties, useBulkSubmitForReview, useReassignProperty } from '@/hooks/useAgentProperties';
import { AgentReassignPopover } from '@/components/agency/AgentReassignPopover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUpdatePropertyStatus, useDuplicateProperty } from '@/hooks/useAgentProfile';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { cn } from '@/lib/utils';
import { exportToCSV } from '@/lib/csvExport';
import { AgencyListingsSkeleton } from '@/components/agency/skeletons/AgencyPageSkeletons';
import { EnhancedEmptyState } from '@/components/shared/EnhancedEmptyState';
import { PriceContextBadge } from '@/components/property/PriceContextBadge';
import { BenchmarkReviewDialog } from '@/components/property/BenchmarkReviewDialog';

const IMPORTED_BANNER_KEY = 'agency_imported_drafts_banner_dismissed';
const LAUNCH_REVIEW_GUIDANCE_KEY = 'agency_launch_review_guidance_dismissed';

function ImportedDraftsGuidance({ listings }: { listings: any[] }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(IMPORTED_BANNER_KEY) === 'true');
  }, []);

  const hasImportedDrafts = listings.some(
    l => l.import_source && l.verification_status === 'draft'
  );

  if (dismissed || !hasImportedDrafts) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15 text-sm"
    >
      <ArrowLeftRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <p className="flex-1 text-muted-foreground">
        <strong className="text-foreground">Imported listings</strong> are drafts assigned to you. Use the <strong>Agent</strong> column to reassign them to team members for review and submission.
      </p>
      <button
        onClick={() => {
          localStorage.setItem(IMPORTED_BANNER_KEY, 'true');
          setDismissed(true);
        }}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  pending_review: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600' },
  approved: { label: 'Active', color: 'bg-green-500/10 text-green-600' },
  changes_requested: { label: 'Changes', color: 'bg-orange-500/10 text-orange-600' },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-600' },
};

const reviewConfig: Record<AgencyReviewStatus, { label: string; color: string; icon: typeof Clock }> = {
  needs_review: { label: 'Confirm', color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20', icon: Clock },
  approved_live: { label: 'Confirmed', color: 'bg-green-500/10 text-green-700 border-green-500/20', icon: CheckCircle2 },
  needs_edit: { label: 'Quick edit', color: 'bg-orange-500/10 text-orange-700 border-orange-500/20', icon: AlertTriangle },
  archived_stale: { label: 'Archived', color: 'bg-muted text-muted-foreground border-border', icon: Archive },
};

type ReviewWorkBucket = 'almost_ready' | 'needs_work';

function getReviewBucket(listing: AgencyListing): ReviewWorkBucket | AgencyReviewStatus {
  const status = listing.agency_review_status || 'needs_review';
  if (status === 'needs_review' || status === 'needs_edit') {
    const missingCount = listing.missing_quick_fields?.length ?? 0;
    const imageCount = Array.isArray(listing.images) ? listing.images.length : 0;
    return !listing.has_critical_flags && missingCount <= 1 && imageCount >= 2 ? 'almost_ready' : 'needs_work';
  }
  return status;
}

function LaunchReviewGuidance({ listings, reviewFilter, setReviewFilter }: {
  listings: AgencyListing[];
  reviewFilter: 'all' | ReviewWorkBucket | AgencyReviewStatus;
  setReviewFilter: (value: 'all' | ReviewWorkBucket | AgencyReviewStatus) => void;
}) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(LAUNCH_REVIEW_GUIDANCE_KEY) === 'true');

  const counts = useMemo(() => ({
    almostReady: listings.filter((listing) => getReviewBucket(listing) === 'almost_ready').length,
    needsWork: listings.filter((listing) => getReviewBucket(listing) === 'needs_work').length,
  }), [listings]);

  if (dismissed || listings.length === 0) return null;

  const categories = [
    {
      key: 'almost_ready' as const,
      label: 'Almost ready',
      value: counts.almostReady,
      description: 'These are basically ready and only need one small confirmation or edit before publishing.',
    },
    {
      key: 'needs_work' as const,
      label: 'Needs work',
      value: counts.needsWork,
      description: 'These are missing multiple details or enough photos that they need proper attention before going live.',
    },
  ];

  return (
    <Card className="rounded-2xl border-primary/15 bg-primary/5 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Review your imported listings before going live</p>
            <p className="text-sm text-muted-foreground max-w-4xl">
              Start with listings that are almost ready, then work through the ones missing more information or photos. Your agency is responsible for accuracy before anything goes live.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => {
              localStorage.setItem(LAUNCH_REVIEW_GUIDANCE_KEY, 'true');
              setDismissed(true);
            }}
            aria-label="Dismiss onboarding guidance"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {categories.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => setReviewFilter(category.key)}
              className={cn(
                'text-left rounded-xl border p-3 transition-colors bg-background/80 hover:bg-background',
                reviewFilter === category.key ? 'border-primary ring-1 ring-primary/30' : 'border-border/70'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">{category.label}</span>
                <span className="text-lg font-bold text-primary">{category.value}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{category.description}</p>
            </button>
          ))}
        </div>

      </CardContent>
    </Card>
  );
}

type SortKey = 'review' | 'price' | 'views' | 'saves' | 'inquiries' | 'days';
type SortDirection = 'asc' | 'desc';

function getSortValue(listing: any, key: SortKey) {
  if (key === 'review') {
    const status = listing.agency_review_status || 'needs_review';
    const missingCount = listing.missing_quick_fields?.length ?? 0;
    const baseScore = status === 'approved_live'
      ? 100
      : listing.safe_to_batch_approve
        ? 90
        : status === 'needs_review'
          ? 70
          : status === 'needs_edit'
            ? 35
            : 0;
    return baseScore - (listing.has_critical_flags ? 25 : 0) - Math.min(missingCount * 5, 30);
  }
  if (key === 'price') return Number(listing.price || 0);
  if (key === 'views') return Number(listing.views_count || 0);
  if (key === 'saves') return Number(listing.total_saves || 0);
  if (key === 'inquiries') return Number(listing.my_inquiries_count ?? listing.inquiries_count ?? 0);
  return Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24));
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  onSort,
  align = 'center',
}: {
  label: string;
  sortKey: SortKey;
  activeSort: { key: SortKey; direction: SortDirection } | null;
  onSort: (key: SortKey, direction: SortDirection) => void;
  align?: 'center' | 'right';
}) {
  const isActive = activeSort?.key === sortKey;
  const Icon = isActive ? (activeSort.direction === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-8 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground', align === 'right' && 'ml-auto')}
        >
          {label}
          <Icon className={cn('h-3.5 w-3.5', isActive && 'text-primary')} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align === 'right' ? 'end' : 'center'} className="w-40">
        <DropdownMenuItem onClick={() => onSort(sortKey, 'asc')}>
          <ArrowUp className="mr-2 h-4 w-4" /> {sortKey === 'review' ? 'Least ready first' : 'Low to high'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSort(sortKey, 'desc')}>
          <ArrowDown className="mr-2 h-4 w-4" /> {sortKey === 'review' ? 'Most ready first' : 'High to low'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AgencyListings() {
  const navigate = useNavigate();
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: listings = [], isLoading: listingsLoading } = useAgencyListingsManagement(agency?.id);
  const deleteProperty = useDeleteProperty();
  const submitForReview = useSubmitForReview();
  const updateStatus = useUpdatePropertyStatus();
  const duplicateProperty = useDuplicateProperty();
  const bulkDelete = useBulkDeleteProperties();
  const bulkSubmit = useBulkSubmitForReview();
  const reassignProperty = useReassignProperty();
  const archiveListing = useArchiveAgencyListing();
  const unpublishListing = useUnpublishAgencyListing();
  const bulkApproveListings = useBulkApproveAgencyListings();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'primary' | 'co_listed'>('all');
  const [reviewFilter, setReviewFilter] = useState<'all' | ReviewWorkBucket | AgencyReviewStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'review', direction: 'desc' });
  const formatPrice = useFormatPrice();

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (agencyLoading || listingsLoading) {
    return <AgencyListingsSkeleton />;
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16">
          <EnhancedEmptyState
            icon={Building2}
            title="No Agency Found"
            description="You need to have an agency to view and manage listings."
            primaryAction={{ label: 'Register Agency', href: '/agency/register' }}
            secondaryAction={{ label: 'Go to Agency', href: '/agency' }}
          />
        </div>
      </Layout>
    );
  }

  const cities = [...new Set(listings.map(l => l.city).filter(Boolean))];

  const filteredListings = listings.filter(listing => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        listing.title?.toLowerCase().includes(query) ||
        listing.address?.toLowerCase().includes(query) ||
        listing.city?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (statusFilter !== 'all' && listing.verification_status !== statusFilter) return false;
    if (agentFilter !== 'all' && listing.agent_id !== agentFilter) return false;
    if (cityFilter !== 'all' && listing.city !== cityFilter) return false;
    if (roleFilter !== 'all' && listing.role !== roleFilter) return false;
    if (reviewFilter !== 'all' && getReviewBucket(listing) !== reviewFilter && listing.agency_review_status !== reviewFilter) return false;
    return true;
  });

  const sortedListings = sort
    ? [...filteredListings].sort((a, b) => {
      const diff = getSortValue(a, sort.key) - getSortValue(b, sort.key);
      return sort.direction === 'asc' ? diff : -diff;
    })
    : filteredListings;

  const handleSort = (key: SortKey, direction: SortDirection) => setSort({ key, direction });

  const primaryCount = listings.filter(l => l.role === 'primary').length;
  const coListedCount = listings.filter(l => l.role === 'co_listed').length;

  const stats = {
    total: listings.length,
    active: listings.filter(l => l.verification_status === 'approved').length,
    pending: listings.filter(l => l.verification_status === 'pending_review').length,
    needsReview: listings.filter(l => l.agency_review_status === 'needs_review').length,
    ready: listings.filter(l => getReviewBucket(l) === 'almost_ready').length,
    quickFix: listings.filter(l => getReviewBucket(l) === 'needs_work').length,
    archived: listings.filter(l => l.agency_review_status === 'archived_stale').length,
    totalViews: listings.reduce((sum, l) => sum + (l.views_count || 0), 0),
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return '—';
    const agent = team.find(a => a.id === agentId);
    return agent?.name || 'Unknown';
  };

  const getDaysOnMarket = (createdAt: string) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const handleDuplicate = (propertyId: string) => {
    duplicateProperty.mutate(propertyId, {
      onSuccess: (result) => {
        navigate(`/agency/properties/${result.newPropertyId}/edit`);
      },
    });
  };

  const filteredIds = filteredListings.map(l => l.id);
  const allFilteredSelected = filteredListings.length > 0 && filteredListings.every(l => selectedIds.has(l.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const allSelectedCanSubmit = selectedIds.size > 0 && [...selectedIds].every(id => {
    const listing = listings.find(l => l.id === id);
    return listing && (listing.verification_status === 'draft' || listing.verification_status === 'changes_requested');
  });

  const handleBulkDelete = () => {
    bulkDelete.mutate([...selectedIds], {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
      },
    });
  };

  const handleBulkSubmit = () => {
    bulkSubmit.mutate([...selectedIds], {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  const safeSelectedIds = [...selectedIds].filter((id) => listings.find((l) => l.id === id)?.safe_to_batch_approve);

  const handleBulkApproveSafe = () => {
    bulkApproveListings.mutate({ propertyIds: safeSelectedIds, agencyId: agency.id }, {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  const handleBulkReassign = (targetAgentId: string) => {
    const ids = [...selectedIds];
    let completed = 0;
    const targetAgent = team.find(a => a.id === targetAgentId);
    const targetName = targetAgent?.name || 'Unknown';
    ids.forEach(propertyId => {
      reassignProperty.mutate(
        { propertyId, newAgentId: targetAgentId, newAgentName: targetName },
        {
          onSettled: () => {
            completed++;
            if (completed === ids.length) {
              setSelectedIds(new Set());
            }
          },
        }
      );
    });
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="rounded-xl">
                <Link to="/agency"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Agency Listings</h1>
                <p className="text-muted-foreground">Internal confirmation queue for agency-owned listings</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => {
                  const agentMap = Object.fromEntries(team.map(a => [a.id, a.name]));
                  const headers = ['Title', 'Address', 'City', 'Price', 'Currency', 'Type', 'Status', 'Agent', 'Views', 'Saves', 'Inquiries', 'Created'];
                  const rows = filteredListings.map(l => [
                    l.title || '',
                    l.address || '',
                    l.city || '',
                    String(l.price ?? ''),
                    l.currency || 'ILS',
                    l.property_type || '',
                    l.verification_status || '',
                    (l.agent_id && agentMap[l.agent_id]) || '',
                    String(l.views_count ?? 0),
                    String(l.total_saves ?? 0),
                    String(l.inquiries_count ?? 0),
                    l.created_at ? new Date(l.created_at).toLocaleDateString() : '',
                  ]);
                  exportToCSV(`agency-listings-${new Date().toISOString().slice(0, 10)}`, headers, rows);
                }}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" asChild className="rounded-xl">
                <Link to="/agency/import">
                  <Download className="h-4 w-4 mr-2" />
                  Import from Website
                </Link>
              </Button>
              <Button asChild className="rounded-xl">
                <Link to="/agency/properties/new">
                  <Home className="h-4 w-4 mr-2" />
                  Add Listing
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-primary/30 text-primary hover:bg-primary/5">
                <Link to="/agency/projects/new">
                  <Building2 className="h-4 w-4 mr-2" />
                  Add Project
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: stats.total, icon: Home },
              { label: 'Active', value: stats.active, icon: CheckCircle2 },
              { label: 'Need Confirmation', value: stats.needsReview, icon: Clock, highlight: stats.needsReview > 0 },
              { label: 'Total Views', value: stats.totalViews, icon: Eye },
            ].map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className={cn('rounded-2xl border-primary/10', stat.highlight && 'bg-primary/5 border-primary/20')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-xl', stat.highlight ? 'bg-primary/20' : 'bg-primary/10')}>
                        <stat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <LaunchReviewGuidance listings={listings} reviewFilter={reviewFilter} setReviewFilter={setReviewFilter} />

          {/* Role pills — click to filter by primary / co-listed */}
          {(primaryCount > 0 || coListedCount > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setRoleFilter('all')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  roleFilter === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                )}
              >
                All <span className="opacity-80">{listings.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('primary')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  roleFilter === 'primary'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                )}
              >
                Primary <span className="opacity-80">{primaryCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setRoleFilter('co_listed')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  roleFilter === 'co_listed'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                )}
              >
                Co-listed <span className="opacity-80">{coListedCount}</span>
              </button>
            </div>
          )}

          {/* Imported drafts guidance banner */}
          <ImportedDraftsGuidance listings={listings} />

          {/* Filters */}
          <Card className="rounded-2xl border-primary/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Active</SelectItem>
                    <SelectItem value="pending_review">Pending</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="changes_requested">Changes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={reviewFilter} onValueChange={(value) => setReviewFilter(value as any)}>
                  <SelectTrigger className="w-[170px] rounded-xl"><SelectValue placeholder="Review" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reviews</SelectItem>
                    <SelectItem value="almost_ready">Almost ready</SelectItem>
                    <SelectItem value="needs_work">Needs work</SelectItem>
                    <SelectItem value="approved_live">Confirmed</SelectItem>
                    <SelectItem value="archived_stale">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Agent" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {team.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl"><SelectValue placeholder="City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Listings Table */}
          <Card className="rounded-2xl border-primary/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Listings ({filteredListings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredListings.length === 0 ? (
                <EnhancedEmptyState
                  icon={Home}
                  title="No listings found"
                  description={listings.length === 0 ? "Add your first listing to get started" : "Try adjusting your filters"}
                  variant="compact"
                  primaryAction={listings.length === 0 ? { label: 'Add Listing', href: '/agency/properties/new', icon: Plus } : undefined}
                  suggestions={listings.length === 0 ? [
                    { icon: Plus, text: 'Create a new property listing' },
                    { icon: Eye, text: 'Listings will appear here once added' },
                  ] : undefined}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <Checkbox
                            checked={allFilteredSelected}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>
                          <TooltipProvider delayDuration={300}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 cursor-help">
                                  Agent
                                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Click agent name to reassign</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead><SortableHeader label="Review" sortKey="review" activeSort={sort} onSort={handleSort} /></TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                        <TableHead className="text-right"><SortableHeader label="Price" sortKey="price" activeSort={sort} onSort={handleSort} align="right" /></TableHead>
                        <TableHead className="text-center"><SortableHeader label="Views" sortKey="views" activeSort={sort} onSort={handleSort} /></TableHead>
                        <TableHead className="text-center"><SortableHeader label="Saves" sortKey="saves" activeSort={sort} onSort={handleSort} /></TableHead>
                        <TableHead className="text-center"><SortableHeader label="Inquiries" sortKey="inquiries" activeSort={sort} onSort={handleSort} /></TableHead>
                        <TableHead className="text-center"><SortableHeader label="Days" sortKey="days" activeSort={sort} onSort={handleSort} /></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedListings.map((listing) => {
                        const status = statusConfig[listing.verification_status as keyof typeof statusConfig] || statusConfig.draft;
                        const hasMissingQuickFields = listing.missing_quick_fields.length > 0;
                        const displayReviewStatus: AgencyReviewStatus =
                          listing.agency_review_status === 'needs_review' && hasMissingQuickFields
                            ? 'needs_edit'
                            : listing.agency_review_status as AgencyReviewStatus;
                        const review = reviewConfig[displayReviewStatus] || reviewConfig.needs_review;
                        const ReviewIcon = review.icon;
                        const isDraft = listing.verification_status === 'draft';
                        const canSubmitForReview = listing.verification_status === 'draft' || listing.verification_status === 'changes_requested';
                        const isPendingReview = listing.verification_status === 'pending_review';
                        const isApproved = listing.verification_status === 'approved';
                        const isPublished = listing.is_published === true;
                        const isSelected = selectedIds.has(listing.id);

                        return (
                          <TableRow key={listing.id} className={cn('hover:bg-muted/30', isSelected && 'bg-primary/5')}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(listing.id)}
                                aria-label={`Select ${listing.title}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                  {listing.images?.[0] ? (
                                    <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Home className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-medium truncate max-w-[200px]">{listing.title}</p>
                                    {listing.role === 'co_listed' && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted/40 text-muted-foreground border-border">
                                        Co-listed
                                      </Badge>
                                    )}
                                    {listing.has_active_boost && (
                                      <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30 border">
                                        Boost → primary
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {listing.city}
                                    {listing.other_agencies_count > 0 && (
                                      <> · with {listing.other_agencies_count} other{listing.other_agencies_count === 1 ? '' : 's'}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <AgentReassignPopover
                                propertyId={listing.id}
                                currentAgentId={listing.agent_id}
                                team={team}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className={cn('text-xs', status.color)}>
                                  {status.label}
                                </Badge>
                                {(listing as any).import_source && (
                                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                    Imported
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1.5 min-w-[160px]">
                                <Badge variant="outline" className={cn('text-xs gap-1', review.color)}>
                                  <ReviewIcon className="h-3 w-3" />
                                  {review.label}
                                </Badge>
                                {listing.has_critical_flags ? (
                                  <p className="text-[11px] text-destructive">Critical issue needs review</p>
                                ) : hasMissingQuickFields ? (
                                  <p className="text-[11px] text-destructive font-medium truncate max-w-[240px]" title={listing.missing_quick_fields.join(', ')}>
                                    Missing: {listing.missing_quick_fields.slice(0, 2).join(', ')}{listing.missing_quick_fields.length > 2 ? '…' : ''}
                                  </p>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground">Core fields look ready</p>
                                )}
                                {listing.listing_status === 'for_sale' && (
                                  <PriceContextBadge
                                    status={listing.price_context_badge_status}
                                    publicLabel={listing.price_context_public_label}
                                    confidenceTier={listing.price_context_confidence_tier}
                                    benchmarkReviewStatus={listing.benchmark_review_status}
                                  />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                {canSubmitForReview && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-lg"
                                    onClick={() => submitForReview.mutate(listing.id)}
                                    disabled={submitForReview.isPending}
                                    title="Submit for Review"
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}

                                {isApproved && (
                                  <Button variant="ghost" size="sm" asChild className="rounded-lg">
                                    <Link to={`/property/${listing.id}`} target="_blank">
                                      <Eye className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="rounded-lg">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/agency/properties/${listing.id}/edit`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit listing
                                      </Link>
                                    </DropdownMenuItem>
                                    {isPublished ? (
                                      <>
                                        <DropdownMenuItem asChild>
                                          <Link to={`/property/${listing.id}`} target="_blank">
                                            <Eye className="h-4 w-4 mr-2" />
                                            View live listing
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => unpublishListing.mutate({ propertyId: listing.id, agencyId: agency.id })}>
                                          <Clock className="h-4 w-4 mr-2" />
                                          Unpublish
                                        </DropdownMenuItem>
                                      </>
                                    ) : (
                                      <>
                                        {canSubmitForReview && (
                                          <DropdownMenuItem onClick={() => submitForReview.mutate(listing.id)} disabled={submitForReview.isPending}>
                                            <Send className="h-4 w-4 mr-2" />
                                            Submit for review
                                          </DropdownMenuItem>
                                        )}
                                        {isPendingReview && (
                                          <DropdownMenuItem disabled className="text-muted-foreground">
                                            <Clock className="h-4 w-4 mr-2" />
                                            Submitted for review
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => handleDuplicate(listing.id)}>
                                          <Copy className="h-4 w-4 mr-2" />
                                          Duplicate
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {listing.listing_status === 'for_sale' && (
                                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: listing.id, listing_status: 'sold' })}>
                                        <Home className="h-4 w-4 mr-2" />
                                        Mark as Sold
                                      </DropdownMenuItem>
                                    )}
                                    {listing.listing_status === 'for_sale' && (
                                      <BenchmarkReviewDialog
                                        propertyId={listing.id}
                                        propertyTitle={listing.title}
                                        trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}><AlertTriangle className="h-4 w-4 mr-2" />Request benchmark review</DropdownMenuItem>}
                                      />
                                    )}
                                    {listing.listing_status === 'for_rent' && (
                                      <DropdownMenuItem onClick={() => updateStatus.mutate({ id: listing.id, listing_status: 'rented' })}>
                                        <Key className="h-4 w-4 mr-2" />
                                        Mark as Rented
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => archiveListing.mutate({ propertyId: listing.id, agencyId: agency.id })}>
                                      <Archive className="h-4 w-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete "{listing.title}"? This cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteProperty.mutate(listing.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(listing.price, listing.currency)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">{listing.views_count || 0}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">{listing.total_saves || 0}</span>
                            </TableCell>
                            <TableCell className="text-center">
                              {listing.other_agencies_count > 0 ? (
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-sm text-muted-foreground cursor-help">
                                        <span className="font-medium text-foreground">{listing.my_inquiries_count || 0}</span>
                                        <span className="opacity-60"> / {listing.inquiries_count || 0}</span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                      <p className="text-xs">
                                        Your share: <strong>{listing.my_inquiries_count || 0}</strong><br />
                                        Total across all agencies: {listing.inquiries_count || 0}
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <span className="text-sm text-muted-foreground">{listing.inquiries_count || 0}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">{getDaysOnMarket(listing.created_at)}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Floating Bulk Action Bar */}
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
              >
                <Card className="rounded-2xl border-primary/20 shadow-lg bg-background/95 backdrop-blur-sm">
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className="text-sm font-medium pl-2 text-primary">
                      {selectedIds.size} selected
                    </span>

                    {allSelectedCanSubmit && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={handleBulkSubmit}
                        disabled={bulkSubmit.isPending}
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                        Submit for Review
                      </Button>
                    )}

                    {safeSelectedIds.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-green-700 border-green-500/30 hover:bg-green-500/10"
                        onClick={handleBulkApproveSafe}
                        disabled={bulkApproveListings.isPending}
                      >
                        <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                        Approve safe ({safeSelectedIds.length})
                      </Button>
                    )}

                    {/* Bulk Reassign */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-xl">
                          <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                          Reassign
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" side="top" align="center">
                        <p className="text-xs font-medium text-muted-foreground px-2 py-1">Reassign to:</p>
                        {team.map((agent) => (
                          <button
                            key={agent.id}
                            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors"
                            onClick={() => handleBulkReassign(agent.id)}
                          >
                            {agent.name}
                          </button>
                        ))}
                        {team.length === 0 && (
                          <p className="text-xs text-muted-foreground px-2 py-2">No team members found</p>
                        )}
                      </PopoverContent>
                    </Popover>

                    {/* Bulk Delete */}
                    <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="rounded-xl text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5">
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {selectedIds.size} Listings</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedIds.size} listing{selectedIds.size > 1 ? 's' : ''}? This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBulkDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={bulkDelete.isPending}
                          >
                            {bulkDelete.isPending ? 'Deleting...' : 'Delete All'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    {/* Clear selection */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </Layout>
  );
}
