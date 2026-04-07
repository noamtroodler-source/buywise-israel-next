import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Trash2, Eye, EyeOff, Building2, UserCheck, Globe, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type SourceFilter = 'all' | 'agency' | 'scraped_yad2' | 'scraped_website' | 'unclaimed';

export default function AdminProperties() {
  const queryClient = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [search, setSearch] = useState('');

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['adminProperties'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('properties')
        .select('id, title, city, neighborhood, price, listing_status, is_published, images, created_at, import_source, source_agency_name, is_claimed, agent:agent_id (name, agency:agency_id (name, logo_url))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('properties')
        .update({ is_published: !is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProperties'] });
      toast.success('Property updated');
    },
  });

  const deleteProperty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('properties').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProperties'] });
      toast.success('Property deleted');
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Classify each property's source
  const getSourceInfo = (property: any) => {
    const isScraped = !!property.import_source;
    const isClaimed = !!property.is_claimed;

    if (!isScraped) {
      // Direct agency listing
      const agencyName = property.agent?.agency?.name || property.agent?.name || null;
      return { type: 'agency' as const, label: agencyName || 'Direct listing', agencyLogo: property.agent?.agency?.logo_url };
    }

    if (isClaimed) {
      const agencyName = property.agent?.agency?.name || property.source_agency_name || 'Claimed';
      return { type: 'claimed' as const, label: agencyName, agencyLogo: property.agent?.agency?.logo_url };
    }

    // Unclaimed scraped
    const source = property.import_source === 'yad2' ? 'Yad2'
      : property.import_source === 'website_scrape' ? 'Website scrape'
      : property.import_source;

    const agencyName = property.source_agency_name || null;
    return {
      type: 'scraped' as const,
      source,
      label: agencyName ? `${agencyName} via ${source}` : source,
      importSource: property.import_source,
    };
  };

  // Filter logic
  const filtered = properties.filter((p: any) => {
    const info = getSourceInfo(p);

    if (sourceFilter === 'agency' && info.type !== 'agency') return false;
    if (sourceFilter === 'scraped_yad2' && !(info.type === 'scraped' && info.importSource === 'yad2')) return false;
    if (sourceFilter === 'scraped_website' && !(info.type === 'scraped' && info.importSource === 'website_scrape')) return false;
    if (sourceFilter === 'unclaimed' && info.type !== 'scraped') return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.title?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.source_agency_name?.toLowerCase().includes(q) ||
        p.agent?.name?.toLowerCase().includes(q) ||
        p.agent?.agency?.name?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Source counts for filter pills
  const counts = {
    all: properties.length,
    agency: properties.filter((p: any) => getSourceInfo(p).type === 'agency').length,
    scraped_yad2: properties.filter((p: any) => { const i = getSourceInfo(p); return i.type === 'scraped' && i.importSource === 'yad2'; }).length,
    scraped_website: properties.filter((p: any) => { const i = getSourceInfo(p); return i.type === 'scraped' && i.importSource === 'website_scrape'; }).length,
    unclaimed: properties.filter((p: any) => getSourceInfo(p).type === 'scraped').length,
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Properties</h2>
          <p className="text-muted-foreground">{filtered.length} of {properties.length} properties</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Source filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {([
            { key: 'all', label: 'All' },
            { key: 'agency', label: 'Agency' },
            { key: 'scraped_yad2', label: 'Yad2' },
            { key: 'scraped_website', label: 'Website scrape' },
            { key: 'unclaimed', label: 'All scraped' },
          ] as { key: SourceFilter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                sourceFilter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/50"
              )}
            >
              {label} <span className="opacity-60">({counts[key]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search title, city, agency…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 w-56 text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Property</th>
                  <th className="text-left p-4 font-medium">Source</th>
                  <th className="text-left p-4 font-medium">Price</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Published</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((property: any) => {
                  const info = getSourceInfo(property);
                  return (
                    <tr key={property.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                            alt={property.title}
                            className="h-10 w-10 rounded object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1 text-sm">{property.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Source column */}
                      <td className="p-4">
                        {info.type === 'agency' && (
                          <div className="flex items-center gap-2">
                            {info.agencyLogo ? (
                              <img src={info.agencyLogo} alt="" className="h-5 w-5 rounded object-cover" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium text-foreground truncate max-w-[140px]">{info.label}</span>
                          </div>
                        )}
                        {info.type === 'claimed' && (
                          <div className="flex items-center gap-2">
                            {info.agencyLogo ? (
                              <img src={info.agencyLogo} alt="" className="h-5 w-5 rounded object-cover" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="text-sm font-medium text-foreground truncate block max-w-[140px]">{info.label}</span>
                              <span className="text-xs text-green-600">Claimed</span>
                            </div>
                          </div>
                        )}
                        {info.type === 'scraped' && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-amber-600 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm text-foreground truncate block max-w-[160px]">{info.label}</span>
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200 font-normal">
                                Unclaimed
                              </Badge>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="p-4 text-sm font-medium">{formatPrice(property.price)}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">{property.listing_status}</Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={property.is_published ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}>
                          {property.is_published ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePublish.mutate({ id: property.id, is_published: property.is_published })}
                          >
                            {property.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Property</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this property? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteProperty.mutate(property.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                      No properties match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
