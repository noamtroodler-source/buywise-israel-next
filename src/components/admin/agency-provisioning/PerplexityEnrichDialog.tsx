import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Loader2, Sparkles, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEnrichAgencyFromPayload, type EnrichedAgencyPayload } from '@/hooks/useAgencyProvisioning';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** When provided, we patch this agency instead of creating a new one. */
  existingAgencyId?: string;
  /** Initial seed for the prompt. */
  initialAgencyName?: string;
  initialWebsiteUrl?: string;
  initialYad2Url?: string;
  initialMadlanUrl?: string;
  onImported?: (agencyId: string) => void;
}

function buildPerplexityPrompt(
  agencyName: string,
  websiteUrl: string,
  yad2Url: string,
  madlanUrl: string,
) {
  const sources: string[] = [];
  if (websiteUrl.trim()) sources.push(`- Agency website: ${websiteUrl.trim()}`);
  if (yad2Url.trim()) sources.push(`- Yad2 page: ${yad2Url.trim()}`);
  if (madlanUrl.trim()) sources.push(`- Madlan page: ${madlanUrl.trim()}`);

  const sourceBlock = sources.length
    ? `Cross-reference data from ALL of these sources (merge agents found across them, dedupe by name + phone/email):\n${sources.join('\n')}`
    : `Search the web for the Israeli real estate agency named "${agencyName.trim() || '<AGENCY NAME>'}" — check their official website, Yad2 (yad2.co.il), and Madlan (madlan.co.il).`;

  return `You are a research agent. Extract structured public data for an Israeli real estate agency.

${sourceBlock}

Also check Facebook and LinkedIn for any missing fields.

Return ONLY a single JSON object (no prose, no markdown fences) matching EXACTLY this schema:

{
  "agency": {
    "name": "string",
    "email": "string or null",
    "phone": "string or null (E.164 if possible, e.g. +972-2-...)",
    "website": "string or null (https://...)",
    "description": "string or null (2-4 sentences in English describing what they specialize in)",
    "office_address": "string or null (full street address)",
    "cities_covered": ["array of Israeli city names in English, e.g. Jerusalem, Tel Aviv, Beit Shemesh"],
    "logo_url": "string or null (direct https URL to logo image)",
    "social_links": { "facebook": "url|null", "instagram": "url|null", "linkedin": "url|null" }
  },
  "agents": [
    {
      "name": "string (full name in English; transliterate Hebrew if needed)",
      "email": "string or null",
      "phone": "string or null",
      "avatar_url": "string or null (direct https URL to headshot photo)",
      "bio": "string or null (2-4 sentences in English)",
      "license_number": "string or null",
      "role": "string or null (e.g. Owner, Senior Agent, Agent)",
      "specializations": ["residential" | "commercial" | "luxury" | "new_construction" | "investment" | "rentals"],
      "languages": ["english" | "hebrew" | "french" | "russian" | "spanish" | "arabic"]
    }
  ]
}

Rules:
- Include EVERY agent found across ALL provided sources. Merge duplicates (same person on Yad2 + agency site = ONE entry, combine fields).
- If a field is unknown, use null (not empty string, not "N/A").
- Do NOT invent emails, phones, or license numbers.
- Use lowercase English keys for specializations & languages exactly as listed above.
- Output must be valid JSON parseable by JSON.parse — no comments, no trailing commas.`;
}

function tryParsePayload(raw: string): { ok: true; data: EnrichedAgencyPayload } | { ok: false; error: string } {
  if (!raw.trim()) return { ok: false, error: 'Paste the JSON response from Perplexity first.' };
  // Strip markdown fences if present
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // Find first { and last }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return { ok: false, error: 'No JSON object found in pasted text.' };
  cleaned = cleaned.slice(start, end + 1);
  try {
    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'Not a JSON object.' };
    if (!parsed.agency || typeof parsed.agency !== 'object') {
      return { ok: false, error: 'Missing "agency" object.' };
    }
    if (!Array.isArray(parsed.agents)) parsed.agents = [];
    return { ok: true, data: parsed as EnrichedAgencyPayload };
  } catch (e: any) {
    return { ok: false, error: `JSON parse failed: ${e.message}` };
  }
}

