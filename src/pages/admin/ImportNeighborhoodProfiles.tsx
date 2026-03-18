import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileRow {
  city: string;
  neighborhood: string;
  reputation?: string;
  physical_character?: string;
  proximity_anchors?: string;
  anglo_community?: string;
  daily_life?: string;
  transit_mobility?: string;
  honest_tradeoff?: string;
  best_for?: string;
  sources?: string;
}

// Column mapping from Excel headers to our fields
const COLUMN_MAP: Record<string, keyof ProfileRow> = {
  'city': 'city',
  'neighborhood': 'neighborhood',
  'reputation & positioning': 'reputation',
  'reputation': 'reputation',
  'physical character': 'physical_character',
  'proximity anchors': 'proximity_anchors',
  'anglo/international community': 'anglo_community',
  'anglo community': 'anglo_community',
  'daily life infrastructure': 'daily_life',
  'daily life': 'daily_life',
  'transit & mobility': 'transit_mobility',
  'transit': 'transit_mobility',
  'honest trade-off': 'honest_tradeoff',
  'honest tradeoff': 'honest_tradeoff',
  'best for': 'best_for',
  'sources': 'sources',
};

function parseCSV(text: string): ProfileRow[] {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
  const fieldMap: (keyof ProfileRow | null)[] = headers.map(h => COLUMN_MAP[h] || null);

  const rows: ProfileRow[] = [];
  
  // Simple CSV parser that handles quoted fields
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Partial<ProfileRow> = {};
    fieldMap.forEach((field, idx) => {
      if (field && values[idx]) {
        (row as any)[field] = values[idx];
      }
    });

    if (row.city && row.neighborhood) {
      rows.push(row as ProfileRow);
    }
  }

  return rows;
}

export default function ImportNeighborhoodProfiles() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      const parsed = parseCSV(text);
      setProfiles(parsed);
      toast.success(`Parsed ${parsed.length} neighborhood profiles from CSV`);
    } else {
      toast.error('Please upload a CSV file. Export your Excel as CSV first.');
    }
  }, []);

  const handleImport = async () => {
    if (profiles.length === 0) return;
    setImporting(true);
    setResult(null);

    try {
      const BATCH = 50;
      let totalInserted = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < profiles.length; i += BATCH) {
        const batch = profiles.slice(i, i + BATCH);
        const { data, error } = await supabase.functions.invoke('import-neighborhood-profiles', {
          body: { profiles: batch },
        });

        if (error) {
          allErrors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
        } else if (data) {
          totalInserted += data.inserted || 0;
          if (data.errors?.length) allErrors.push(...data.errors);
        }
      }

      setResult({ inserted: totalInserted, errors: allErrors });
      toast.success(`Imported ${totalInserted} profiles`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Neighborhood Profiles</h1>
        <p className="text-muted-foreground mt-1">Upload CSV with neighborhood research data (8 fields + sources)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Expected columns: City, Neighborhood, Reputation & Positioning, Physical Character, 
              Proximity Anchors, Anglo/International Community, Daily Life Infrastructure, 
              Transit & Mobility, Honest Trade-off, Best For, Sources
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {profiles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {profiles.length} profiles parsed • {new Set(profiles.map(p => p.city)).size} cities
              </p>

              <div className="max-h-60 overflow-y-auto border border-border rounded-md">
                <table className="w-full text-xs">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">City</th>
                      <th className="text-left p-2">Neighborhood</th>
                      <th className="text-left p-2">Fields</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.slice(0, 50).map((p, i) => {
                      const fieldCount = [p.reputation, p.physical_character, p.proximity_anchors, p.anglo_community, p.daily_life, p.transit_mobility, p.honest_tradeoff, p.best_for].filter(Boolean).length;
                      return (
                        <tr key={i} className="border-t border-border">
                          <td className="p-2">{p.city}</td>
                          <td className="p-2">{p.neighborhood}</td>
                          <td className="p-2">{fieldCount}/8</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {profiles.length > 50 && (
                  <p className="text-xs text-muted-foreground p-2">...and {profiles.length - 50} more</p>
                )}
              </div>

              <Button onClick={handleImport} disabled={importing}>
                {importing ? 'Importing...' : `Import ${profiles.length} Profiles`}
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{result.inserted} profiles imported successfully</span>
              </div>
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>{result.errors.length} errors</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto text-xs text-muted-foreground bg-muted p-2 rounded">
                    {result.errors.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
