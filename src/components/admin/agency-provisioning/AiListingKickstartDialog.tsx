import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, X, Loader2, Wand2, ArrowRight, UserCheck, UserX, AlertTriangle, ImageIcon, ExternalLink, Check } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { defaultPropertyData, PropertyWizardData } from '@/components/agent/wizard/PropertyWizardContext';

const AGENCY_WIZARD_STORAGE_KEY = 'agency-property-wizard-draft';

interface UploadedImage {
  file: File;
  previewUrl: string;
  publicUrl?: string;
  uploading: boolean;
  enhancing?: boolean;
  enhanced?: boolean;
  error?: string;
}

interface ExtractedListing extends Partial<PropertyWizardData> {
  source_notes?: string[];
  low_confidence_fields?: string[];
  listing_status_confidence?: 'high' | 'low';
  detected_agent?: { name?: string; phone?: string; license_number?: string };
}

interface AgentMatch {
  agent_id: string;
  agent_name: string;
  basis: 'license_number' | 'phone' | 'name' | 'name_weak';
  confidence: 'high' | 'low';
}

interface DuplicateHit {
  id: string;
  title: string | null;
  address: string | null;
  city: string | null;
  price: number | null;
}

export function AiListingKickstartDialog({
  open,
  onOpenChange,
  agencyId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  agencyId: string;
}) {
  const navigate = useNavigate();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [description, setDescription] = useState('');
  const [hintIntent, setHintIntent] = useState<'auto' | 'for_sale' | 'for_rent'>('auto');
  const [hintCity, setHintCity] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedListing | null>(null);
  const [agentMatch, setAgentMatch] = useState<AgentMatch | null>(null);
  const [coverIndex, setCoverIndex] = useState<number | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateHit[]>([]);
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false);
  const [statusChoice, setStatusChoice] = useState<'for_sale' | 'for_rent' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    if (images.length + arr.length > 20) toast.warning('Up to 20 images at a time. Some were skipped.');
    const accepted = arr.slice(0, 20 - images.length);
    const newEntries: UploadedImage[] = accepted.map((file) => ({
      file, previewUrl: URL.createObjectURL(file), uploading: true,
    }));
    setImages((prev) => [...prev, ...newEntries]);

    for (const entry of newEntries) {
      try {
        const ext = entry.file.name.split('.').pop() || 'jpg';
        const path = `ai-kickstart/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from('property-images')
          .upload(path, entry.file, { contentType: entry.file.type });
        if (error) throw error;
        const { data } = supabase.storage.from('property-images').getPublicUrl(path);
        setImages((prev) => prev.map((it) => it === entry ? { ...it, uploading: false, publicUrl: data.publicUrl } : it));
      } catch (e: any) {
        setImages((prev) => prev.map((it) => it === entry ? { ...it, uploading: false, error: e?.message || 'Upload failed' } : it));
      }
    }
  }, [images.length]);

  const removeImage = (img: UploadedImage) => {
    URL.revokeObjectURL(img.previewUrl);
    setImages((prev) => prev.filter((it) => it !== img));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const checkDuplicates = async (ex: ExtractedListing) => {
    const city = (ex.city || '').trim();
    const price = Number(ex.price || 0);
    if (!city || price <= 0) {
      setDuplicates([]);
      return;
    }
    const min = Math.round(price * 0.95);
    const max = Math.round(price * 1.05);
    try {
      let q = supabase
        .from('properties')
        .select('id, title, address, city, price, bedrooms')
        .ilike('city', city)
        .gte('price', min)
        .lte('price', max)
        .limit(5);
      if (ex.bedrooms != null) q = q.eq('bedrooms', ex.bedrooms);
      const { data } = await q;
      setDuplicates((data || []) as DuplicateHit[]);
    } catch {
      setDuplicates([]);
    }
  };

  const analyze = async () => {
    const ready = images.filter((i) => i.publicUrl);
    if (ready.length === 0 && description.trim().length < 10) {
      toast.error('Add at least one image or a description (10+ characters).');
      return;
    }
    if (images.some((i) => i.uploading)) {
      toast.info('Wait for images to finish uploading…');
      return;
    }
    setAnalyzing(true);
    setExtracted(null);
    setAgentMatch(null);
    setCoverIndex(null);
    setDuplicates([]);
    setDuplicateAcknowledged(false);
    setStatusChoice(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-extract-listing', {
        body: {
          image_urls: ready.map((i) => i.publicUrl),
          description: description.trim(),
          agency_id: agencyId,
          hint: {
            ...(hintIntent !== 'auto' ? { listing_status: hintIntent } : {}),
            ...(hintCity.trim() ? { city: hintCity.trim() } : {}),
          },
        },
      });
      if (error) throw error;
      if (!data?.extracted) throw new Error('No data returned');
      const ex = data.extracted as ExtractedListing;
      setExtracted(ex);
      setAgentMatch((data.agent_match as AgentMatch) || null);
      setCoverIndex(typeof data.cover_photo_index === 'number' ? data.cover_photo_index : null);
      await checkDuplicates(ex);
      toast.success('Extracted — review and open the wizard');
    } catch (e: any) {
      toast.error(e?.message || 'AI extraction failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const needsStatusChoice = !!extracted && extracted.listing_status_confidence === 'low' && !statusChoice;
  const blockedByDuplicate = duplicates.length > 0 && !duplicateAcknowledged;

  const openWizard = () => {
    if (!extracted) return;
    if (needsStatusChoice) {
      toast.warning('Choose sale or rent first');
      return;
    }
    if (blockedByDuplicate) {
      toast.warning('Acknowledge the possible duplicate before continuing');
      return;
    }

    const readyImages = images.filter((i) => i.publicUrl).map((i) => i.publicUrl!);
    // Reorder so AI-picked cover is first.
    let orderedImages = readyImages;
    if (coverIndex != null && coverIndex >= 0 && coverIndex < readyImages.length) {
      orderedImages = [readyImages[coverIndex], ...readyImages.filter((_, i) => i !== coverIndex)];
    }

    const finalStatus = statusChoice ?? extracted.listing_status;

    const draftData: PropertyWizardData = {
      ...defaultPropertyData,
      ...Object.fromEntries(
        Object.entries(extracted).filter(([k, v]) =>
          v !== undefined && v !== null &&
          !['source_notes', 'low_confidence_fields', 'listing_status_confidence', 'detected_agent'].includes(k),
        ),
      ),
      listing_status: finalStatus as PropertyWizardData['listing_status'],
      images: orderedImages,
      sqm_source: extracted.size_sqm ? (defaultPropertyData.sqm_source ?? 'agent_estimate') : undefined,
      is_immediate_entry: true,
    } as PropertyWizardData;

    const payload = {
      data: draftData,
      metadata: {
        currentStep: 1,
        assignedAgentId: agentMatch?.confidence === 'high' ? agentMatch.agent_id : null,
        coverPhotoIndex: 0,
        duplicateAcknowledged: blockedByDuplicate ? true : duplicates.length > 0 ? true : false,
      },
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AGENCY_WIZARD_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      toast.error('Could not save draft locally');
      return;
    }
    onOpenChange(false);
    navigate('/agency/properties/new');
  };

  const reset = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    setImages([]);
    setDescription('');
    setExtracted(null);
    setAgentMatch(null);
    setCoverIndex(null);
    setDuplicates([]);
    setDuplicateAcknowledged(false);
    setStatusChoice(null);
    setHintIntent('auto');
    setHintCity('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Kickstart a listing with AI
          </DialogTitle>
          <DialogDescription>
            Drop in any screenshots (Yad2, Madlan, agency PDFs, WhatsApp, floor plans) and/or a
            description. AI fills in the wizard fields, matches the listing agent from your roster,
            picks a cover photo, and warns you about possible duplicates.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          <div className="space-y-5 py-2">
            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/30 transition"
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drop screenshots here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP — up to 20 images</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {images.map((img, idx) => {
                  const readyIdx = images.filter((it) => it.publicUrl).indexOf(img);
                  const isCover = coverIndex != null && readyIdx === coverIndex;
                  return (
                    <div key={idx} className={`relative group aspect-square rounded-md overflow-hidden border bg-muted ${isCover ? 'ring-2 ring-primary' : ''}`}>
                      <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                      {isCover && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <ImageIcon className="h-2.5 w-2.5" /> Cover
                        </div>
                      )}
                      {img.uploading && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-0 bg-destructive/70 text-destructive-foreground text-[10px] flex items-center justify-center p-1 text-center">
                          {img.error}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeImage(img); }}
                        className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="kick-desc">Description / notes (Hebrew or English)</Label>
              <Textarea
                id="kick-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the broker's blurb, WhatsApp message, MLS copy, voice-note transcript… anything."
                rows={5}
                className="resize-none"
              />
            </div>

            {/* Hints */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Listing intent</Label>
                <div className="flex gap-1">
                  {(['auto', 'for_sale', 'for_rent'] as const).map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      size="sm"
                      variant={hintIntent === opt ? 'default' : 'outline'}
                      onClick={() => setHintIntent(opt)}
                      className="flex-1"
                    >
                      {opt === 'auto' ? 'Auto-detect' : opt === 'for_sale' ? 'Sale' : 'Rent'}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="kick-city">City hint (optional)</Label>
                <Input
                  id="kick-city"
                  value={hintCity}
                  onChange={(e) => setHintCity(e.target.value)}
                  placeholder="e.g. Tel Aviv"
                />
              </div>
            </div>

            {/* Result preview */}
            {extracted && (
              <Card className="p-4 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" /> Extracted draft
                  </div>
                  <div className="flex items-center gap-2">
                    {extracted.listing_status_confidence !== 'low' && (
                      <Badge variant="secondary">{(extracted.listing_status || 'for_sale').replace('_', ' ')}</Badge>
                    )}
                    {agentMatch?.confidence === 'high' && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1">
                        <UserCheck className="h-3 w-3" /> {agentMatch.agent_name}
                      </Badge>
                    )}
                    {agentMatch && agentMatch.confidence === 'low' && (
                      <Badge variant="outline" className="border-amber-400 text-amber-700 gap-1">
                        <UserX className="h-3 w-3" /> Maybe {agentMatch.agent_name}
                      </Badge>
                    )}
                    {!agentMatch && extracted.detected_agent?.name && (
                      <Badge variant="outline" className="border-amber-400 text-amber-700 gap-1">
                        <UserX className="h-3 w-3" /> No agent match
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Forced sale/rent choice */}
                {extracted.listing_status_confidence === 'low' && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
                    <div className="text-xs font-medium text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Is this for sale or for rent? Source wasn't clear.
                    </div>
                    <div className="flex gap-2">
                      {(['for_sale', 'for_rent'] as const).map((opt) => (
                        <Button
                          key={opt}
                          type="button"
                          size="sm"
                          variant={statusChoice === opt ? 'default' : 'outline'}
                          onClick={() => setStatusChoice(opt)}
                          className="flex-1"
                        >
                          {opt === 'for_sale' ? 'For sale' : 'For rent'}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duplicate warning */}
                {duplicates.length > 0 && (
                  <div className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2">
                    <div className="text-xs font-medium text-amber-900 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {duplicates.length === 1 ? 'Possible duplicate already in inventory' : `${duplicates.length} possible duplicates in inventory`}
                    </div>
                    <ul className="text-xs space-y-1">
                      {duplicates.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-2">
                          <span className="truncate">
                            {d.title || 'Untitled'} — {d.address || d.city} · ₪{(d.price ?? 0).toLocaleString()}
                          </span>
                          <a
                            href={`/property/${d.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-primary hover:underline shrink-0"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                    {!duplicateAcknowledged && (
                      <Button size="sm" variant="outline" onClick={() => setDuplicateAcknowledged(true)}>
                        Continue anyway
                      </Button>
                    )}
                    {duplicateAcknowledged && (
                      <div className="text-xs text-amber-800">Acknowledged — you can open the wizard.</div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <Field label="Type" value={extracted.property_type} />
                  <Field label="Price (NIS)" value={extracted.price ? extracted.price.toLocaleString() : '—'} />
                  <Field label="City" value={extracted.city} />
                  <Field label="Neighborhood" value={extracted.neighborhood} />
                  <Field label="Address" value={extracted.address} />
                  <Field label="Bedrooms" value={extracted.bedrooms} />
                  <Field label="Bathrooms" value={extracted.bathrooms} />
                  <Field label="Size (sqm)" value={extracted.size_sqm} />
                  <Field label="Floor" value={extracted.floor != null ? `${extracted.floor}/${extracted.total_floors ?? '?'}` : undefined} />
                  <Field label="Parking" value={extracted.parking} />
                  <Field label="Year built" value={extracted.year_built} />
                  <Field label="Condition" value={extracted.condition} />
                </div>

                {extracted.features && extracted.features.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {extracted.features.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                )}

                {extracted.description && (
                  <div className="text-xs text-muted-foreground line-clamp-4 whitespace-pre-line">
                    {extracted.description}
                  </div>
                )}

                {extracted.low_confidence_fields && extracted.low_confidence_fields.length > 0 && (
                  <div className="text-xs">
                    <span className="font-medium text-amber-600">Needs your eye: </span>
                    {extracted.low_confidence_fields.join(', ')}
                  </div>
                )}

                {extracted.source_notes && extracted.source_notes.length > 0 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Source notes ({extracted.source_notes.length})</summary>
                    <ul className="list-disc pl-5 mt-1 space-y-0.5">
                      {extracted.source_notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </details>
                )}
              </Card>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {!extracted ? (
            <Button onClick={analyze} disabled={analyzing}>
              {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Analyze
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={analyze} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Re-analyze
              </Button>
              <Button onClick={openWizard} disabled={needsStatusChoice || blockedByDuplicate}>
                Open wizard with these values
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  const display = value === undefined || value === null || value === '' ? '—' : String(value);
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{display}</div>
    </div>
  );
}
