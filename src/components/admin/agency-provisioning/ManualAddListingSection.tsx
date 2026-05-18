import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PencilLine, Sparkles, FileClock, ArrowRight, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AiListingKickstartDialog } from './AiListingKickstartDialog';

const KICKSTART_DRAFT_PREFIX = 'ai-kickstart-draft:';
const WIZARD_DRAFT_PREFIX = 'agency-property-wizard-draft:';

interface DraftSummary {
  kind: 'kickstart' | 'wizard';
  title: string;
  savedAt?: string;
  storageKey: string;
}

function readDrafts(agencyId: string): DraftSummary[] {
  const out: DraftSummary[] = [];
  try {
    const k = localStorage.getItem(`${KICKSTART_DRAFT_PREFIX}${agencyId}`);
    if (k) {
      const parsed = JSON.parse(k);
      const title =
        parsed?.extracted?.title ||
        (parsed?.description ? parsed.description.slice(0, 60) : null) ||
        (Array.isArray(parsed?.images) && parsed.images.length > 0
          ? `${parsed.images.length} photo${parsed.images.length === 1 ? '' : 's'} uploaded`
          : null) ||
        'Untitled AI kickstart';
      out.push({
        kind: 'kickstart',
        title,
        savedAt: parsed?.savedAt,
        storageKey: `${KICKSTART_DRAFT_PREFIX}${agencyId}`,
      });
    }
  } catch {}
  try {
    const w = localStorage.getItem(`${WIZARD_DRAFT_PREFIX}${agencyId}`);
    if (w) {
      const parsed = JSON.parse(w);
      const title = parsed?.data?.title || parsed?.data?.address || 'Untitled wizard draft';
      out.push({
        kind: 'wizard',
        title,
        savedAt: parsed?.savedAt,
        storageKey: `${WIZARD_DRAFT_PREFIX}${agencyId}`,
      });
    }
  } catch {}
  return out;
}

function formatAgo(iso?: string) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return null;
  const m = Math.round(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Admin shortcut: open the standard agency listing wizard to add a property
 * manually for the agency being provisioned. Two entry points:
 *   1. "Kickstart with AI" — drop screenshots + notes, AI pre-fills the wizard.
 *   2. "New listing" — open the empty wizard.
 *
 * Shows any unfinished local drafts (AI kickstart sessions or wizard drafts)
 * for this agency so admins can resume work that never made it to a saved DB
 * draft.
 */
export function ManualAddListingSection({ agencyId, agencyName }: { agencyId: string; agencyName?: string }) {
  const [aiOpen, setAiOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftSummary[]>([]);

  const refreshDrafts = useCallback(() => {
    setDrafts(readDrafts(agencyId));
  }, [agencyId]);

  useEffect(() => {
    refreshDrafts();
    const interval = window.setInterval(refreshDrafts, 3000);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes(agencyId)) refreshDrafts();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
    };
  }, [agencyId, refreshDrafts]);

  const discardDraft = (key: string) => {
    if (!confirm('Discard this local draft? Uploaded photos stay in storage.')) return;
    try { localStorage.removeItem(key); } catch {}
    refreshDrafts();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PencilLine className="h-4 w-4 text-primary" />
          Add a listing manually
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Skip the URL import and create a listing by hand for
            {agencyName ? ` ${agencyName}` : ' this agency'} — full wizard with photos,
            pricing context, and amenities. Use AI Kickstart to pre-fill from screenshots
            and notes.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button onClick={() => setAiOpen(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Kickstart with AI
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/agency/properties/new?agencyId=${agencyId}&adminProvisioning=1`}>
                <Plus className="h-4 w-4 mr-2" />
                New listing
              </Link>
            </Button>
          </div>
        </div>

        {drafts.length > 0 && (
          <div className="space-y-2 rounded-lg border border-dashed bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <FileClock className="h-3.5 w-3.5" />
              Drafts in progress for this agency — not yet pushed to a listing
            </div>
            <div className="space-y-2">
              {drafts.map((d) => {
                const ago = formatAgo(d.savedAt);
                return (
                  <div
                    key={d.storageKey}
                    className="flex items-center justify-between gap-3 rounded-md border bg-background p-2.5"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{d.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {d.kind === 'kickstart' ? 'AI Kickstart draft' : 'Wizard draft'}
                        {ago ? ` · saved ${ago}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {d.kind === 'kickstart' ? (
                        <Button size="sm" variant="outline" onClick={() => setAiOpen(true)}>
                          Resume <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/agency/properties/new?agencyId=${agencyId}&adminProvisioning=1`}>
                            Resume <ArrowRight className="h-3.5 w-3.5 ml-1" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => discardDraft(d.storageKey)}
                        aria-label="Discard draft"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      <AiListingKickstartDialog
        open={aiOpen}
        onOpenChange={(v) => {
          setAiOpen(v);
          if (!v) refreshDrafts();
        }}
        agencyId={agencyId}
      />
    </Card>
  );
}
