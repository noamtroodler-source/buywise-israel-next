import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Plus, Edit, RefreshCw, TrendingUp, Calendar } from 'lucide-react';

interface CityPriceEntry {
  id: string;
  city_en: string;
  year: number;
  quarter: number;
  rooms: number;
  avg_price_nis: number | null;
  country_avg: number | null;
}

interface PurchaseTaxBracket {
  id: string;
  buyer_type: string;
  bracket_min: number;
  bracket_max: number | null;
  rate_percent: number;
  is_current: boolean;
  effective_from: string;
  notes: string | null;
}

export function AdminMarketDataPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPrice, setEditingPrice] = useState<CityPriceEntry | null>(null);
  const [editingBracket, setEditingBracket] = useState<PurchaseTaxBracket | null>(null);
  const [isAddingPrice, setIsAddingPrice] = useState(false);

  // City Price History
  const { data: priceHistory, isLoading: loadingPrices } = useQuery({
    queryKey: ['admin-city-price-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_price_history')
        .select('*')
        .order('city_en')
        .order('year', { ascending: false })
        .order('quarter', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as CityPriceEntry[];
    },
  });

  // Tax Brackets
  const { data: taxBrackets, isLoading: loadingBrackets } = useQuery({
    queryKey: ['admin-tax-brackets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('purchase_tax_brackets')
        .select('*')
        .order('buyer_type')
        .order('bracket_min');
      if (error) throw error;
      return data as PurchaseTaxBracket[];
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async (entry: Partial<CityPriceEntry> & { id: string }) => {
      const { id, ...data } = entry;
      const { error } = await supabase
        .from('city_price_history')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-city-price-history'] });
      toast.success('Price data updated');
      setEditingPrice(null);
    },
    onError: (error) => toast.error('Failed to update: ' + error.message),
  });

  const addPriceMutation = useMutation({
    mutationFn: async (entry: Omit<CityPriceEntry, 'id'>) => {
      const { error } = await supabase.from('city_price_history').insert([entry]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-city-price-history'] });
      toast.success('Price data added');
      setIsAddingPrice(false);
    },
    onError: (error) => toast.error('Failed to add: ' + error.message),
  });

  const updateBracketMutation = useMutation({
    mutationFn: async (bracket: Partial<PurchaseTaxBracket> & { id: string }) => {
      const { id, ...data } = bracket;
      const { error } = await supabase
        .from('purchase_tax_brackets')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tax-brackets'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-tax-brackets'] });
      toast.success('Tax bracket updated');
      setEditingBracket(null);
    },
    onError: (error) => toast.error('Failed to update: ' + error.message),
  });

  const filteredPrices = priceHistory?.filter((p) =>
    p.city_en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueCities = [...new Set(priceHistory?.map((p) => p.city_en) || [])];
  const buyerTypes = [...new Set(taxBrackets?.map((b) => b.buyer_type) || [])];

  const formatCurrency = (val: number | null) =>
    val ? `₪${val.toLocaleString()}` : '-';

  if (loadingPrices || loadingBrackets) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Market Data Management</h2>
        <p className="text-muted-foreground">
          Manage city price history (CBS data) and tax brackets.
        </p>
      </div>

      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            City Price History
          </TabsTrigger>
          <TabsTrigger value="brackets" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Tax Brackets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setIsAddingPrice(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>City</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Rooms</TableHead>
                      <TableHead className="text-right">Avg Price (₪)</TableHead>
                      <TableHead className="text-right">Country Avg</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrices?.slice(0, 100).map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.city_en}</TableCell>
                        <TableCell>{entry.year}</TableCell>
                        <TableCell>Q{entry.quarter}</TableCell>
                        <TableCell>{entry.rooms}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.avg_price_nis)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.country_avg)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingPrice(entry)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredPrices && filteredPrices.length > 100 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Showing first 100 of {filteredPrices.length} entries
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brackets" className="space-y-4">
          {buyerTypes.map((buyerType) => (
            <Card key={buyerType}>
              <CardHeader>
                <CardTitle className="capitalize">{buyerType.replace(/_/g, ' ')}</CardTitle>
                <CardDescription>
                  Purchase tax brackets for {buyerType.replace(/_/g, ' ')} buyers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bracket Min</TableHead>
                        <TableHead>Bracket Max</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taxBrackets
                        ?.filter((b) => b.buyer_type === buyerType)
                        .map((bracket) => (
                          <TableRow key={bracket.id}>
                            <TableCell>{formatCurrency(bracket.bracket_min)}</TableCell>
                            <TableCell>
                              {bracket.bracket_max
                                ? formatCurrency(bracket.bracket_max)
                                : 'No limit'}
                            </TableCell>
                            <TableCell className="font-medium">
                              {bracket.rate_percent}%
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={bracket.is_current ? 'default' : 'secondary'}
                              >
                                {bracket.is_current ? 'Current' : 'Historical'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingBracket(bracket)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Edit Price Dialog */}
      <Dialog open={!!editingPrice} onOpenChange={(open) => !open && setEditingPrice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Price Entry</DialogTitle>
          </DialogHeader>
          {editingPrice && (
            <PriceForm
              initialData={editingPrice}
              cities={uniqueCities}
              onSubmit={(data) => updatePriceMutation.mutate({ ...data, id: editingPrice.id })}
              onCancel={() => setEditingPrice(null)}
              isLoading={updatePriceMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Price Dialog */}
      <Dialog open={isAddingPrice} onOpenChange={setIsAddingPrice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Price Entry</DialogTitle>
          </DialogHeader>
          <PriceForm
            cities={uniqueCities}
            onSubmit={(data) => addPriceMutation.mutate(data as Omit<CityPriceEntry, 'id'>)}
            onCancel={() => setIsAddingPrice(false)}
            isLoading={addPriceMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Bracket Dialog */}
      <Dialog open={!!editingBracket} onOpenChange={(open) => !open && setEditingBracket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tax Bracket</DialogTitle>
          </DialogHeader>
          {editingBracket && (
            <BracketForm
              initialData={editingBracket}
              onSubmit={(data) =>
                updateBracketMutation.mutate({ ...data, id: editingBracket.id })
              }
              onCancel={() => setEditingBracket(null)}
              isLoading={updateBracketMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Price Form Component
function PriceForm({
  initialData,
  cities,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData?: Partial<CityPriceEntry>;
  cities: string[];
  onSubmit: (data: Partial<CityPriceEntry>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<CityPriceEntry>>(
    initialData || { city_en: '', year: new Date().getFullYear(), quarter: 1, rooms: 3 }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input
            value={formData.city_en || ''}
            onChange={(e) => setFormData({ ...formData, city_en: e.target.value })}
            list="cities"
          />
          <datalist id="cities">
            {cities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Input
            type="number"
            value={formData.year || ''}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Quarter</Label>
          <Select
            value={String(formData.quarter || 1)}
            onValueChange={(v) => setFormData({ ...formData, quarter: parseInt(v) })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map(q => (
                <SelectItem key={q} value={String(q)}>Q{q}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Rooms</Label>
          <Input
            type="number"
            value={formData.rooms || ''}
            onChange={(e) => setFormData({ ...formData, rooms: parseInt(e.target.value) })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Average Price (₪)</Label>
          <Input
            type="number"
            value={formData.avg_price_nis || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                avg_price_nis: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Country Average (₪)</Label>
          <Input
            type="number"
            value={formData.country_avg || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                country_avg: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(formData)} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  );
}

// Bracket Form Component
function BracketForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: {
  initialData: PurchaseTaxBracket;
  onSubmit: (data: Partial<PurchaseTaxBracket>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<PurchaseTaxBracket>>(initialData);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Bracket Min (₪)</Label>
          <Input
            type="number"
            value={formData.bracket_min || ''}
            onChange={(e) =>
              setFormData({ ...formData, bracket_min: parseFloat(e.target.value) })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Bracket Max (₪)</Label>
          <Input
            type="number"
            value={formData.bracket_max ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                bracket_max: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
            placeholder="No limit"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Rate (%)</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.rate_percent || ''}
            onChange={(e) =>
              setFormData({ ...formData, rate_percent: parseFloat(e.target.value) })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Effective From</Label>
          <Input
            type="date"
            value={formData.effective_from || ''}
            onChange={(e) =>
              setFormData({ ...formData, effective_from: e.target.value })
            }
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Input
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(formData)} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogFooter>
    </div>
  );
}
