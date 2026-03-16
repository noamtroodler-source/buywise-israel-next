import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, AlertCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

const confidenceColor: Record<string, string> = {
  exact: 'bg-green-100 text-green-800',
  high: 'bg-blue-100 text-blue-800',
  likely: 'bg-yellow-100 text-yellow-800',
  none: 'bg-red-100 text-red-800',
};

export default function MapNeighborhoods() {
  const [cbsCities, setCbsCities] = useState<string[]>([]);
  const [results, setResults] = useState<CityResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [currentCity, setCurrentCity] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCities() {
      setIsLoadingCities(true);
      // Fetch all distinct city_en values, paginated
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
    toast({ title: 'Mapping complete', description: `Processed ${cbsCities.length} cities` });
  };

  const allMappings = results.flatMap(r => r.mappings);
  const allUnmappedCbs = results.flatMap(r => r.unmapped_cbs);
  const allUnmappedAnglo = results.flatMap(r => r.unmapped_anglo);
  const completedCities = results.filter(r => r.status === 'done').length;

  const copyJson = () => {
    const output = { mappings: allMappings, unmapped_cbs: allUnmappedCbs, unmapped_anglo: allUnmappedAnglo };
    navigator.clipboard.writeText(JSON.stringify(output, null, 2));
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="container py-8 max-w-6xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Map Neighborhoods (CBS ↔ Anglo)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button onClick={runMapping} disabled={isRunning} size="lg">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentCity} ({completedCities}/{CBS_CITIES.length})
                </>
              ) : 'Run Mapping for All Cities'}
            </Button>
            {allMappings.length > 0 && (
              <Button variant="outline" onClick={copyJson}>
                <Copy className="mr-2 h-4 w-4" /> Copy Full JSON
              </Button>
            )}
          </div>

          {/* Progress */}
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

      {/* Summary */}
      {completedCities > 0 && (
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{allMappings.length}</div>
                <div className="text-sm text-muted-foreground">Total Mappings</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {allMappings.filter(m => m.confidence === 'exact').length}
                </div>
                <div className="text-sm text-muted-foreground">Exact</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {allMappings.filter(m => m.confidence === 'high').length}
                </div>
                <div className="text-sm text-muted-foreground">High</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {allMappings.filter(m => m.confidence === 'likely').length}
                </div>
                <div className="text-sm text-muted-foreground">Likely</div>
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span className="text-sm">{allUnmappedCbs.length} unmapped CBS</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-purple-500" />
                <span className="text-sm">{allUnmappedAnglo.length} unmapped Anglo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mappings Table */}
      {allMappings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Mappings ({allMappings.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">Anglo Name</th>
                    <th className="text-left p-2">Our Hebrew</th>
                    <th className="text-left p-2">CBS Hebrew</th>
                    <th className="text-left p-2">CBS ID</th>
                    <th className="text-left p-2">Confidence</th>
                    <th className="text-left p-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {allMappings.map((m, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2">{m.city}</td>
                      <td className="p-2 font-medium">{m.anglo_name}</td>
                      <td className="p-2 text-right" dir="rtl">{m.our_hebrew || '—'}</td>
                      <td className="p-2 text-right" dir="rtl">{m.cbs_hebrew}</td>
                      <td className="p-2 font-mono text-xs">{m.cbs_id}</td>
                      <td className="p-2">
                        <Badge className={confidenceColor[m.confidence]}>{m.confidence}</Badge>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground max-w-[200px] truncate">{m.notes || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unmapped CBS */}
      {allUnmappedCbs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Unmapped CBS ({allUnmappedCbs.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">City</th>
                    <th className="text-left p-2">CBS Hebrew</th>
                    <th className="text-left p-2">CBS ID</th>
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

      {/* Unmapped Anglo */}
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
