import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

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

// Column header normalization
function normalizeHeader(h: string): keyof ProfileRow | null {
  const lower = h.toLowerCase().trim();
  if (lower === 'neighborhood') return 'neighborhood';
  if (lower.includes('reputation')) return 'reputation';
  if (lower.includes('physical')) return 'physical_character';
  if (lower.includes('proximity')) return 'proximity_anchors';
  if (lower.includes('anglo') || lower.includes('international community')) return 'anglo_community';
  if (lower.includes('daily life')) return 'daily_life';
  if (lower.includes('transit')) return 'transit_mobility';
  if (lower.includes('trade-off') || lower.includes('tradeoff') || lower.includes('trade off')) return 'honest_tradeoff';
  if (lower.includes('best for')) return 'best_for';
  if (lower === 'sources') return 'sources';
  return null;
}

function parseExcel(buffer: ArrayBuffer): ProfileRow[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const profiles: ProfileRow[] = [];

  // First sheet is Overview — skip it
  const sheetNames = workbook.SheetNames;

  for (let i = 1; i < sheetNames.length; i++) {
    const cityName = sheetNames[i];
    const sheet = workbook.Sheets[cityName];
    if (!sheet) continue;

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });

    for (const row of rows) {
      const keys = Object.keys(row);
      // Map columns
      const profile: Partial<ProfileRow> = { city: cityName };

      for (const key of keys) {
        const field = normalizeHeader(key);
        if (field && row[key]) {
          (profile as any)[field] = String(row[key]).trim();
        }
      }

      if (profile.neighborhood) {
        // Handle city-level entries (single neighborhood = city overview)
        if (profile.neighborhood === '(City-Level)') {
          profile.neighborhood = cityName;
        }
        profiles.push(profile as ProfileRow);
      }
    }
  }

  return profiles;
}

function parseCSV(text: string): ProfileRow[] {
  const lines = text.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const fieldMap = headers.map(h => normalizeHeader(h));
  // Find city column
  const cityIdx = headers.findIndex(h => h.toLowerCase().trim() === 'city');

  const rows: ProfileRow[] = [];
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
    if (cityIdx >= 0 && values[cityIdx]) {
      row.city = values[cityIdx];
    }
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

    try {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const parsed = parseExcel(buffer);
        setProfiles(parsed);
        toast.success(`Parsed ${parsed.length} neighborhood profiles from ${new Set(parsed.map(p => p.city)).size} city sheets`);
      } else if (file.name.endsWith('.csv')) {
        const text = await file.text();
        const parsed = parseCSV(text);
        setProfiles(parsed);
        toast.success(`Parsed ${parsed.length} neighborhood profiles from CSV`);
      } else {
        toast.error('Please upload an .xlsx or .csv file');
      }
    } catch (err: any) {
      toast.error(`Parse error: ${err.message}`);
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
      if (totalInserted > 0) {
        toast.success(`Imported ${totalInserted} neighborhood profiles`);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
    }
  };

  const cityCounts = profiles.reduce((acc, p) => {
    acc[p.city] = (acc[p.city] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Import Neighborhood Profiles</h1>
        <p className="text-muted-foreground mt-1">Upload the Excel workbook or CSV with neighborhood research data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Accepts <strong>.xlsx</strong> (Excel workbook with one sheet per city) or <strong>.csv</strong> with columns:
              Neighborhood, Reputation & Positioning, Physical Character, Proximity Anchors, Anglo/International Community,
              Daily Life Infrastructure, Transit & Mobility, Honest Trade-off, Best For, Sources
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          {profiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium text-foreground">
                  {profiles.length} profiles • {Object.keys(cityCounts).length} cities
                </p>
              </div>

              {/* City breakdown */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(cityCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([city, count]) => (
                  <span key={city} className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs">
                    {city} <span className="text-muted-foreground">({count})</span>
                  </span>
                ))}
              </div>

              {/* Preview table */}
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
                    {profiles.slice(0, 100).map((p, i) => {
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
                {profiles.length > 100 && (
                  <p className="text-xs text-muted-foreground p-2">...and {profiles.length - 100} more</p>
                )}
              </div>

              <Button onClick={handleImport} disabled={importing} size="lg">
                {importing ? 'Importing...' : `Import ${profiles.length} Profiles`}
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-2 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">{result.inserted} profiles imported successfully</span>
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
