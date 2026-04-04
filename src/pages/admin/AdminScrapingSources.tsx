/**
 * AdminScrapingSources — Admin page to manage agency scraping sources
 * and review listing claim requests.
 *
 * Two tabs:
 *   1. Sources — view/add/toggle/sync all agency_sources
 *   2. Claim Requests — review agent claims for scraped listings
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe, RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, AlertTriangle, Clock, Building2,
  ExternalLink, Play, Loader2, ChevronDown, ChevronRight,
  Zap, Shield, ClipboardCheck, Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  useAgencySources,
  useAgencySourceStats,
  useCreateAgencySource,
  useUpdateAgencySource,
  useDeleteAgencySource,
  useTriggerSourceSync,
  useTriggerNightlySync,
  useClaimRequests,
  useClaimRequestStats,
  useApproveClaimRequest,
  useRejectClaimRequest,
  AgencySource,
  ClaimRequest,
} from '@/hooks/useAgencySources';

// ─── Source type config ──────────────────────────────────────────────────────

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  yad2: { label: 'Yad2', color: 'bg-primary/10 text-primary' },
  madlan: { label: 'Madlan', color: 'bg-accent text-accent-foreground' },
  website: { label: 'Website', color: 'bg-muted text-muted-foreground' },
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Primary',
  2: 'Secondary',
  3: 'Supplementary',
};

// ─── Add Source Dialog ───────────────────────────────────────────────────────

function AddSourceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createSource = useCreateAgencySource();
  const [form, setForm] = useState({
    agency_id: '',
    source_type: 'yad2' as 'yad2' | 'madlan' | 'website',
    source_url: '',
    priority: '1' as '1' | '2' | '3',
    notes: '',
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ['admin-agencies-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSource.mutate(
      {
        agency_id: form.agency_id,
        source_type: form.source_type,
        source_url: form.source_url.trim(),
        priority: Number(form.priority) as 1 | 2 | 3,
        notes: form.notes || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm({ agency_id: '', source_type: 'yad2', source_url: '', priority: '1', notes: '' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Scraping Source</DialogTitle>
          <DialogDescription>
            Add a Yad2 profile, Madlan page, or agency website to the nightly scrape queue.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Agency *</Label>
<Select value={form.agency_id} onValueChange={(v) => setForm((f) => ({ ...f, agency_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Select agency..." /></SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-1">
                  <Input
                    placeholder="Search agencies..."
                    value={agencySearch}
                    onChange={(e) => setAgencySearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {(agencies as any[])
                  .filter((a: any) => !agencySearch || a.name.toLowerCase().includes(agencySearch.toLowerCase()))
                  .map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Source type *</Label>
              <Select value={form.source_type} onValueChange={(v: any) => setForm((f) => ({ ...f, source_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yad2">Yad2 profile</SelectItem>
                  <SelectItem value="madlan">Madlan page</SelectItem>
                  <SelectItem value="website">Agency website</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v: any) => setForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 — Primary</SelectItem>
                  <SelectItem value="2">2 — Secondary</SelectItem>
                  <SelectItem value="3">3 — Supplementary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>URL *</Label>
            <Input
              placeholder="https://www.yad2.co.il/realestate/agency/..."
              value={form.source_url}
              onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              placeholder="e.g. Only scrapes Jerusalem listings"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createSource.isPending || !form.agency_id || !form.source_url}
            >
              {createSource.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Add source
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Source Row ──────────────────────────────────────────────────────────────

function SourceRow({ source }: { source: AgencySource }) {
  const updateSource = useUpdateAgencySource();
  const deleteSource = useDeleteAgencySource();
  const triggerSync = useTriggerSourceSync();
  const isSyncing = triggerSync.isPending;

  const cfg = SOURCE_LABELS[source.source_type] || SOURCE_LABELS.website;

  return (
    <div className={cn(
      'flex items-start gap-3 py-3 px-4 rounded-lg border transition-colors',
      source.is_active ? 'bg-white border-border' : 'bg-muted/40 border-dashed border-border/50 opacity-60'
    )}>
      {/* Source type badge */}
      <Badge className={cn('text-xs mt-0.5 flex-shrink-0', cfg.color)}>
        {cfg.label}
      </Badge>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {source.agency?.name || source.agency_id}
        </p>
        <a
          href={source.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-primary truncate flex items-center gap-1 mt-0.5"
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{source.source_url}</span>
        </a>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-muted-foreground">
            P{source.priority} · {PRIORITY_LABELS[source.priority]}
          </span>
          {source.last_synced_at && (
            <span className="text-xs text-muted-foreground">
              Synced {formatDistanceToNow(new Date(source.last_synced_at), { addSuffix: true })}
              {source.last_sync_listings_found > 0 && ` · ${source.last_sync_listings_found} found`}
            </span>
          )}
          {source.consecutive_failures > 0 && (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {source.consecutive_failures} failure{source.consecutive_failures > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {source.last_failure_reason && (
          <p className="text-xs text-destructive mt-1 truncate">{source.last_failure_reason}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          disabled={isSyncing || !source.is_active}
          onClick={() => triggerSync.mutate(source)}
          title="Sync now"
        >
          {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => updateSource.mutate({ id: source.id, updates: { is_active: !source.is_active } })}
          title={source.is_active ? 'Disable' : 'Enable'}
        >
          {source.is_active
            ? <ToggleRight className="w-3.5 h-3.5 text-primary" />
            : <ToggleLeft className="w-3.5 h-3.5 text-muted-foreground" />}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={() => {
            if (confirm(`Remove this ${source.source_type} source?`)) {
              deleteSource.mutate(source.id);
            }
          }}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Claim Request Row ───────────────────────────────────────────────────────

function ClaimRow({ claim }: { claim: ClaimRequest }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const approveRequest = useApproveClaimRequest();
  const rejectRequest = useRejectClaimRequest();

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-semantic-amber/15 text-foreground' },
    approved: { label: 'Approved', color: 'bg-semantic-green/15 text-semantic-green' },
    rejected: { label: 'Rejected', color: 'bg-destructive/10 text-destructive' },
    duplicate: { label: 'Duplicate', color: 'bg-muted text-muted-foreground' },
  };

  const cfg = statusConfig[claim.status];

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Badge className={cn('text-xs mt-0.5 flex-shrink-0', cfg.color)}>{cfg.label}</Badge>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {claim.claimant_name || 'Unknown'}
          </p>
          <p className="text-xs text-muted-foreground">{claim.claimant_email}</p>
          {claim.claimant_phone && (
            <p className="text-xs text-muted-foreground">{claim.claimant_phone}</p>
          )}
          {claim.agency_name && (
            <p className="text-xs text-muted-foreground mt-0.5">Agency: {claim.agency_name}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">
          {formatDistanceToNow(new Date(claim.created_at), { addSuffix: true })}
        </span>
      </div>

      {claim.property && (
        <div className="rounded-md bg-muted/40 px-3 py-2 space-y-0.5">
          <p className="text-xs font-medium text-foreground">{claim.property.title}</p>
          <p className="text-xs text-muted-foreground">
            {claim.property.address}, {claim.property.city}
          </p>
          {claim.property.source_url && (
            <a
              href={claim.property.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1 mt-1"
            >
              <ExternalLink className="w-3 h-3" />
              Original listing
            </a>
          )}
        </div>
      )}

      {claim.verification_note && (
        <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">
          "{claim.verification_note}"
        </p>
      )}

      {claim.status === 'pending' && (
        <div className="space-y-2">
          <div
            className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-foreground"
            onClick={() => setShowNotes(!showNotes)}
          >
            {showNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Add review note
          </div>
          {showNotes && (
            <Textarea
              placeholder="Internal note (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="text-sm"
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/5"
              disabled={rejectRequest.isPending}
              onClick={() => rejectRequest.mutate({ claimId: claim.id, notes })}
            >
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Reject
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={approveRequest.isPending}
              onClick={() =>
                approveRequest.mutate({
                  claimId: claim.id,
                  propertyId: claim.property_id,
                  agencyId: claim.agency_id || undefined,
                  notes,
                })
              }
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Approve & Publish
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AdminScrapingSources() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [agencySearch, setAgencySearch] = useState('');
  const [activeTab, setActiveTab] = useState<'sources' | 'claims'>('sources');

  const { data: sources = [], isLoading: sourcesLoading } = useAgencySources();
  const { data: stats } = useAgencySourceStats();
  const { data: claimStats } = useClaimRequestStats();
  const { data: pendingClaims = [], isLoading: claimsLoading } = useClaimRequests('pending');
  const { data: allClaims = [], isLoading: allClaimsLoading } = useClaimRequests();
  const triggerNightly = useTriggerNightlySync();

  const filteredSources = search
    ? sources.filter(
        (s) =>
          s.agency?.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.source_url.toLowerCase().includes(search.toLowerCase())
      )
    : sources;

  // Group by agency
  const byAgency: Record<string, AgencySource[]> = {};
  filteredSources.forEach((s) => {
    const key = s.agency?.name || s.agency_id;
    if (!byAgency[key]) byAgency[key] = [];
    byAgency[key].push(s);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-5xl"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Scraping Sources</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage the agencies and portals scraped nightly for new listings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={triggerNightly.isPending}
            onClick={() => triggerNightly.mutate()}
          >
            {triggerNightly.isPending
              ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
              : <Zap className="w-4 h-4 mr-2" />}
            Run full sync now
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add source
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total sources', value: stats?.total ?? '—', icon: Globe, variant: 'default' as const },
          { label: 'Active', value: stats?.active ?? '—', icon: CheckCircle2, variant: 'default' as const },
          { label: 'Failing', value: stats?.failing ?? '—', icon: AlertTriangle, variant: (stats?.failing || 0) > 0 ? 'danger' : 'default' as any },
          { label: 'Pending claims', value: claimStats?.pending ?? '—', icon: ClipboardCheck, variant: (claimStats?.pending || 0) > 0 ? 'warn' : 'default' as any },
        ].map(({ label, value, icon: Icon, variant }) => (
          <Card key={label}>
            <CardContent className="pt-5 flex items-center gap-3">
              <Icon className={cn('h-5 w-5', variant === 'danger' ? 'text-destructive' : variant === 'warn' ? 'text-semantic-amber' : 'text-muted-foreground')} />
              <div>
                <div className={cn('text-2xl font-bold', variant === 'danger' ? 'text-destructive' : variant === 'warn' ? 'text-semantic-amber' : 'text-foreground')}>{value}</div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList>
          <TabsTrigger value="sources">
            Sources
            {stats?.total ? <Badge variant="secondary" className="ml-2 text-xs">{stats.total}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="claims">
            Claim Requests
            {(claimStats?.pending || 0) > 0 && (
              <Badge className="ml-2 text-xs bg-semantic-amber text-semantic-amber-foreground">{claimStats?.pending}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search agencies or URLs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {sourcesLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : Object.keys(byAgency).length === 0 ? (
            <Card className="p-8 text-center">
              <Globe className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No sources configured yet. Add one above.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(byAgency).map(([agencyName, agencySources]) => (
                <Card key={agencyName}>
                  <CardHeader className="py-3 px-4 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{agencyName}</CardTitle>
                      <div className="flex gap-1">
                        {agencySources.map((s) => (
                          <Badge key={s.id} className={cn('text-xs', SOURCE_LABELS[s.source_type]?.color)}>
                            {SOURCE_LABELS[s.source_type]?.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 space-y-1">
                    {agencySources.map((s) => <SourceRow key={s.id} source={s} />)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Claims Tab */}
        <TabsContent value="claims" className="space-y-4 mt-4">
          {claimsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)}
            </div>
          ) : allClaims.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardCheck className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No claim requests yet.</p>
            </Card>
          ) : (
            <>
              {pendingClaims.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-semantic-amber">
                    {pendingClaims.length} pending review
                  </p>
                  {pendingClaims.map((c) => <ClaimRow key={c.id} claim={c} />)}
                </div>
              )}
              {allClaims.filter((c) => c.status !== 'pending').length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Reviewed</p>
                  {allClaims
                    .filter((c) => c.status !== 'pending')
                    .map((c) => <ClaimRow key={c.id} claim={c} />)}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      <AddSourceDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </motion.div>
  );
}
