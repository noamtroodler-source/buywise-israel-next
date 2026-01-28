import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Upload, MapPin, Database, RefreshCw, FileJson, History, TrendingUp, Sparkles, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { SoldTransaction, SoldDataImport } from '@/types/soldTransactions';

export default function SoldTransactionsAdmin() {
  const queryClient = useQueryClient();
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<'nadlan_gov_il' | 'israel_tax_authority'>('nadlan_gov_il');
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [clearExistingOnSeed, setClearExistingOnSeed] = useState(false);

  // Fetch cities
  const { data: cities } = useQuery({
    queryKey: ['cities-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('name, slug')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch transaction stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['sold-transactions-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sold_transactions')
        .select('city, latitude', { count: 'exact' });
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const geocoded = data?.filter(t => t.latitude !== null).length || 0;
      const byCityMap = new Map<string, number>();
      data?.forEach(t => {
        byCityMap.set(t.city, (byCityMap.get(t.city) || 0) + 1);
      });
      
      return {
        total,
        geocoded,
        pendingGeocode: total - geocoded,
        byCity: Object.fromEntries(byCityMap),
      };
    },
  });

  // Fetch recent imports
  const { data: recentImports, isLoading: importsLoading } = useQuery({
    queryKey: ['sold-data-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sold_data_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data as SoldDataImport[];
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: async (transactions: unknown[]) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('import-sold-transactions', {
        body: {
          city: selectedCity,
          source: selectedSource,
          transactions,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Imported ${data.imported} transactions, ${data.failed} failed`);
      queryClient.invalidateQueries({ queryKey: ['sold-transactions-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sold-data-imports'] });
      setJsonInput('');
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  // Geocode mutation
  const geocodeMutation = useMutation({
    mutationFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('geocode-sold-transaction', {
        body: {
          city: selectedCity || undefined,
          limit: 50,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Geocoded ${data.geocoded} transactions, ${data.failed} failed`);
      queryClient.invalidateQueries({ queryKey: ['sold-transactions-stats'] });
    },
    onError: (error) => {
      toast.error(`Geocoding failed: ${error.message}`);
    },
  });

  // Seed mutation
  const seedMutation = useMutation({
    mutationFn: async (options: { clearExisting: boolean }) => {
      const response = await supabase.functions.invoke('seed-sold-transactions', {
        body: {
          clearExisting: options.clearExisting,
          limitCities: selectedCity ? [selectedCity] : undefined,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Seeded ${data.transactions_inserted} transactions for ${data.properties_processed} properties`);
      queryClient.invalidateQueries({ queryKey: ['sold-transactions-stats'] });
      queryClient.invalidateQueries({ queryKey: ['sold-data-imports'] });
    },
    onError: (error) => {
      toast.error(`Seeding failed: ${error.message}`);
    },
  });
  const handleImport = async () => {
    if (!selectedCity) {
      toast.error('Please select a city');
      return;
    }
    if (!jsonInput.trim()) {
      toast.error('Please paste JSON data');
      return;
    }

    try {
      setIsImporting(true);
      const transactions = JSON.parse(jsonInput);
      if (!Array.isArray(transactions)) {
        throw new Error('JSON must be an array of transactions');
      }
      await importMutation.mutateAsync(transactions);
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleGeocode = async () => {
    setIsGeocoding(true);
    try {
      await geocodeMutation.mutateAsync();
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSeedMockData = async () => {
    setIsSeeding(true);
    try {
      await seedMutation.mutateAsync({ clearExisting: clearExistingOnSeed });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sold Transactions</h2>
        <p className="text-muted-foreground">Import and manage government transaction data</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Geocoded
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-primary">{stats?.geocoded.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Geocode
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{stats?.pendingGeocode.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cities Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{Object.keys(stats?.byCity || {}).length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Transactions
          </CardTitle>
          <CardDescription>
            Paste JSON data from Nadlan.gov.il or Israel Tax Authority
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities?.map((city) => (
                    <SelectItem key={city.slug} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Source</Label>
              <Select value={selectedSource} onValueChange={(v) => setSelectedSource(v as typeof selectedSource)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nadlan_gov_il">Nadlan.gov.il</SelectItem>
                  <SelectItem value="israel_tax_authority">Israel Tax Authority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Transaction Data (JSON Array)</Label>
            <Textarea
              placeholder={`[
  {
    "sold_price": 2480000,
    "sold_date": "2024-06-15",
    "rooms": 3,
    "size_sqm": 90,
    "address": "רחוב הרצל 15",
    "property_type": "דירה"
  }
]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleImport} disabled={isImporting || !selectedCity}>
              {isImporting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FileJson className="mr-2 h-4 w-4" />
                  Import Transactions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Geocoding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Geocoding
          </CardTitle>
          <CardDescription>
            Add coordinates to transactions for proximity matching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label>City (optional)</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cities</SelectItem>
                  {cities?.map((city) => (
                    <SelectItem key={city.slug} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="pt-6">
              <Button onClick={handleGeocode} disabled={isGeocoding || stats?.pendingGeocode === 0}>
                {isGeocoding ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Geocoding...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Geocode Next 50
                  </>
                )}
              </Button>
            </div>
          </div>

          {stats?.pendingGeocode === 0 && (
            <p className="text-sm text-muted-foreground">
              All transactions have been geocoded.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Seed Mock Data Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Seed Mock Data
          </CardTitle>
          <CardDescription>
            Generate realistic sold transactions near all resale listings for demo purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="space-y-2 flex-1 max-w-xs">
              <Label>City (optional)</Label>
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger>
                  <SelectValue placeholder="All cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All cities</SelectItem>
                  {cities?.map((city) => (
                    <SelectItem key={city.slug} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Checkbox
                id="clearExisting"
                checked={clearExistingOnSeed}
                onCheckedChange={(checked) => setClearExistingOnSeed(checked === true)}
              />
              <Label htmlFor="clearExisting" className="text-sm font-normal cursor-pointer">
                Clear existing data first
              </Label>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button 
              onClick={handleSeedMockData} 
              disabled={isSeeding}
              variant={clearExistingOnSeed ? "destructive" : "default"}
            >
              {isSeeding ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Seeding...
                </>
              ) : clearExistingOnSeed ? (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear &amp; Seed Mock Data
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Seed Mock Data
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            This will generate 4-8 nearby sold transactions for each resale listing with coordinates.
            Prices will be calibrated to ±15% of listing prices for realistic comparisons.
          </p>
        </CardContent>
      </Card>

      {/* Recent Imports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Imports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {importsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentImports && recentImports.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Imported</TableHead>
                  <TableHead className="text-right">Geocoded</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentImports.map((imp) => (
                  <TableRow key={imp.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(imp.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">{imp.city}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{imp.source}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{imp.records_imported}</TableCell>
                    <TableCell className="text-right text-primary">{imp.records_geocoded}</TableCell>
                    <TableCell className="text-right text-destructive">
                      {imp.records_failed > 0 ? imp.records_failed : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="mx-auto h-10 w-10 mb-3 opacity-50" />
              <p>No imports yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* City Coverage */}
      {stats && Object.keys(stats.byCity).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Coverage by City
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.byCity)
                .sort((a, b) => b[1] - a[1])
                .map(([city, count]) => (
                  <Badge key={city} variant="outline" className="px-3 py-1">
                    {city}: {count.toLocaleString()}
                  </Badge>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
