import { useMemo } from 'react';
import { Loader2, ExternalLink, Check, X, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ProvisioningListing,
  useAgencyAgents,
  useListingFlags,
  useResolveFlag,
  useUpdateListing,
} from '@/hooks/useAgencyProvisioning';

type Props = {
  agencyId: string;
  listing: ProvisioningListing | null;
  onClose: () => void;
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  info: 'bg-muted text-muted-foreground border-border',
};

export function ListingDetailDrawer({ agencyId, listing, onClose }: Props) {
  const open = !!listing;
  const ids = useMemo(() => (listing ? [listing.id] : []), [listing?.id]);
  const { data: flags = [], isLoading: flagsLoading } = useListingFlags(agencyId, ids);
  const { data: agents = [] } = useAgencyAgents(agencyId);
  const resolveFlag = useResolveFlag(agencyId);
  const updateListing = useUpdateListing(agencyId);

  if (!listing) return null;

  const suggestions = listing.ai_suggestions || {};
  const suggestionKeys = Object.keys(suggestions).filter(
    k => k !== 'confidence' && k !== 'suggested_at' && (suggestions as any)[k] != null,
  );

  function applySuggestion(field: string) {
    const value = (suggestions as any)[field];
    const patch: any = { [field]: value };
    const remaining = { ...suggestions } as any;
    delete remaining[field];
    patch.ai_suggestions = remaining;
    updateListing.mutate({ id: listing!.id, patch });
  }

  function dismissSuggestion(field: string) {
    const remaining = { ...suggestions } as any;
    delete remaining[field];
    updateListing.mutate({ id: listing!.id, patch: { ai_suggestions: remaining } });
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">{listing.address}</SheetTitle>
          <p className="text-sm text-muted-foreground">{listing.city}</p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Snapshot */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="font-medium">
                {listing.price ? `₪${Number(listing.price).toLocaleString()}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Size</div>
              <div className="font-medium">{listing.size_sqm ? `${listing.size_sqm} m²` : '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Bedrooms</div>
              <div className="font-medium">{listing.bedrooms ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Score</div>
              <div className="font-medium">{listing.quality_audit_score ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{listing.provisioning_audit_status ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Photos</div>
              <div className="font-medium">{listing.images?.length ?? 0}</div>
            </div>
          </div>

          {listing.source_url && (
            <a
              href={listing.source_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs inline-flex items-center gap-1 text-primary hover:underline"
            >
              View source <ExternalLink className="h-3 w-3" />
            </a>
          )}

          <Separator />

          {/* Agent assignment */}
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Assigned agent</Label>
            <Select
              value={listing.agent_id || 'unassigned'}
              onValueChange={v =>
                updateListing.mutate({
                  id: listing.id,
                  patch: { agent_id: v === 'unassigned' ? null : v },
                })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} {a.is_provisional ? '(provisional)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Quality flags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs uppercase text-muted-foreground">Quality flags</Label>
              <span className="text-xs text-muted-foreground">{flags.length} active</span>
            </div>
            {flagsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : flags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active flags. ✅</p>
            ) : (
              <ul className="space-y-2">
                {flags.map(f => (
                  <li
                    key={f.id}
                    className={`border rounded-md p-2 text-sm flex items-start justify-between gap-2 ${SEVERITY_COLOR[f.severity]}`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase">{f.flag_type.replace(/_/g, ' ')}</div>
                      {f.message && <div className="text-xs mt-0.5">{f.message}</div>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 shrink-0"
                      onClick={() => resolveFlag.mutate(f.id)}
                      disabled={resolveFlag.isPending}
                    >
                      Resolve
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          {/* AI suggestions */}
          <div>
            <Label className="text-xs uppercase text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI suggestions
            </Label>
            {suggestionKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground mt-2">No pending suggestions.</p>
            ) : (
              <ul className="space-y-2 mt-2">
                {suggestionKeys.map(key => (
                  <li key={key} className="border rounded-md p-2 flex items-center justify-between gap-2">
                    <div className="text-sm min-w-0">
                      <span className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                      <span className="font-medium">{String((suggestions as any)[key])}</span>
                      {suggestions.confidence && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {String(suggestions.confidence)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => applySuggestion(key)}>
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => dismissSuggestion(key)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Separator />

          {/* Quick edit core fields */}
          <div>
            <Label className="text-xs uppercase text-muted-foreground">Quick edit</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <Label className="text-xs">Year built</Label>
                <Input
                  type="number"
                  defaultValue={listing.year_built ?? ''}
                  onBlur={e => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    if (v !== listing.year_built) updateListing.mutate({ id: listing.id, patch: { year_built: v } });
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Parking</Label>
                <Input
                  type="number"
                  defaultValue={listing.parking ?? ''}
                  onBlur={e => {
                    const v = e.target.value ? Number(e.target.value) : null;
                    if (v !== listing.parking) updateListing.mutate({ id: listing.id, patch: { parking: v } });
                  }}
                />
              </div>
            </div>
          </div>

          {/* English description */}
          {(listing.ai_english_description || listing.description) && (
            <>
              <Separator />
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap leading-relaxed">
                  {listing.ai_english_description || listing.description}
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
