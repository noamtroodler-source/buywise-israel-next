import { useMemo } from 'react';
import { Loader2, ExternalLink, Check, X, Sparkles, Home, MapPin, DollarSign, Bed, Bath, Ruler, Building, Calendar, Car, Thermometer, Image as ImageIcon, FileText, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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

type ReviewField = {
  label: string;
  value: unknown;
  required?: boolean;
  formatter?: (value: any) => string;
};

type ReviewSection = {
  title: string;
  icon: any;
  fields: ReviewField[];
};

const formatPrice = (value: any) => value ? `₪${Number(value).toLocaleString()}` : '';
const formatSqm = (value: any) => value ? `${Number(value).toLocaleString()} m²` : '';
const formatDate = (value: any) => value ? new Date(value).toLocaleDateString() : '';
const formatBoolean = (value: any) => value === true ? 'Yes' : value === false ? 'No' : '';
const formatList = (value: any) => Array.isArray(value) && value.length ? value.join(', ') : '';

function hasValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function displayValue(field: ReviewField) {
  if (!hasValue(field.value)) return 'Missing';
  if (field.formatter) return field.formatter(field.value);
  return String(field.value).replace(/_/g, ' ');
}

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

  const sections: ReviewSection[] = [
    {
      title: 'Property Basics',
      icon: Home,
      fields: [
        { label: 'Listing title', value: listing.title, required: true },
        { label: 'Property type', value: listing.property_type, required: true },
        { label: 'Listing type', value: listing.listing_status, required: true },
        { label: 'Price', value: listing.price, required: true, formatter: formatPrice },
        { label: 'City', value: listing.city, required: true },
        { label: 'Neighborhood', value: listing.neighborhood, required: true },
        { label: 'Address', value: listing.address, required: true },
        { label: 'Map pin', value: listing.latitude && listing.longitude ? `${listing.latitude}, ${listing.longitude}` : null, required: true },
        { label: 'Source', value: listing.import_source },
      ],
    },
    {
      title: 'Property Details',
      icon: Ruler,
      fields: [
        { label: 'Bedrooms', value: listing.bedrooms, required: true },
        { label: 'Other rooms', value: listing.additional_rooms },
        { label: 'Bathrooms', value: listing.bathrooms, required: true },
        { label: 'Living area', value: listing.size_sqm, required: true, formatter: formatSqm },
        { label: 'Lot size', value: listing.lot_size_sqm, formatter: formatSqm },
        { label: 'Floor', value: listing.floor, required: true },
        { label: 'Total floors', value: listing.total_floors, required: true },
        { label: 'Year built', value: listing.year_built },
        { label: 'Parking', value: listing.parking },
      ],
    },
    {
      title: 'Features & Amenities',
      icon: Sparkles,
      fields: [
        { label: 'Condition', value: listing.condition },
        { label: 'Air conditioning', value: listing.ac_type },
        { label: 'Entry date', value: listing.entry_date, formatter: formatDate },
        { label: 'Vaad bayit', value: listing.vaad_bayit_monthly, formatter: formatPrice },
        { label: 'Features', value: listing.features, formatter: formatList },
        { label: 'Featured highlight', value: listing.featured_highlight },
        { label: 'Furnished status', value: listing.furnished_status },
        { label: 'Furniture items', value: listing.furniture_items, formatter: formatList },
        { label: 'Pets policy', value: listing.pets_policy },
        { label: 'Lease term', value: listing.lease_term },
        { label: 'Subletting', value: listing.subletting_allowed },
        { label: 'Agent fee required', value: listing.agent_fee_required, formatter: formatBoolean },
      ],
    },
    {
      title: 'Photos',
      icon: ImageIcon,
      fields: [
        { label: 'Photo count', value: listing.images?.length || null, required: true },
      ],
    },
    {
      title: 'Description',
      icon: FileText,
      fields: [
        { label: 'Original description', value: listing.description, required: true },
        { label: 'AI English description', value: listing.ai_english_description },
      ],
    },
  ];

  const flatFields = sections.flatMap(section => section.fields);
  const presentCount = flatFields.filter(field => hasValue(field.value)).length;
  const requiredMissing = flatFields.filter(field => field.required && !hasValue(field.value));
  const completeness = Math.round((presentCount / flatFields.length) * 100);

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
          {/* Wizard-style audit overview */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Listing completeness</p>
                <p className="mt-1 text-2xl font-bold">{completeness}%</p>
                <p className="text-xs text-muted-foreground">
                  {presentCount}/{flatFields.length} fields found · {requiredMissing.length} required missing
                </p>
              </div>
              <Badge variant="outline" className={cn(
                'rounded-lg',
                requiredMissing.length ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
              )}>
                {requiredMissing.length ? 'Needs review' : 'Core complete'}
              </Badge>
            </div>
            {requiredMissing.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {requiredMissing.map(field => (
                  <Badge key={field.label} variant="outline" className="rounded-lg border-amber-500/20 bg-background text-xs">
                    <AlertCircle className="mr-1 h-3 w-3 text-amber-600" /> {field.label}
                  </Badge>
                ))}
              </div>
            )}
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

          <div className="space-y-4">
            {sections.map(section => {
              const Icon = section.icon;
              const missingRequired = section.fields.filter(field => field.required && !hasValue(field.value)).length;
              return (
                <Card key={section.title} className="overflow-hidden rounded-2xl border-border/70">
                  <CardContent className="p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="font-semibold">{section.title}</h3>
                      </div>
                      {missingRequired > 0 ? (
                        <Badge variant="outline" className="rounded-lg border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400">
                          {missingRequired} missing
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-lg border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                          Complete
                        </Badge>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {section.fields.map(field => {
                        const present = hasValue(field.value);
                        return (
                          <div
                            key={field.label}
                            className={cn(
                              'rounded-xl border p-3 text-sm',
                              present ? 'border-border bg-background' : field.required ? 'border-amber-500/20 bg-amber-500/10' : 'border-border bg-muted/30',
                            )}
                          >
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-muted-foreground">{field.label}{field.required ? ' *' : ''}</span>
                              {present ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                            <div className={cn('break-words font-medium capitalize', !present && 'text-muted-foreground')}>
                              {displayValue(field)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {section.title === 'Photos' && listing.images && listing.images.length > 0 && (
                      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                        {listing.images.map((img, i) => (
                          <img key={`${img}-${i}`} src={img} alt={`Listing photo ${i + 1}`} className="h-16 w-16 flex-shrink-0 rounded-xl object-cover" loading="lazy" />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

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
