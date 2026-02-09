import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { City } from '@/types/content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, Edit, Star, StarOff, RefreshCw, MapPin } from 'lucide-react';
import { CityEditor } from '@/components/admin/CityEditor';

export function AdminCitiesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCity, setEditingCity] = useState<City | null>(null);

  const { data: cities, isLoading } = useQuery({
    queryKey: ['admin-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as City[];
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from('cities')
        .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
      queryClient.invalidateQueries({ queryKey: ['cities'] });
      queryClient.invalidateQueries({ queryKey: ['featuredCities'] });
      toast.success('City updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const filteredCities = cities?.filter((city) =>
    city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    city.region?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number | null | undefined) => {
    if (!price) return '-';
    return `₪${(price / 1000000).toFixed(2)}M`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cities Management</h2>
          <p className="text-muted-foreground">
            Manage city data, pricing, and investment metrics.
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {cities?.length || 0} cities
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Price/sqm</TableHead>
                  <TableHead className="text-right">Gross Yield</TableHead>
                  <TableHead className="text-center">Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities?.map((city) => (
                  <TableRow key={city.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {city.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {city.region && (
                        <Badge variant="outline">{city.region}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(city.median_apartment_price || city.average_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {city.average_price_sqm
                        ? `₪${city.average_price_sqm.toLocaleString()}`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {city.gross_yield_percent
                        ? `${city.gross_yield_percent}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          toggleFeaturedMutation.mutate({
                            id: city.id,
                            isFeatured: !city.is_featured,
                          })
                        }
                        disabled={toggleFeaturedMutation.isPending}
                      >
                        {city.is_featured ? (
                          <Star className="h-4 w-4 fill-primary text-primary" />
                        ) : (
                          <StarOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCity(city)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCities?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No cities found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingCity} onOpenChange={(open) => !open && setEditingCity(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Edit {editingCity?.name}
            </DialogTitle>
          </DialogHeader>
          {editingCity && (
            <CityEditor
              city={editingCity}
              onClose={() => setEditingCity(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
