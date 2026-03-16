import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ImageIcon, Eye, Trash2, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from 'sonner';

interface ImageHash {
  id: string;
  property_id: string;
  image_url: string;
  sha256: string;
  phash: string;
  created_at: string;
}

interface DuplicateGroup {
  phash: string;
  images: (ImageHash & { property_title?: string; property_city?: string })[];
}

export function ImageDedupPanel() {
  const queryClient = useQueryClient();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // Fetch all image hashes grouped by similar phash
  const { data: duplicateGroups, isLoading } = useQuery({
    queryKey: ['image-dedup-groups'],
    queryFn: async () => {
      // Get all image hashes with property info
      const { data: hashes, error } = await supabase
        .from('image_hashes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!hashes || hashes.length === 0) return [];

      // Get property info for all property_ids
      const propertyIds = [...new Set(hashes.map(h => h.property_id).filter(Boolean))];
      const { data: properties } = await supabase
        .from('properties')
        .select('id, title, city')
        .in('id', propertyIds);

      const propMap = new Map(properties?.map(p => [p.id, p]) || []);

      // Group by similar phash (hamming distance ≤ 5)
      const groups: DuplicateGroup[] = [];
      const used = new Set<string>();

      for (const hash of hashes) {
        if (used.has(hash.id)) continue;

        const group: DuplicateGroup = { phash: hash.phash, images: [] };
        
        for (const other of hashes) {
          if (used.has(other.id)) continue;
          if (hammingDistance(hash.phash, other.phash) <= 5) {
            const prop = propMap.get(other.property_id);
            group.images.push({
              ...other,
              property_title: prop?.title,
              property_city: prop?.city,
            });
            used.add(other.id);
          }
        }

        // Only include groups with 2+ images from different properties
        const uniqueProps = new Set(group.images.map(i => i.property_id));
        if (group.images.length >= 2 && uniqueProps.size >= 2) {
          groups.push(group);
        }
      }

      return groups;
    },
    refetchInterval: 60000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (hashId: string) => {
      const { error } = await supabase
        .from('image_hashes')
        .delete()
        .eq('id', hashId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-dedup-groups'] });
      toast.success('Image hash dismissed');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Dedup
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const groups = duplicateGroups || [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Image Duplicates
            {groups.length > 0 && (
              <Badge variant="destructive" className="ml-2">{groups.length}</Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['image-dedup-groups'] })}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No cross-listing image duplicates detected
          </p>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {groups.map((group, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-3 space-y-2 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedGroup(selectedGroup === group.phash ? null : group.phash)}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">
                    {group.images.length} similar images across {new Set(group.images.map(i => i.property_id)).size} properties
                  </span>
                </div>

                {selectedGroup === group.phash && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {group.images.map((img) => (
                      <div key={img.id} className="space-y-1">
                        <AspectRatio ratio={4 / 3}>
                          <img
                            src={img.image_url}
                            alt="Property"
                            className="rounded-md object-cover w-full h-full"
                            loading="lazy"
                          />
                        </AspectRatio>
                        <p className="text-xs text-muted-foreground truncate">
                          {img.property_title || 'Untitled'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {img.property_city || 'Unknown city'}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/admin/properties?id=${img.property_id}`, '_blank');
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissMutation.mutate(img.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Compute Hamming distance between two 16-char hex strings (64-bit). */
function hammingDistance(a: string, b: string): number {
  let dist = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    const va = parseInt(a[i], 16);
    const vb = parseInt(b[i], 16);
    let xor = va ^ vb;
    while (xor) {
      dist += xor & 1;
      xor >>= 1;
    }
  }
  return dist;
}
