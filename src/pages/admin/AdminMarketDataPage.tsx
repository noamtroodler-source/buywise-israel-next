import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, RefreshCw, TrendingUp, Calendar } from 'lucide-react';

interface HistoricalPrice {
  id: string;
  city: string;
  year: number;
  average_price: number | null;
  average_price_sqm: number | null;
  yoy_change_percent: number | null;
  transaction_count: number | null;
  source: string | null;
  notes: string | null;
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
  const [editingPrice, setEditingPrice] = useState<HistoricalPrice | null>(null);
  const [editingBracket, setEditingBracket] = useState<PurchaseTaxBracket | null>(null);
  const [isAddingPrice, setIsAddingPrice] = useState(false);

  // Historical Prices
  const { data: historicalPrices, isLoading: loadingPrices } = useQuery({
    queryKey: ['admin-historical-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('historical_prices')
        .select('*')
        .order('city')
        .order('year', { ascending: false });
      if (error) throw error;
      return data as HistoricalPrice[];
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
    mutationFn: async (price: Partial<HistoricalPrice> & { id: string }) => {
      const { id, ...data } = price;
      const { error } = await supabase
        .from('historical_prices')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-historical-prices'] });
      toast.success('Price data updated');
      setEditingPrice(null);
    },
    onError: (error) => toast.error('Failed to update: ' + error.message),
  });

  const addPriceMutation = useMutation({
    mutationFn: async (price: Omit<HistoricalPrice, 'id'>) => {
      const { error } = await supabase.from('historical_prices').insert([price]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-historical-prices'] });
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

  const filteredPrices = historicalPrices?.filter((p) =>
    p.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueCities = [...new Set(historicalPrices?.map((p) => p.city) || [])];
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
          Manage historical prices and tax brackets.
        </p>
      </div>

      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Historical Prices
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
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">₪/sqm</TableHead>
                      <TableHead className="text-right">YoY %</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPrices?.slice(0, 100).map((price) => (
                      <TableRow key={price.id}>
                        <TableCell className="font-medium">{price.city}</TableCell>
                        <TableCell>{price.year}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(price.average_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(price.average_price_sqm)}
                        </TableCell>
                        <TableCell className="text-right">
                          {price.yoy_change_percent != null ? (
                            <span
                              className={
                                price.yoy_change_percent >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }
                            >
                              {price.yoy_change_percent >= 0 ? '+' : ''}
                              {price.yoy_change_percent}%
                            </span>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {price.source && (
                            <Badge variant="outline">{price.source}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingPrice(price)}
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
            <DialogTitle>Edit Historical Price</DialogTitle>
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
            <DialogTitle>Add Historical Price</DialogTitle>
          </DialogHeader>
          <PriceForm
            cities={uniqueCities}
            onSubmit={(data) => addPriceMutation.mutate(data as Omit<HistoricalPrice, 'id'>)}
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
  initialData?: Partial<HistoricalPrice>;
  cities: string[];
  onSubmit: (data: Partial<HistoricalPrice>) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<Partial<HistoricalPrice>>(
    initialData || { city: '', year: new Date().getFullYear() }
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
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
          <Label>Average Price (₪)</Label>
          <Input
            type="number"
            value={formData.average_price || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                average_price: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Price per sqm (₪)</Label>
          <Input
            type="number"
            value={formData.average_price_sqm || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                average_price_sqm: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>YoY Change (%)</Label>
          <Input
            type="number"
            step="0.1"
            value={formData.yoy_change_percent ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                yoy_change_percent: e.target.value ? parseFloat(e.target.value) : null,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label>Source</Label>
          <Input
            value={formData.source || ''}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
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
            placeholder="Leave empty for no limit"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Rate (%)</Label>
        <Input
          type="number"
          step="0.1"
          value={formData.rate_percent || ''}
          onChange={(e) =>
            setFormData({ ...formData, rate_percent: parseFloat(e.target.value) })
          }
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
