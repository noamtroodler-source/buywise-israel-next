import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import neighborhoodData from '@/data/israel_neighborhoods.json';
import { Check, X, Loader2 } from 'lucide-react';

interface CityResult {
  slug: string;
  success: boolean;
  neighborhoodsCount: number;
  error?: string;
}

export default function ImportNeighborhoods() {
  const [results, setResults] = useState<CityResult[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleImport = async () => {
    setIsImporting(true);
    setResults([]);
    setProgress(0);

    const cities = neighborhoodData as { slug: string; neighborhoods: any[] }[];
    const newResults: CityResult[] = [];

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      setProgress(Math.round(((i + 1) / cities.length) * 100));

      try {
        const { error } = await supabase
          .from('cities')
          .update({ neighborhoods: city.neighborhoods })
          .eq('slug', city.slug);

        if (error) {
          newResults.push({
            slug: city.slug,
            success: false,
            neighborhoodsCount: 0,
            error: error.message,
          });
        } else {
          newResults.push({
            slug: city.slug,
            success: true,
            neighborhoodsCount: city.neighborhoods.length,
          });
        }
      } catch (err) {
        newResults.push({
          slug: city.slug,
          success: false,
          neighborhoodsCount: 0,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      setResults([...newResults]);
    }

    setIsImporting(false);
  };

  const successCount = results.filter(r => r.success).length;
  const totalNeighborhoods = results.filter(r => r.success).reduce((sum, r) => sum + r.neighborhoodsCount, 0);

  return (
    <div className="container py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Import Neighborhood Boundaries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Button onClick={handleImport} disabled={isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing... {progress}%
                </>
              ) : (
                'Import All Neighborhoods'
              )}
            </Button>
            <span className="text-muted-foreground">
              {neighborhoodData.length} cities to import
            </span>
          </div>

          {results.length > 0 && (
            <div className="space-y-4">
              <div className="text-lg font-medium">
                Results: {successCount}/{results.length} cities updated ({totalNeighborhoods} neighborhoods)
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {results.map((result) => (
                  <div
                    key={result.slug}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      result.success ? 'bg-primary/10' : 'bg-destructive/10'
                    }`}
                  >
                    {result.success ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-sm">
                      {result.slug} ({result.neighborhoodsCount})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
