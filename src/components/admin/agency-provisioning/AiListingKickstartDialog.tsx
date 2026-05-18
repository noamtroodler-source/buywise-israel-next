import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, X, Loader2, Wand2, ArrowRight } from 'lucide-react';
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
  error?: string;
}

interface ExtractedListing extends Partial<PropertyWizardData> {
  source_notes?: string[];
  low_confidence_fields?: string[];
}

export function AiListingKickstartDialog({
  open,
  onOpenChange,
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (arr.length === 0) return;
    if (images.length + arr.length > 12) {
      toast.warning('Up to 12 images at a time. Some were skipped.');
    }
    const accepted = arr.slice(0, 12 - images.length);
    const newEntries: UploadedImage[] = accepted.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setImages((prev) => [...prev, ...newEntries]);

    for (let i = 0; i < newEntries.length; i++) {
      const entry = newEntries[i];
      try {
        const ext = entry.file.name.split('.').pop() || 'jpg';
        const path = `ai-kickstart/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from('property-images')
          .upload(path, entry.file, { contentType: entry.file.type });
        if (error) throw error;
        const { data } = supabase.storage.from('property-images').getPublicUrl(path);
        setImages((prev) =>
          prev.map((it) =>
            it === entry ? { ...it, uploading: false, publicUrl: data.publicUrl } : it,
          ),
        );
      } catch (e: any) {
        setImages((prev) =>
          prev.map((it) =>
            it === entry ? { ...it, uploading: false, error: e?.message || 'Upload failed' } : it,
          ),
        );
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
    try {
      const { data, error } = await supabase.functions.invoke('ai-extract-listing', {
        body: {
          image_urls: ready.map((i) => i.publicUrl),
          description: description.trim(),
          hint: {
            ...(hintIntent !== 'auto' ? { listing_status: hintIntent } : {}),
            ...(hintCity.trim() ? { city: hintCity.trim() } : {}),
          },
        },
      });
      if (error) throw error;
      if (!data?.extracted) throw new Error('No data returned');
      setExtracted(data.extracted as ExtractedListing);
      toast.success('Extracted — review and open the wizard');
    } catch (e: any) {
      toast.error(e?.message || 'AI extraction failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const openWizard = () => {
    if (!extracted) return;

    // Merge with wizard defaults so every required key exists.
    const draftData: PropertyWizardData = {
      ...defaultPropertyData,
      ...Object.fromEntries(
        Object.entries(extracted).filter(([k, v]) =>
          v !== undefined && v !== null && !['source_notes', 'low_confidence_fields'].includes(k),
        ),
      ),
      // Attach uploaded images as listing photos.
      images: images.filter((i) => i.publicUrl).map((i) => i.publicUrl!),
      // Sensible defaults.
      sqm_source: extracted.size_sqm ? (defaultPropertyData.sqm_source ?? 'agent_estimate') : undefined,
      is_immediate_entry: true,
    } as PropertyWizardData;

    const payload = {
      data: draftData,
      metadata: { currentStep: 1, assignedAgentId: null },
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(AGENCY_WIZARD_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
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
            description. AI will fill in bedrooms, baths, price, rental vs. resale, amenities and
            more — you review in the wizard before submitting.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
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
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WebP — up to 12 images
              </p>
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
                {images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-md overflow-hidden border bg-muted">
                    <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
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
                ))}
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
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" /> Extracted draft
                  </div>
                  <Badge variant="secondary">{(extracted.listing_status || 'for_sale').replace('_', ' ')}</Badge>
                </div>

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
        </ScrollArea>

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
              <Button onClick={openWizard}>
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
