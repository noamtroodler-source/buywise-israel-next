import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { BookOpen, ExternalLink, Flame } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  useAdminPendingDeepReads,
  useUpdateDeepRead,
  DeepReadSubheads,
} from '@/hooks/useIntelDeepRead';
import { VoiceLinter } from '@/components/intel/VoiceLinter';

const LABELS = ['What This Means', 'Buyer Impact', 'Watch List', 'Reality Check', 'BuyWise View'];

const SECTION_META: { key: keyof DeepReadSubheads; label: string; hint: string; cap: number }[] = [
  { key: 'context', label: 'Context', hint: 'Backdrop. Why is this happening now?', cap: 80 },
  { key: 'what_changed', label: 'What changed', hint: 'Old state → new state. Use the source\'s numbers.', cap: 80 },
  { key: 'numbers', label: 'The numbers', hint: 'Rate, %, ₪, timeline. Or say what we\'d need to know.', cap: 90 },
  { key: 'what_to_watch', label: 'What to watch', hint: 'Forward-looking observation. Not advice.', cap: 80 },
  { key: 'caveats', label: 'Caveats', hint: 'What\'s unverified. Never empty.', cap: 60 },
];

const countWords = (s: string) => (s?.trim() ? s.trim().split(/\s+/).length : 0);

export function DeepReadQueueTab() {
  const { data: pending = [], isLoading } = useAdminPendingDeepReads();
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Flame className="h-5 w-5 text-primary" />
              Deep Reads pending review
            </h2>
            <p className="text-xs text-muted-foreground">
              Auto-classified during the 48h fetch. Edit, publish, or reject. Max 2 should sit here at a time.
            </p>
          </div>
          <Badge variant={pending.length > 2 ? 'destructive' : 'secondary'}>
            {pending.length} pending
          </Badge>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Loading queue…</CardContent></Card>
      ) : pending.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">Queue is empty. The classifier will surface qualifying stories on the next fetch cycle.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((p: any) => {
            const a = p.article;
            const headline = a?.headline_en || a?.headline || '(untitled)';
            return (
              <Card key={p.id} className="border-l-4 border-l-primary/60">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <span className="font-semibold text-foreground/80">{a?.source_name}</span>
                        {a?.published_at && <span>· {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}</span>}
                        <Badge variant="outline" className="text-[9px]">{a?.category}</Badge>
                        {p.ai_drafted && <Badge variant="secondary" className="text-[9px]">AI-drafted</Badge>}
                      </div>
                      <h3 className="text-lg font-semibold leading-snug text-foreground">{headline}</h3>
                      {p.signal && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          <span className="font-semibold uppercase tracking-wide text-primary">Signal · </span>
                          {p.signal}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" onClick={() => setEditing(p)}>
                        Review
                      </Button>
                      {a?.url && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editing && <DeepReadEditor item={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function DeepReadEditor({ item, onClose }: { item: any; onClose: () => void }) {
  const subhedsInit: DeepReadSubheads = item.deep_read_subheads ?? {
    context: '', what_changed: '', numbers: '', what_to_watch: '', caveats: '',
  };
  const [label, setLabel] = useState<string>(item.take_label ?? 'BuyWise View');
  const [subs, setSubs] = useState<DeepReadSubheads>(subhedsInit);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const update = useUpdateDeepRead();

  useEffect(() => setSubs(subhedsInit), [item.id]); // eslint-disable-line

  const totalWords = useMemo(
    () => SECTION_META.reduce((n, s) => n + countWords(subs[s.key]), 0),
    [subs],
  );
  const overTotal = totalWords > 400;
  const tooThin = totalWords < 200;

  const setField = (key: keyof DeepReadSubheads, val: string) =>
    setSubs((prev) => ({ ...prev, [key]: val }));

  const a = item.article;
  const headline = a?.headline_en || a?.headline || '(untitled)';

  const handle = async (action: 'save_draft' | 'publish' | 'reject') => {
    if (action === 'publish') {
      const missing = SECTION_META.filter((s) => !subs[s.key]?.trim());
      if (missing.length) return alert(`Fill in: ${missing.map((m) => m.label).join(', ')}`);
      if (overTotal) return alert('Trim to 400 words total before publishing.');
    }
    await update.mutateAsync({
      id: item.id,
      take_label: label,
      subheads: subs,
      action,
      rejected_reason: action === 'reject' ? rejectReason || 'No reason given' : undefined,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" /> Review Deep Read
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{headline}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <Label>Label</Label>
              <Select value={label} onValueChange={setLabel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right text-xs">
              <div className={`tabular-nums ${overTotal ? 'text-destructive' : tooThin ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {totalWords} / 250–400 words
              </div>
            </div>
          </div>

          {/* 3-beat preview (read-only — those came from breakdown) */}
          {(item.signal || item.why_you_care || item.our_move) && (
            <div className="rounded-md border border-border bg-muted/30 p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                3-beat summary (from Breakdown)
              </p>
              <div className="space-y-2 text-sm">
                {item.signal && <p><span className="font-semibold text-primary">Signal · </span>{item.signal}</p>}
                {item.why_you_care && <p><span className="font-semibold text-primary">Why you care · </span>{item.why_you_care}</p>}
                {item.our_move && <p><span className="font-semibold text-primary">Our move · </span>{item.our_move}</p>}
              </div>
            </div>
          )}

          {/* Editable sections */}
          {SECTION_META.map((s) => {
            const val = subs[s.key];
            const words = countWords(val);
            const over = words > s.cap;
            return (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="font-semibold">{s.label}</Label>
                  <span className={`text-[11px] tabular-nums ${over ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {words} / {s.cap} words
                  </span>
                </div>
                <p className="mb-1 text-[11px] text-muted-foreground">{s.hint}</p>
                <Textarea
                  value={val}
                  onChange={(e) => setField(s.key, e.target.value)}
                  rows={s.key === 'numbers' || s.key === 'context' ? 4 : 3}
                />
                <div className="mt-1.5">
                  <VoiceLinter text={val} label={s.label} />
                </div>
              </div>
            );
          })}

          {showReject && (
            <div>
              <Label>Why are you rejecting this?</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. duplicate of last week's story; speculation only"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {!showReject ? (
            <Button variant="ghost" className="mr-auto text-destructive" onClick={() => setShowReject(true)}>
              Reject
            </Button>
          ) : (
            <Button variant="destructive" className="mr-auto" onClick={() => handle('reject')} disabled={update.isPending}>
              Confirm reject
            </Button>
          )}
          <Button variant="outline" onClick={() => handle('save_draft')} disabled={update.isPending}>
            Save draft
          </Button>
          <Button onClick={() => handle('publish')} disabled={update.isPending || overTotal}>
            Publish Deep Read
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
