import { useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExternalLink, RefreshCw, Pencil, Plus, Search, Sparkles, AlertTriangle, Languages } from 'lucide-react';
import {
  useAdminIntelArticles, useUpdateIntelArticle, useSaveIntelTake, useDeleteIntelTake,
  useAdminIntelSources, useUpsertIntelSource, useTriggerIntelFetch, useIntelSubscribers,
  useDraftIntelTakeAI, useEnrichIntelBacklog, useIntelSourceHealth,
  AdminIntelArticle, AdminIntelSource,
} from '@/hooks/useAdminIntel';
import { DeepReadQueueTab } from '@/components/admin/intel/DeepReadQueueTab';
import { useAdminPendingDeepReads } from '@/hooks/useIntelDeepRead';
import { BookOpen } from 'lucide-react';
import { INTEL_CATEGORIES } from '@/lib/intel/categories';
import { IntelCategory } from '@/hooks/useIntel';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

const TAKE_LABELS = ['What This Means', 'Buyer Impact', 'Watch List', 'Reality Check', 'BuyWise View'];
const WORD_CAP = 300;
const countWords = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export default function AdminIntel() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-foreground">BuyWise Intel</h1>
        <p className="text-sm text-muted-foreground">Curate the news feed, write Takes, and manage sources.</p>
      </header>
      <SourceHealthBanner />
      <Tabs defaultValue="articles" className="w-full">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="deepreads" className="gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            Deep Reads
            <PendingCountBadge />
          </TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="subscribers">Brief Subscribers</TabsTrigger>
        </TabsList>
        <TabsContent value="articles" className="mt-6"><ArticlesTab /></TabsContent>
        <TabsContent value="deepreads" className="mt-6"><DeepReadQueueTab /></TabsContent>
        <TabsContent value="sources" className="mt-6"><SourcesTab /></TabsContent>
        <TabsContent value="subscribers" className="mt-6"><SubscribersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function SourceHealthBanner() {
  const { data: rows = [] } = useIntelSourceHealth();
  const unhealthy = rows.filter((r) => r.is_unhealthy);
  if (!unhealthy.length) return null;
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{unhealthy.length} source{unhealthy.length === 1 ? '' : 's'} need attention</AlertTitle>
      <AlertDescription className="text-xs">
        {unhealthy.map((r) => r.name).join(' · ')} — stale or erroring. Check the Sources tab.
      </AlertDescription>
    </Alert>
  );
}

function PendingCountBadge() {
  const { data: pending = [] } = useAdminPendingDeepReads();
  if (!pending.length) return null;
  return (
    <Badge variant={pending.length > 2 ? 'destructive' : 'secondary'} className="ml-1 h-4 px-1.5 text-[10px]">
      {pending.length}
    </Badge>
  );
}

