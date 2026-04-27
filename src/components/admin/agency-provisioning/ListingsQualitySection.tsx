import { useMemo, useState } from 'react';
import { Loader2, Play, RefreshCw, CheckCircle2, AlertTriangle, AlertOctagon, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ProvisioningListing,
  useAgencyAgents,
  useAgencyListings,
  useBulkUpdateListings,
  useListingFlags,
  useRunListingsAudit,
} from '@/hooks/useAgencyProvisioning';
import { ListingDetailDrawer } from './ListingDetailDrawer';

type Filter = 'all' | 'ready' | 'review' | 'critical';
type PriceSort = 'none' | 'price_desc' | 'price_asc';

const STATUS_BADGE: Record<string, { label: string; cls: string; icon: any }> = {
  approved: { label: 'Ready', cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  pending: { label: 'Review', cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', icon: AlertTriangle },
  flagged: { label: 'Critical', cls: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertOctagon },
  reviewed: { label: 'Reviewed', cls: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

export function ListingsQualitySection({ agencyId }: { agencyId: string }) {
  const { data: listings = [], isLoading, refetch } = useAgencyListings(agencyId);
  const { data: agents = [] } = useAgencyAgents(agencyId);
  const runAudit = useRunListingsAudit();
  const bulkUpdate = useBulkUpdateListings(agencyId);

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [priceSort, setPriceSort] = useState<PriceSort>('none');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerListing, setDrawerListing] = useState<ProvisioningListing | null>(null);
  const [bulkAgent, setBulkAgent] = useState<string>('');

  const propertyIds = useMemo(() => listings.map(l => l.id), [listings]);
  const { data: flags = [] } = useListingFlags(agencyId, propertyIds);

  const flagCountByProperty = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of flags) m.set(f.property_id, (m.get(f.property_id) || 0) + 1);
    return m;
  }, [flags]);

  const getDisplayScore = (listing: ProvisioningListing) =>
    listing.quality_audit_score ?? listing.data_quality_score ?? null;

  const getDisplayFlagCount = (listing: ProvisioningListing) => {
    const auditFlags = flagCountByProperty.get(listing.id) || 0;
    if (auditFlags > 0) return auditFlags;
    if (listing.provisioning_audit_status === 'flagged') return 1;
    const score = getDisplayScore(listing);
    return score != null && score < 70 ? 1 : 0;
  };

  const summary = useMemo(() => {
    let ready = 0, review = 0, critical = 0;
    for (const l of listings) {
      if (l.provisioning_audit_status === 'approved' || l.provisioning_audit_status === 'reviewed') ready++;
      else if (l.provisioning_audit_status === 'flagged') critical++;
      else if (l.provisioning_audit_status === 'pending') review++;
    }
    return { ready, review, critical, total: listings.length };
  }, [listings]);

  const filtered = useMemo(() => {
    const rows = listings.filter(l => {
      if (filter === 'ready' && !(l.provisioning_audit_status === 'approved' || l.provisioning_audit_status === 'reviewed')) return false;
      if (filter === 'review' && l.provisioning_audit_status !== 'pending') return false;
      if (filter === 'critical' && l.provisioning_audit_status !== 'flagged') return false;
      if (search && !`${l.address} ${l.city}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    if (priceSort === 'price_desc') return [...rows].sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    if (priceSort === 'price_asc') return [...rows].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    return rows;
  }, [listings, filter, search, priceSort]);

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(l => l.id)));
  }

  async function handleBulkAssign() {
    if (!bulkAgent || selected.size === 0) return;
    await bulkUpdate.mutateAsync({
      ids: Array.from(selected),
      patch: { agent_id: bulkAgent === 'unassigned' ? null : bulkAgent },
    });
    setSelected(new Set());
    setBulkAgent('');
  }

  async function handleBulkMarkReviewed() {
    if (selected.size === 0) return;
    await bulkUpdate.mutateAsync({
      ids: Array.from(selected),
      patch: { provisioning_audit_status: 'reviewed' },
    });
    setSelected(new Set());
  }

  return (
    <div className="border rounded-lg bg-card">
      <div className="p-4 border-b flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Listings & Quality</h2>
          <p className="text-sm text-muted-foreground">Audit, enrich, and assign before handover.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => runAudit.mutate({ agencyId })}
            disabled={runAudit.isPending || listings.length === 0}
          >
            {runAudit.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}
            Run audit
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="p-4 bg-muted/30 border-b">
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <span className="font-semibold">{summary.total} listings:</span>
          <span className="text-emerald-700 dark:text-emerald-400">✅ {summary.ready} ready</span>
          <span className="text-amber-700 dark:text-amber-400">⚠️ {summary.review} need review</span>
          <span className="text-destructive">🔴 {summary.critical} critical</span>
          <span className="text-muted-foreground ml-auto">
            Only critical and warnings need attention before handover.
          </span>
        </div>
      </div>

      {/* Filter chips + search */}
      <div className="p-4 border-b flex flex-wrap items-center gap-2">
        {(['all', 'ready', 'review', 'critical'] as Filter[]).map(f => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
        <Input
          placeholder="Search address or city…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto max-w-xs h-9"
        />
        <Select value={priceSort} onValueChange={(value) => setPriceSort(value as PriceSort)}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="Sort price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Default order</SelectItem>
            <SelectItem value="price_desc">Price high to low</SelectItem>
            <SelectItem value="price_asc">Price low to high</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="p-3 border-b bg-primary/5 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select value={bulkAgent} onValueChange={setBulkAgent}>
            <SelectTrigger className="w-48 h-8">
              <SelectValue placeholder="Assign to agent…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {agents.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleBulkAssign} disabled={!bulkAgent || bulkUpdate.isPending}>
            Apply
          </Button>
          <Button size="sm" variant="outline" onClick={handleBulkMarkReviewed} disabled={bulkUpdate.isPending}>
            Mark reviewed
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm">
          {listings.length === 0
            ? 'No listings yet. Import listings from the agency’s sources, then run the audit.'
            : 'No listings match the current filter.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-2 w-8">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="p-2 w-12">Photo</th>
                <th className="p-2 text-left">Address</th>
                <th className="p-2 text-right">Price</th>
                <th className="p-2 text-left">Agent</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-right">Score</th>
                <th className="p-2 text-right">Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => {
                const status = l.provisioning_audit_status || 'pending';
                const badge = STATUS_BADGE[status] || STATUS_BADGE.pending;
                const Icon = badge.icon;
                const agent = agents.find(a => a.id === l.agent_id);
                const photo = l.images?.[0];
                return (
                  <tr
                    key={l.id}
                    className="border-t hover:bg-muted/30 cursor-pointer"
                    onClick={() => setDrawerListing(l)}
                  >
                    <td className="p-2" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)} />
                    </td>
                    <td className="p-2">
                      {photo ? (
                        <img src={photo} alt="" className="h-10 w-10 rounded object-cover" loading="lazy" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <ImageOff className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-2 max-w-xs">
                      <div className="font-medium truncate">{l.address}</div>
                      <div className="text-xs text-muted-foreground truncate">{l.city}</div>
                    </td>
                    <td className="p-2 text-right whitespace-nowrap">
                      {l.price ? `₪${Number(l.price).toLocaleString()}` : '—'}
                    </td>
                    <td className="p-2">
                      {agent ? (
                        <span className="text-xs">{agent.name}</span>
                      ) : (
                        <span className="text-xs text-destructive">Unassigned</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className={`text-xs gap-1 ${badge.cls}`}>
                        <Icon className="h-3 w-3" />
                        {badge.label}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">{getDisplayScore(l) ?? '—'}</td>
                    <td className="p-2 text-right">
                      {getDisplayFlagCount(l) > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {getDisplayFlagCount(l)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ListingDetailDrawer agencyId={agencyId} listing={drawerListing} onClose={() => setDrawerListing(null)} />
    </div>
  );
}
