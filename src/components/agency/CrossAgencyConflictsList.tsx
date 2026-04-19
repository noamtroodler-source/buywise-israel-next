/**
 * CrossAgencyConflictsList
 *
 * Shared component used by both agency portal (/agency/conflicts) and
 * admin portal (/admin/cross-agency-conflicts). Shows pending duplicate
 * imports from different agencies for the same listing, and lets the
 * viewer resolve ownership.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink, ShieldCheck, Sparkles, Undo2, Users, X, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  useCrossAgencyConflicts,
  useResolveCrossAgencyConflict,
  type CrossAgencyConflict,
  type ConflictResolution,
} from '@/hooks/useCrossAgencyConflicts';
import { useAppealConflict } from '@/hooks/useAppealConflict';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  agencyId?: string; // If set, shows only conflicts involving this agency
  isAdmin?: boolean; // Admin sees all + can resolve any conflict
  statusFilter?: 'pending' | 'all'; // Defaults to 'pending'
}

export function CrossAgencyConflictsList({ agencyId, isAdmin = false, statusFilter = 'pending' }: Props) {
  const { data: conflicts, isLoading } = useCrossAgencyConflicts(agencyId, statusFilter);
  const [active, setActive] = useState<{ conflict: CrossAgencyConflict; resolution: ConflictResolution } | null>(null);
  const [appealing, setAppealing] = useState<CrossAgencyConflict | null>(null);
  const [notes, setNotes] = useState('');
  const [appealReason, setAppealReason] = useState('');
  const resolve = useResolveCrossAgencyConflict();
  const appeal = useAppealConflict();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!conflicts || conflicts.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-12 text-center">
          <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
          <h3 className="font-semibold mb-1">No cross-agency conflicts</h3>
          <p className="text-sm text-muted-foreground">
            All listing imports are clean — no duplicate ownership disputes detected.
          </p>
        </CardContent>
      </Card>
    );
  }

  const openDialog = (conflict: CrossAgencyConflict, resolution: ConflictResolution) => {
    setActive({ conflict, resolution });
    setNotes('');
  };

  const submitResolution = async () => {
    if (!active) return;
    await resolve.mutateAsync({
      conflictId: active.conflict.id,
      resolution: active.resolution,
      notes: notes.trim() || undefined,
    });
    setActive(null);
  };

  const canAppeal = (c: CrossAgencyConflict) => {
    if (!c.appealable_until || c.status === 'pending') return false;
    if (new Date(c.appealable_until) < new Date()) return false;
    // Admins can appeal anything; agencies can appeal if involved
    if (isAdmin) return true;
    return !!agencyId && (agencyId === c.existing_agency_id || agencyId === c.attempted_agency_id);
  };

  return (
    <>
      <div className="space-y-3">
        {conflicts.map((c) => {
          const isResolved = c.status !== 'pending';
          return (
          <Card key={c.id} className={`rounded-2xl ${isResolved ? 'border-border opacity-90' : 'border-amber-500/30'}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${isResolved ? 'text-muted-foreground' : 'text-amber-600'}`} />
                    <h3 className="font-semibold text-sm">
                      {isResolved ? 'Resolved conflict' : 'Ownership conflict'}
                    </h3>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30 text-[10px]">
                      {c.similarity_score}% match
                    </Badge>
                    {c.auto_resolved && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px]">
                        <Sparkles className="w-2.5 h-2.5 mr-1" />
                        Auto-resolved
                      </Badge>
                    )}
                    {isResolved && c.appealable_until && new Date(c.appealable_until) > new Date() && (
                      <Badge variant="outline" className="text-[10px]">
                        Appeal window: {formatDistanceToNow(new Date(c.appealable_until))} left
                      </Badge>
                    )}
                  </div>
                  <Link
                    to={`/property/${c.existing_property_id}`}
                    className="text-sm font-medium hover:underline block truncate"
                  >
                    {c.property?.title || c.match_details?.address || 'Untitled listing'}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {c.property?.city || c.match_details?.city} · {c.match_details?.bedrooms ?? '?'}br · {c.match_details?.size_sqm ?? '?'} m²
                    {c.match_details?.price ? ` · ₪${Number(c.match_details.price).toLocaleString()}` : ''}
                  </p>
                  {c.auto_resolution_reason && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">
                      Reason: {c.auto_resolution_reason.replace(/_/g, ' ')}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </p>
              </div>

              {/* Two agency columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">
                      Already published
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm">{c.existing_agency?.name || 'Unknown agency'}</p>
                  {c.existing_source_url && (
                    <a
                      href={c.existing_source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:underline truncate flex items-center gap-1 mt-1"
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate">{c.existing_source_url}</span>
                    </a>
                  )}
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">
                      Tried to import
                    </Badge>
                  </div>
                  <p className="font-semibold text-sm">{c.attempted_agency?.name || 'Unknown agency'}</p>
                  <a
                    href={c.attempted_source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground hover:underline truncate flex items-center gap-1 mt-1"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{c.attempted_source_url}</span>
                  </a>
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap gap-2 pt-3 border-t">
                {!isResolved && (
                  <>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => openDialog(c, 'co_listing_confirmed')}>
                      <Users className="w-3 h-3 mr-1.5" />
                      Both legitimate (co-listing)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10"
                      onClick={() => openDialog(c, 'existing_agency_confirmed')}
                    >
                      <ShieldCheck className="w-3 h-3 mr-1.5" />
                      {c.existing_agency?.name || 'Existing'} owns it
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-amber-500/40 text-amber-700 hover:bg-amber-500/10"
                      onClick={() => openDialog(c, 'attempted_agency_confirmed')}
                    >
                      <ShieldCheck className="w-3 h-3 mr-1.5" />
                      {c.attempted_agency?.name || 'Attempted'} owns it
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground"
                        onClick={() => openDialog(c, 'dismissed')}
                      >
                        <X className="w-3 h-3 mr-1.5" />
                        Dismiss (false match)
                      </Button>
                    )}
                  </>
                )}
                {canAppeal(c) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => { setAppealing(c); setAppealReason(''); }}
                  >
                    <Undo2 className="w-3 h-3 mr-1.5" />
                    Appeal resolution
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {active?.resolution === 'co_listing_confirmed' && 'Mark as co-listing'}
              {active?.resolution === 'existing_agency_confirmed' && `Confirm ${active.conflict.existing_agency?.name} ownership`}
              {active?.resolution === 'attempted_agency_confirmed' && `Transfer to ${active.conflict.attempted_agency?.name}`}
              {active?.resolution === 'dismissed' && 'Dismiss as false match'}
            </DialogTitle>
            <DialogDescription>
              {active?.resolution === 'co_listing_confirmed' &&
                'Both agencies legitimately represent this listing. No blocklist will be applied.'}
              {active?.resolution === 'existing_agency_confirmed' &&
                'The attempted agency will be blocked from re-importing this URL in future syncs.'}
              {active?.resolution === 'attempted_agency_confirmed' &&
                'The listing will be transferred to the attempted agency immediately, and the existing agency will be blocked from re-importing it.'}
              {active?.resolution === 'dismissed' &&
                'The match was a false positive. No action will be taken.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Resolution notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button onClick={submitResolution} disabled={resolve.isPending}>
              {resolve.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!appealing} onOpenChange={(open) => !open && setAppealing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appeal this resolution</DialogTitle>
            <DialogDescription>
              Re-opens the conflict for review, reverses any property transfer, and removes blocklist entries created by the original resolution. Available within 7 days of resolution.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Why are you appealing? (recommended)"
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAppealing(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!appealing) return;
                const aId = agencyId || appealing.existing_agency_id || appealing.attempted_agency_id;
                if (!aId) return;
                await appeal.mutateAsync({ conflictId: appealing.id, appealingAgencyId: aId, reason: appealReason.trim() || undefined });
                setAppealing(null);
              }}
              disabled={appeal.isPending}
            >
              {appeal.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit appeal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