function ArticlesTab() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<IntelCategory | 'all'>('all');
  const [hasTake, setHasTake] = useState<'all' | 'yes' | 'no'>('all');
  const [hidden, setHidden] = useState<'all' | 'visible' | 'hidden'>('visible');
  const [editing, setEditing] = useState<AdminIntelArticle | null>(null);
  const backfill = useEnrichIntelBacklog();

  const { data: articles = [], isLoading } = useAdminIntelArticles({ search, category, hasTake, hidden, limit: 150 });
  const update = useUpdateIntelArticle();

  const untranslatedHe = useMemo(
    () => articles.filter((a) => a.source_language === 'he' && !a.headline_en).length,
    [articles],
  );

  const runBackfill = async () => {
    const res: any = await backfill.mutateAsync(40);
    toast({
      title: 'Backfill ran',
      description: res?.summary ?? `Processed ${res?.processed ?? '?'} articles.`,
    });
  };

  const [runningAll, setRunningAll] = useState(false);
  const runBackfillUntilDone = async () => {
    setRunningAll(true);
    let totalProcessed = 0;
    let batches = 0;
    try {
      for (let i = 0; i < 20; i++) {
        const res: any = await backfill.mutateAsync(40);
        const processed = Number(res?.processed ?? 0);
        totalProcessed += processed;
        batches++;
        if (processed === 0) break;
        // small breather to avoid Gemini rate limits
        await new Promise((r) => setTimeout(r, 1500));
      }
      toast({
        title: 'Backfill complete',
        description: `Enriched ${totalProcessed} articles across ${batches} batch${batches === 1 ? '' : 'es'}.`,
      });
    } catch (e: any) {
      toast({ title: 'Stopped early', description: e.message, variant: 'destructive' });
    } finally {
      setRunningAll(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Search headline (EN or original)</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-8" placeholder="Search…" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {INTEL_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Take</Label>
            <Select value={hasTake} onValueChange={(v: any) => setHasTake(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Has take</SelectItem>
                <SelectItem value="no">No take</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Visibility</Label>
            <Select value={hidden} onValueChange={(v: any) => setHidden(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={runBackfill} disabled={backfill.isPending || runningAll}>
            <Languages className={`h-4 w-4 mr-1 ${backfill.isPending && !runningAll ? 'animate-pulse' : ''}`} />
            Enrich backlog
          </Button>
          <Button onClick={runBackfillUntilDone} disabled={backfill.isPending || runningAll}>
            <Languages className={`h-4 w-4 mr-1 ${runningAll ? 'animate-pulse' : ''}`} />
            {runningAll ? 'Running…' : 'Run until done'}
          </Button>
        </CardContent>
      </Card>

      {untranslatedHe > 0 && (
        <p className="text-xs text-muted-foreground">
          {untranslatedHe} Hebrew article{untranslatedHe === 1 ? '' : 's'} in this view still need English translation — run "Enrich backlog".
        </p>
      )}

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[280px]">Headline</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="w-20">Score</TableHead>
                <TableHead>Flags</TableHead>
                <TableHead>Take</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              ) : articles.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No articles match.</TableCell></TableRow>
              ) : articles.map(a => {
                const displayHead = a.headline_en || a.headline;
                const isHebrew = a.source_language === 'he';
                const translated = isHebrew && !!a.headline_en;
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium leading-snug" dir={isHebrew && !a.headline_en ? 'rtl' : 'ltr'}>
                        {displayHead}
                      </div>
                      {isHebrew && a.headline_en && (
                        <div className="text-[11px] text-muted-foreground mt-0.5" dir="rtl">{a.headline}</div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}
                        {' · '}
                        <a href={a.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 hover:text-primary">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {a.source_name}
                      {isHebrew && !translated && <Badge variant="outline" className="ml-2 text-[10px]">HE</Badge>}
                      {translated && <Badge variant="secondary" className="ml-2 text-[10px]">HE→EN</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Select value={a.category} onValueChange={(v: any) => update.mutate({ id: a.id, patch: { category: v } })}>
                          <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {INTEL_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {a.auto_categorized && typeof a.category_confidence === 'number' && (
                          <span className="text-[10px] text-muted-foreground">AI · {(a.category_confidence * 100).toFixed(0)}%</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={String(a.relevance_score)} onValueChange={(v) => update.mutate({ id: a.id, patch: { relevance_score: Number(v) } })}>
                        <SelectTrigger className="w-16 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <label className="flex items-center gap-2"><Switch checked={a.is_featured} onCheckedChange={(v) => update.mutate({ id: a.id, patch: { is_featured: v } })} /> Featured</label>
                        <label className="flex items-center gap-2"><Switch checked={a.is_pinned} onCheckedChange={(v) => update.mutate({ id: a.id, patch: { is_pinned: v } })} /> Pinned</label>
                        <label className="flex items-center gap-2"><Switch checked={a.is_hidden} onCheckedChange={(v) => update.mutate({ id: a.id, patch: { is_hidden: v } })} /> Hidden</label>
                      </div>
                    </TableCell>
                    <TableCell>
                      {a.take_id ? (
                        <div className="flex flex-col gap-1">
                          <Badge variant={a.take_published_at ? 'default' : 'secondary'}>
                            {a.take_published_at ? 'Published' : 'Draft'}
                          </Badge>
                          {a.take_ai_drafted && <span className="text-[10px] text-muted-foreground">AI-drafted</span>}
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                        <Pencil className="h-3 w-3 mr-1" /> Take
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && <TakeEditor article={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TakeEditor({ article, onClose }: { article: AdminIntelArticle; onClose: () => void }) {
  const [label, setLabel] = useState(article.take_label ?? TAKE_LABELS[0]);
  const [body, setBody] = useState(article.take_body ?? '');
  const [aiDrafted, setAiDrafted] = useState<boolean>(article.take_ai_drafted ?? false);
  const save = useSaveIntelTake();
  const del = useDeleteIntelTake();
  const ai = useDraftIntelTakeAI();
  const words = countWords(body);
  const over = words > WORD_CAP;

  const draftWithAI = async () => {
    if (body.trim() && !window.confirm('Replace the current take with an AI draft?')) return;
    const draft = await ai.mutateAsync(article.id);
    setLabel(draft.take_label);
    setBody(draft.take_body);
    setAiDrafted(true);
    toast({ title: 'AI draft ready', description: 'Review and edit before publishing.' });
  };

  const handleSave = async (publish: boolean) => {
    if (over) return;
    if (!body.trim()) return;
    // If the human edited an AI draft, keep the ai_drafted flag (provenance).
    await save.mutateAsync({
      id: article.take_id,
      article_id: article.id,
      take_label: label,
      take_body: body.trim(),
      publish,
      ai_drafted: aiDrafted,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>BuyWise Take</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {article.headline_en || article.headline}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <Label>Label</Label>
              <Select value={label} onValueChange={setLabel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TAKE_LABELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={draftWithAI}
              disabled={ai.isPending}
              className="mt-5"
            >
              <Sparkles className={`h-4 w-4 mr-1 ${ai.isPending ? 'animate-pulse' : ''}`} />
              {ai.isPending ? 'Drafting…' : 'Draft with AI'}
            </Button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Take body</Label>
              <span className={`text-xs ${over ? 'text-destructive' : 'text-muted-foreground'}`}>{words} / {WORD_CAP} words</span>
            </div>
            <Textarea
              value={body}
              onChange={e => { setBody(e.target.value); if (aiDrafted) setAiDrafted(true); }}
              rows={8}
              placeholder="2–4 sentences. Speak as the trusted friend — what this means for an international buyer."
            />
            {aiDrafted && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                AI-drafted · review for accuracy before publishing.
              </p>
            )}
          </div>

          {body.trim() && (
            <div className="rounded-md border-l-4 border-primary bg-primary/5 p-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">{label}</div>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{body}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {article.take_id && (
            <Button variant="ghost" className="mr-auto text-destructive" onClick={async () => { await del.mutateAsync(article.take_id!); onClose(); }}>
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => handleSave(false)} disabled={over || !body.trim() || save.isPending}>Save draft</Button>
          <Button onClick={() => handleSave(true)} disabled={over || !body.trim() || save.isPending}>Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SourcesTab() {
  const { data: health = [], isLoading } = useIntelSourceHealth();
  const upsert = useUpsertIntelSource();
  const fetchNow = useTriggerIntelFetch();
  const [editing, setEditing] = useState<Partial<AdminIntelSource> | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">RSS Sources</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchNow.mutate()} disabled={fetchNow.isPending}>
            <RefreshCw className={`h-4 w-4 mr-1 ${fetchNow.isPending ? 'animate-spin' : ''}`} /> Fetch now
          </Button>
          <Button onClick={() => setEditing({ language: 'en', tier: 1, enabled: true })}>
            <Plus className="h-4 w-4 mr-1" /> Add source
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Feed URL</TableHead>
                <TableHead>Lang</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Last fetch</TableHead>
                <TableHead className="text-right">7d</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                : health.map(s => (
                  <TableRow key={s.id} className={s.is_unhealthy ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">
                      {s.name}
                      {s.is_unhealthy && <AlertTriangle className="inline h-3 w-3 ml-2 text-destructive" />}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{s.url}</TableCell>
                    <TableCell>{s.language.toUpperCase()}</TableCell>
                    <TableCell>{s.tier}</TableCell>
                    <TableCell>
                      <Switch checked={s.enabled} onCheckedChange={(v) => upsert.mutate({ id: s.id, name: s.name, url: s.url, language: s.language as any, tier: s.tier, enabled: v })} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.last_fetched_at ? formatDistanceToNow(new Date(s.last_fetched_at), { addSuffix: true }) : 'never'}
                      {s.last_error && <div className="text-destructive truncate max-w-[200px]" title={s.last_error}>{s.last_error}</div>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{s.articles_last_7d ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing({
                        id: s.id, name: s.name, url: s.url, homepage_url: s.homepage_url,
                        language: s.language as any, tier: s.tier, enabled: s.enabled,
                        last_fetched_at: s.last_fetched_at, last_error: s.last_error,
                      })}><Pencil className="h-3 w-3" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && <SourceEditor source={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function SourceEditor({ source, onClose }: { source: Partial<AdminIntelSource>; onClose: () => void }) {
  const [form, setForm] = useState(source);
  const upsert = useUpsertIntelSource();

  const save = async () => {
    if (!form.name || !form.url) return;
    await upsert.mutateAsync(form as any);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{form.id ? 'Edit source' : 'Add source'}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>RSS feed URL</Label><Input value={form.url ?? ''} onChange={e => setForm({ ...form, url: e.target.value })} /></div>
          <div><Label>Homepage URL</Label><Input value={form.homepage_url ?? ''} onChange={e => setForm({ ...form, homepage_url: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Language</Label>
              <Select value={form.language ?? 'en'} onValueChange={(v: any) => setForm({ ...form, language: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="he">Hebrew</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tier (1=primary)</Label>
              <Input type="number" min={1} max={3} value={form.tier ?? 1} onChange={e => setForm({ ...form, tier: Number(e.target.value) })} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.enabled ?? true} onCheckedChange={(v) => setForm({ ...form, enabled: v })} /> Enabled</label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={upsert.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubscribersTab() {
  const { data: subs = [], isLoading } = useIntelSubscribers();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">BuyWise Brief subscribers ({subs.length})</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Source</TableHead><TableHead>Joined</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
              : subs.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No subscribers yet.</TableCell></TableRow>
              : subs.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.email}</TableCell>
                  <TableCell className="text-sm">{s.source ?? '—'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</TableCell>
                  <TableCell>{s.unsubscribed_at ? <Badge variant="outline">Unsubscribed</Badge> : <Badge>Active</Badge>}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