export function PerplexityEnrichDialog({
  open,
  onOpenChange,
  existingAgencyId,
  initialAgencyName = '',
  initialWebsiteUrl = '',
  initialYad2Url = '',
  initialMadlanUrl = '',
  onImported,
}: Props) {
  const [agencyName, setAgencyName] = useState(initialAgencyName);
  const [websiteUrl, setWebsiteUrl] = useState(initialWebsiteUrl);
  const [yad2Url, setYad2Url] = useState(initialYad2Url);
  const [madlanUrl, setMadlanUrl] = useState(initialMadlanUrl);
  const [pasted, setPasted] = useState('');
  const [tab, setTab] = useState<'prompt' | 'paste'>('prompt');
  const enrich = useEnrichAgencyFromPayload();

  const prompt = useMemo(
    () => buildPerplexityPrompt(agencyName, websiteUrl, yad2Url, madlanUrl),
    [agencyName, websiteUrl, yad2Url, madlanUrl],
  );
  const parsed = useMemo(() => tryParsePayload(pasted), [pasted]);
  const preview = parsed.ok ? parsed.data : null;

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    toast.success('Prompt copied — paste it into Perplexity');
    setTab('paste');
  }

  function openInPerplexity() {
    navigator.clipboard.writeText(prompt);
    window.open('https://www.perplexity.ai/', '_blank', 'noopener,noreferrer');
    toast.success('Prompt copied — Perplexity opened in a new tab');
    setTab('paste');
  }

  async function handleImport() {
    if (!parsed.ok) {
      toast.error((parsed as { ok: false; error: string }).error);
      return;
    }
    try {
      const res = await enrich.mutateAsync({ payload: parsed.data, existingAgencyId });
      toast.success(
        `Imported: ${res.inserted} agent${res.inserted === 1 ? '' : 's'}` +
          (res.skipped > 0 ? ` · ${res.skipped} skipped (duplicates or missing name)` : '')
      );
      setPasted('');
      setAgencyName('');
      setWebsiteUrl('');
      setYad2Url('');
      setMadlanUrl('');
      setTab('prompt');
      onOpenChange(false);
      onImported?.(res.agencyId);
    } catch (e: any) {
      toast.error(e?.message || 'Import failed');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {existingAgencyId ? 'Enrich agency with Perplexity' : 'Create agency from Perplexity research'}
          </DialogTitle>
          <DialogDescription>
            Generate a research prompt, run it in Perplexity, then paste the JSON back here. The agency profile and
            full agent roster will be auto-imported as drafts flagged "needs review".
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="prompt">1 · Generate prompt</TabsTrigger>
            <TabsTrigger value="paste">2 · Paste results</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-3 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Agency name</Label>
                <Input
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="e.g. Jerusalem Real Estate"
                />
              </div>
              <div>
                <Label>Source URL (Yad2, Madlan, agency site)</Label>
                <Input
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.yad2.co.il/realestate/agency/..."
                />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Prompt preview</Label>
              <Textarea value={prompt} readOnly rows={12} className="font-mono text-xs mt-1" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={copyPrompt} variant="outline">
                <Copy className="h-4 w-4 mr-2" /> Copy prompt
              </Button>
              <Button onClick={openInPerplexity}>
                <Sparkles className="h-4 w-4 mr-2" /> Copy & open Perplexity
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="space-y-3 pt-3">
            <div>
              <Label>Paste the JSON Perplexity returned</Label>
              <Textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={10}
                placeholder='{ "agency": { "name": "..." }, "agents": [...] }'
                className="font-mono text-xs mt-1"
              />
            </div>

            {pasted.trim() && !parsed.ok && (
              <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/5 text-sm">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-destructive">Could not parse JSON</div>
                  <div className="text-xs text-muted-foreground mt-1">{(parsed as { ok: false; error: string }).error}</div>
                </div>
              </div>
            )}

            {preview && (
              <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Preview — ready to import
                </div>

                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Agency</div>
                  <div className="font-medium">{preview.agency.name || <span className="text-destructive">missing name</span>}</div>
                  <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                    {preview.agency.email && <div>✉ {preview.agency.email}</div>}
                    {preview.agency.phone && <div>☎ {preview.agency.phone}</div>}
                    {preview.agency.website && <div>🌐 {preview.agency.website}</div>}
                    {preview.agency.office_address && <div>📍 {preview.agency.office_address}</div>}
                    {preview.agency.cities_covered?.length ? (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {preview.agency.cities_covered.map((c) => (
                          <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                    Agents <Badge variant="outline">{preview.agents.length}</Badge>
                  </div>
                  <div className="max-h-64 overflow-y-auto mt-2 space-y-1.5">
                    {preview.agents.length === 0 && (
                      <div className="text-xs text-muted-foreground italic">No agents found in payload.</div>
                    )}
                    {preview.agents.map((a, i) => (
                      <div key={i} className="text-sm border-l-2 border-primary/30 pl-2">
                        <div className="font-medium">
                          {a.name}
                          {a.role && <span className="text-xs text-muted-foreground ml-2">· {a.role}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.email || <span className="italic">no email</span>}
                          {a.phone && ` · ${a.phone}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground italic">
                  All agents will be marked as drafts with a "needs review" flag. Duplicates (by email) are skipped.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!preview || enrich.isPending}>
            {enrich.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {existingAgencyId ? 'Import agents' : 'Create agency & import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
