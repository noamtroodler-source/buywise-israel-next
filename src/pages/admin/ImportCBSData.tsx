import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react';

function parseCSV(text: string) {
  const lines = text.split('\n').filter(l => l.trim());
  // Remove BOM if present
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i]?.trim() || ''; });
    return obj;
  });
}

export default function ImportCBSData() {
  const [cityFile, setCityFile] = useState<File | null>(null);
  const [neighborhoodFile, setNeighborhoodFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Record<string, { state: 'idle' | 'loading' | 'success' | 'error'; message: string }>>({
    city: { state: 'idle', message: '' },
    neighborhood: { state: 'idle', message: '' },
  });

  const importTable = async (file: File, table: string) => {
    setStatus(s => ({ ...s, [table === 'city_price_history' ? 'city' : 'neighborhood']: { state: 'loading', message: 'Parsing CSV...' } }));
    const key = table === 'city_price_history' ? 'city' : 'neighborhood';

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      setStatus(s => ({ ...s, [key]: { state: 'loading', message: `Uploading ${rows.length} rows...` } }));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/import-cbs-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ table, rows }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Import failed');

      setStatus(s => ({ ...s, [key]: { state: 'success', message: `✓ Imported ${result.inserted} rows` } }));
    } catch (err) {
      setStatus(s => ({ ...s, [key]: { state: 'error', message: err instanceof Error ? err.message : 'Unknown error' } }));
    }
  };

  return (
    <div className="container py-8 max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Import CBS Price Data</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">City Price History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload <code>market_data.csv</code> — quarterly avg prices by city and room count (3/4/5 rooms).
          </p>
          <input type="file" accept=".csv" onChange={e => setCityFile(e.target.files?.[0] || null)} />
          <div className="flex items-center gap-3">
            <Button
              disabled={!cityFile || status.city.state === 'loading'}
              onClick={() => cityFile && importTable(cityFile, 'city_price_history')}
            >
              {status.city.state === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import City Data
            </Button>
            {status.city.state === 'success' && <span className="text-sm text-primary flex items-center gap-1"><CheckCircle className="h-4 w-4" />{status.city.message}</span>}
            {status.city.state === 'error' && <span className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{status.city.message}</span>}
            {status.city.state === 'loading' && <span className="text-sm text-muted-foreground">{status.city.message}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Neighborhood Price History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload <code>neighborhood_data.csv</code> — quarterly prices by neighborhood, room count, with yields and YoY.
          </p>
          <input type="file" accept=".csv" onChange={e => setNeighborhoodFile(e.target.files?.[0] || null)} />
          <div className="flex items-center gap-3">
            <Button
              disabled={!neighborhoodFile || status.neighborhood.state === 'loading'}
              onClick={() => neighborhoodFile && importTable(neighborhoodFile, 'neighborhood_price_history')}
            >
              {status.neighborhood.state === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import Neighborhood Data
            </Button>
            {status.neighborhood.state === 'success' && <span className="text-sm text-primary flex items-center gap-1"><CheckCircle className="h-4 w-4" />{status.neighborhood.message}</span>}
            {status.neighborhood.state === 'error' && <span className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="h-4 w-4" />{status.neighborhood.message}</span>}
            {status.neighborhood.state === 'loading' && <span className="text-sm text-muted-foreground">{status.neighborhood.message}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
