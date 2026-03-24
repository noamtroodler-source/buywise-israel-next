import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, AlertCircle, Copy, CheckCircle2, XCircle, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Mapping {
  city: string;
  anglo_name: string;
  our_hebrew?: string;
  cbs_hebrew: string;
  cbs_id: string;
  confidence: 'exact' | 'high' | 'likely' | 'none';
  notes?: string;
}

interface UnmappedCbs {
  city: string;
  cbs_hebrew: string;
  cbs_id: string;
  suggested_anglo?: string;
}

interface UnmappedAnglo {
  city: string;
  anglo_name: string;
  our_hebrew?: string;
  reason?: string;
}

interface CityResult {
  city: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  mappings: Mapping[];
  unmapped_cbs: UnmappedCbs[];
  unmapped_anglo: UnmappedAnglo[];
  error?: string;
}

interface DbMapping {
  id: string;
  city: string;
  anglo_name: string;
  cbs_neighborhood_id: string;
  cbs_hebrew: string | null;
  confidence: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const confidenceColor: Record<string, string> = {
  exact: 'bg-green-100 text-green-800',
  high: 'bg-blue-100 text-blue-800',
  likely: 'bg-yellow-100 text-yellow-800',
  none: 'bg-red-100 text-red-800',
};

const statusColor: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function MapNeighborhoods() {
  const [cbsCities, setCbsCities] = useState<string[]>([]);
  const [results, setResults] = useState<CityResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const [dbMappings, setDbMappings] = useState<DbMapping[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Load persisted mappings from DB
  useEffect(() => {
    loadDbMappings();
  }, []);

  async function loadDbMappings() {
    setIsLoadingDb(true);
    const allMappings: DbMapping[] = [];
    let page = 0;
    while (true) {
      const { data, error } = await supabase
        .from('neighborhood_cbs_mappings' as any)
        .select('*')
        .order('city')
        .order('anglo_name')
        .range(page * 1000, (page + 1) * 1000 - 1);
      if (error) {
        console.error('Failed to load mappings:', error);
        break;
      }
      if (!data || data.length === 0) break;
      allMappings.push(...(data as unknown as DbMapping[]));
      if (data.length < 1000) break;
      page++;
    }
    setDbMappings(allMappings);
    setIsLoadingDb(false);
  }

  useEffect(() => {
    async function fetchCities() {
      setIsLoadingCities(true);
      const allCities = new Set<string>();
      let page = 0;
      while (true) {
        const { data, error } = await supabase
          .from('neighborhood_price_history')
          .select('city_en')
          .order('city_en')
          .range(page * 1000, (page + 1) * 1000 - 1);
        if (error || !data || data.length === 0) break;
        for (const row of data) {
          if (row.city_en) allCities.add(row.city_en);
        }
        if (data.length < 1000) break;
        page++;
      }
      setCbsCities([...allCities].sort());
      setIsLoadingCities(false);
    }
    fetchCities();
  }, []);

  const runMapping = async () => {
    setIsRunning(true);
    const cityResults: CityResult[] = cbsCities.map(city => ({
      city, status: 'pending', mappings: [], unmapped_cbs: [], unmapped_anglo: [],
    }));
    setResults([...cityResults]);

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    for (let i = 0; i < cbsCities.length; i++) {
      const city = cbsCities[i];
      setCurrentCity(city);
      cityResults[i].status = 'processing';
      setResults([...cityResults]);

      try {
        const res = await fetch(
          `https://${projectId}.supabase.co/functions/v1/map-neighborhoods?city=${encodeURIComponent(city)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
            },
            body: '{}',
          }
        );

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`${res.status}: ${err}`);
        }

        const data = await res.json();
        cityResults[i] = {
          city,
          status: 'done',
          mappings: data.mappings || [],
          unmapped_cbs: data.unmapped_cbs || [],
          unmapped_anglo: data.unmapped_anglo || [],
        };
      } catch (e) {
        cityResults[i] = {
          city, status: 'error',
          mappings: [], unmapped_cbs: [], unmapped_anglo: [],
          error: e instanceof Error ? e.message : 'Unknown error',
        };
      }

      setResults([...cityResults]);
    }

    setIsRunning(false);
    setCurrentCity(null);
    toast({ title: 'Mapping complete', description: `Processed ${cbsCities.length} cities. Reloading DB mappings...` });
    await loadDbMappings();
  };

  const updateMappingStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setUpdatingIds(prev => new Set(prev).add(id));
    const { error } = await supabase
      .from('neighborhood_cbs_mappings' as any)
      .update({ status: newStatus, updated_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setDbMappings(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
    }
    setUpdatingIds(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const bulkApprove = async (confidenceLevels: string[]) => {
    const toApprove = dbMappings.filter(
      m => m.status === 'pending' && confidenceLevels.includes(m.confidence)
    );
    if (toApprove.length === 0) {
      toast({ title: 'Nothing to approve', description: 'No pending mappings with selected confidence levels' });
      return;
    }

    const ids = toApprove.map(m => m.id);
    const { error } = await supabase
      .from('neighborhood_cbs_mappings' as any)
      .update({ status: 'approved', updated_at: new Date().toISOString() } as any)
      .in('id', ids);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setDbMappings(prev => prev.map(m => ids.includes(m.id) ? { ...m, status: 'approved' } : m));
      toast({ title: `Approved ${ids.length} mappings` });
    }
  };

  const filteredMappings = statusFilter === 'all'
    ? dbMappings
    : dbMappings.filter(m => m.status === statusFilter);

  const counts = {
    total: dbMappings.length,
    approved: dbMappings.filter(m => m.status === 'approved').length,
    pending: dbMappings.filter(m => m.status === 'pending').length,
    rejected: dbMappings.filter(m => m.status === 'rejected').length,
  };

  // Edge function run results
  const allMappings = results.flatMap(r => r.mappings);
  const allUnmappedCbs = results.flatMap(r => r.unmapped_cbs);
  const allUnmappedAnglo = results.flatMap(r => r.unmapped_anglo);
  const completedCities = results.filter(r => r.status === 'done').length;

  const copyJson = () => {
    const output = { mappings: allMappings, unmapped_cbs: allUnmappedCbs, unmapped_anglo: allUnmappedAnglo };
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    toast({ title: 'Copied to clipboard' });
  };

  // Data quality: per-city coverage
  const cityQuality = (() => {
    const grouped: Record<string, { total: number; approved: number }> = {};
    dbMappings.forEach(m => {
      if (!grouped[m.city]) grouped[m.city] = { total: 0, approved: 0 };
      grouped[m.city].total++;
      if (m.status === 'approved' && m.cbs_neighborhood_id) grouped[m.city].approved++;
    });
    return Object.entries(grouped)
      .map(([city, { total, approved }]) => ({
        city,
        total,
        approved,
        pct: Math.round((approved / total) * 100),
      }))
      .sort((a, b) => a.city.localeCompare(b.city));
  })();

  return (
    <div className="container py-8 max-w-6xl space-y-6">
      {/* Data Quality Summary */}
      {!isLoadingDb && cityQuality.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Data Quality Coverage by City</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {cityQuality.map(c => (
                <div
                  key={c.city}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    c.pct > 70
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : c.pct >= 30
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="font-medium truncate">{c.city}</div>
                  <div className="text-xs opacity-80">{c.pct}% ({c.approved}/{c.total})</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Mapping Section */}
      <Card>
        <CardHeader>
          <CardTitle>Map Neighborhoods (CBS ↔ Anglo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Button onClick={runMapping} disabled={isRunning || isLoadingCities || cbsCities.length === 0} size="lg">
              {isLoadingCities ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading cities...</>
              ) : isRunning ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{currentCity} ({completedCities}/{cbsCities.length})</>
              ) : `Run Mapping for All Cities (${cbsCities.length})`}
            </Button>
            {allMappings.length > 0 && (
              <Button variant="outline" onClick={copyJson}>
                <Copy className="mr-2 h-4 w-4" /> Copy Full JSON
              </Button>
            )}
          </div>

          {results.length > 0 && (
            <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
              {results.map(r => (
                <div key={r.city} className={`flex items-center gap-1 p-1.5 rounded text-xs ${
                  r.status === 'done' ? 'bg-green-50' :
                  r.status === 'error' ? 'bg-red-50' :
                  r.status === 'processing' ? 'bg-blue-50' : 'bg-muted'
                }`}>
                  {r.status === 'done' && <Check className="h-3 w-3 text-green-600" />}
                  {r.status === 'error' && <X className="h-3 w-3 text-red-600" />}
                  {r.status === 'processing' && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                  <span className="truncate">{r.city}</span>
                  {r.status === 'done' && <span className="text-muted-foreground">({r.mappings.length})</span>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Persisted Mappings Review Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              Persisted Mappings
              {isLoadingDb && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="font-bold text-green-600">{counts.approved}</span>
                  <span className="text-muted-foreground ml-1">approved</span>
                </div>
                <div>
                  <span className="font-bold text-yellow-600">{counts.pending}</span>
                  <span className="text-muted-foreground ml-1">pending</span>
                </div>
                <div>
                  <span className="font-bold text-red-600">{counts.rejected}</span>
                  <span className="text-muted-foreground ml-1">rejected</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bulk Actions & Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkApprove(['exact', 'high'])}
              disabled={counts.pending === 0}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Bulk Approve Exact + High ({dbMappings.filter(m => m.status === 'pending' && ['exact', 'high'].includes(m.confidence)).length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkApprove(['exact'])}
              disabled={counts.pending === 0}
            >
              Approve Exact Only ({dbMappings.filter(m => m.status === 'pending' && m.confidence === 'exact').length})
            </Button>
            <div className="flex items-center gap-2 ml-auto">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({counts.total})</SelectItem>
                  <SelectItem value="pending">Pending ({counts.pending})</SelectItem>
                  <SelectItem value="approved">Approved ({counts.approved})</SelectItem>
                  <SelectItem value="rejected">Rejected ({counts.rejected})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mappings Table */}
          {filteredMappings.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">Anglo Name</th>
                    <th className="text-left p-2">Hebrew Name</th>
                    <th className="text-left p-2">Zone ID</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMappings.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">{m.city}</td>
                      <td className="p-2 font-medium">{m.anglo_name}</td>
                      <td className="p-2 text-right" dir="rtl">{m.cbs_hebrew || '—'}</td>
                      <td className="p-2 font-mono text-xs">{m.cbs_neighborhood_id}</td>
                      <td className="p-2">
                        <Badge className={confidenceColor[m.confidence] || ''}>{m.confidence}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge className={statusColor[m.status] || ''}>{m.status}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1">
                          {m.status !== 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => updateMappingStatus(m.id, 'approved')}
                              disabled={updatingIds.has(m.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {m.status !== 'rejected' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => updateMappingStatus(m.id, 'rejected')}
                              disabled={updatingIds.has(m.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredMappings.length === 0 && !isLoadingDb && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {dbMappings.length === 0
                ? 'No mappings yet. Run the mapping above to generate and persist them.'
                : 'No mappings match the current filter.'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Unmapped sections from latest run */}
      {allUnmappedCbs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Unmapped CBS ({allUnmappedCbs.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">City</th>
                     <th className="text-left p-2">Hebrew Name</th>
                     <th className="text-left p-2">Zone ID</th>
                     <th className="text-left p-2">Suggested Anglo</th>
                  </tr>
                </thead>
                <tbody>
                  {allUnmappedCbs.map((u, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2">{u.city}</td>
                      <td className="p-2 text-right" dir="rtl">{u.cbs_hebrew}</td>
                      <td className="p-2 font-mono text-xs">{u.cbs_id}</td>
                      <td className="p-2">{u.suggested_anglo || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {allUnmappedAnglo.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Unmapped Anglo ({allUnmappedAnglo.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">Anglo Name</th>
                    <th className="text-left p-2">Our Hebrew</th>
                    <th className="text-left p-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {allUnmappedAnglo.map((u, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2">{u.city}</td>
                      <td className="p-2 font-medium">{u.anglo_name}</td>
                      <td className="p-2 text-right" dir="rtl">{u.our_hebrew || '—'}</td>
                      <td className="p-2 text-xs text-muted-foreground">{u.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
