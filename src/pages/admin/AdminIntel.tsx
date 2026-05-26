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
import { ExternalLink, RefreshCw, Pencil, Plus, Search } from 'lucide-react';
import {
  useAdminIntelArticles, useUpdateIntelArticle, useSaveIntelTake, useDeleteIntelTake,
  useAdminIntelSources, useUpsertIntelSource, useTriggerIntelFetch, useIntelSubscribers,
  AdminIntelArticle, AdminIntelSource,
} from '@/hooks/useAdminIntel';
import { INTEL_CATEGORIES } from '@/lib/intel/categories';
import { IntelCategory } from '@/hooks/useIntel';
import { formatDistanceToNow } from 'date-fns';

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
      <Tabs defaultValue="articles" className="w-full">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="subscribers">Brief Subscribers</TabsTrigger>
        </TabsList>
        <TabsContent value="articles" className="mt-6"><ArticlesTab /></TabsContent>
        <TabsContent value="sources" className="mt-6"><SourcesTab /></TabsContent>
        <TabsContent value="subscribers" className="mt-6"><SubscribersTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ArticlesTab() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<IntelCategory | 'all'>('all');
  const [hasTake, setHasTake] = useState<'all' | 'yes' | 'no'>('all');
  const [hidden, setHidden] = useState<'all' | 'visible' | 'hidden'>('visible');
  const [editing, setEditing] = useState<AdminIntelArticle | null>(null);

  const { data: articles = [], isLoading } = useAdminIntelArticles({ search, category, hasTake, hidden, limit: 150 });
  const update = useUpdateIntelArticle();

  const sources = useMemo(() => Array.from(new Set(articles.map(a => a.source_name))).sort(), [articles]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Label className="text-xs">Search headline</Label>
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
        </CardContent>
      </Card>

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
              ) : articles.map(a => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="font-medium leading-snug">{a.headline}</div>
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
                    {a.source_language === 'he' && <Badge variant="outline" className="ml-2 text-xs">HE</Badge>}
                  </TableCell>
                  <TableCell>
                    <Select value={a.category} onValueChange={(v: any) => update.mutate({ id: a.id, patch: { category: v } })}>
                      <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {INTEL_CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                      <Badge variant={a.take_published_at ? 'default' : 'secondary'}>
                        {a.take_published_at ? 'Published' : 'Draft'}
                      </Badge>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                      <Pencil className="h-3 w-3 mr-1" /> Take
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
  const save = useSaveIntelTake();
  const del = useDeleteIntelTake();
  const words = countWords(body);
  const over = words > WORD_CAP;

  const handleSave = async (publish: boolean) => {
    if (over) return;
    if (!body.trim()) return;
    await save.mutateAsync({ id: article.take_id, article_id: article.id, take_label: label, take_body: body.trim(), publish });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>BuyWise Take</DialogTitle>
          <DialogDescription className="line-clamp-2">{article.headline}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Label</Label>
            <Select value={label} onValueChange={setLabel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TAKE_LABELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Take body</Label>
              <span className={`text-xs ${over ? 'text-destructive' : 'text-muted-foreground'}`}>{words} / {WORD_CAP} words</span>
            </div>
            <Textarea value={body} onChange={e => setBody(e.target.value)} rows={8} placeholder="2–4 sentences. Speak as the trusted friend — what this means for an international buyer." />
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
  const { data: sources = [], isLoading } = useAdminIntelSources();
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                : sources.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{s.url}</TableCell>
                    <TableCell>{s.language.toUpperCase()}</TableCell>
                    <TableCell>{s.tier}</TableCell>
                    <TableCell>
                      <Switch checked={s.enabled} onCheckedChange={(v) => upsert.mutate({ ...s, enabled: v })} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {s.last_fetched_at ? formatDistanceToNow(new Date(s.last_fetched_at), { addSuffix: true }) : 'never'}
                      {s.last_error && <div className="text-destructive truncate max-w-[200px]" title={s.last_error}>{s.last_error}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => setEditing(s)}><Pencil className="h-3 w-3" /></Button>
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
