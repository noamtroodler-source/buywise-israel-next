import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Search, RefreshCw, Edit, Trash2, BookOpen } from 'lucide-react';

interface GlossaryTerm {
  id: string;
  hebrew_term: string;
  transliteration: string | null;
  english_term: string;
  simple_explanation: string | null;
  detailed_explanation: string | null;
  usage_context: string | null;
  pro_tip: string | null;
  category: string | null;
  sort_order: number;
  created_at: string;
}

const CATEGORIES = [
  'legal',
  'finance',
  'property',
  'tax',
  'mortgage',
  'process',
  'general',
];

const emptyTerm: Partial<GlossaryTerm> = {
  hebrew_term: '',
  transliteration: '',
  english_term: '',
  simple_explanation: '',
  detailed_explanation: '',
  usage_context: '',
  pro_tip: '',
  category: 'general',
  sort_order: 0,
};

export function AdminGlossary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingTerm, setEditingTerm] = useState<Partial<GlossaryTerm> | null>(null);
  const [deletingTerm, setDeletingTerm] = useState<GlossaryTerm | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: terms, isLoading } = useQuery({
    queryKey: ['admin-glossary-terms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('glossary_terms')
        .select('*')
        .order('sort_order')
        .order('english_term');
      if (error) throw error;
      return data as GlossaryTerm[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (term: Partial<GlossaryTerm>) => {
      const { error } = await supabase.from('glossary_terms').insert([{
        hebrew_term: term.hebrew_term!,
        english_term: term.english_term!,
        transliteration: term.transliteration,
        simple_explanation: term.simple_explanation,
        detailed_explanation: term.detailed_explanation,
        usage_context: term.usage_context,
        pro_tip: term.pro_tip,
        category: term.category,
        sort_order: term.sort_order || 0,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      toast.success('Term created successfully');
      setEditingTerm(null);
      setIsCreating(false);
    },
    onError: (error) => {
      toast.error('Failed to create term: ' + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (term: Partial<GlossaryTerm>) => {
      const { error } = await supabase
        .from('glossary_terms')
        .update(term)
        .eq('id', term.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      toast.success('Term updated successfully');
      setEditingTerm(null);
    },
    onError: (error) => {
      toast.error('Failed to update term: ' + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('glossary_terms')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-glossary-terms'] });
      toast.success('Term deleted');
      setDeletingTerm(null);
    },
    onError: (error) => {
      toast.error('Failed to delete term: ' + error.message);
    },
  });

  const handleSave = () => {
    if (!editingTerm) return;
    if (!editingTerm.hebrew_term || !editingTerm.english_term) {
      toast.error('Hebrew term and English term are required');
      return;
    }

    if (isCreating) {
      createMutation.mutate(editingTerm);
    } else {
      updateMutation.mutate(editingTerm);
    }
  };

  const filteredTerms = terms?.filter((t) => {
    const matchesSearch =
      t.hebrew_term.toLowerCase().includes(search.toLowerCase()) ||
      t.english_term.toLowerCase().includes(search.toLowerCase()) ||
      t.transliteration?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = terms?.filter((t) => t.category === cat).length || 0;
    return acc;
  }, {} as Record<string, number>);

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
          <h2 className="text-2xl font-bold text-foreground">Glossary Terms</h2>
          <p className="text-muted-foreground">
            Manage real estate terminology and definitions.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingTerm(emptyTerm);
            setIsCreating(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Term
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className="px-3 py-1">
          <BookOpen className="h-3 w-3 mr-2" />
          {terms?.length || 0} total terms
        </Badge>
        {CATEGORIES.map((cat) => (
          categoryCounts[cat] > 0 && (
            <Badge key={cat} variant="secondary" className="px-3 py-1 capitalize">
              {cat}: {categoryCounts[cat]}
            </Badge>
          )
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search terms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Terms ({filteredTerms?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hebrew</TableHead>
                <TableHead>Transliteration</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTerms?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No terms found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTerms?.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-medium" dir="rtl">{term.hebrew_term}</TableCell>
                    <TableCell className="text-muted-foreground">{term.transliteration}</TableCell>
                    <TableCell>{term.english_term}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {term.category || 'general'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTerm(term);
                            setIsCreating(false);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingTerm(term)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingTerm} onOpenChange={() => setEditingTerm(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? 'Add New Term' : 'Edit Term'}</DialogTitle>
            <DialogDescription>
              Fill in the details for this glossary term.
            </DialogDescription>
          </DialogHeader>
          {editingTerm && (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hebrew_term">Hebrew Term *</Label>
                  <Input
                    id="hebrew_term"
                    dir="rtl"
                    value={editingTerm.hebrew_term || ''}
                    onChange={(e) =>
                      setEditingTerm({ ...editingTerm, hebrew_term: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transliteration">Transliteration</Label>
                  <Input
                    id="transliteration"
                    value={editingTerm.transliteration || ''}
                    onChange={(e) =>
                      setEditingTerm({ ...editingTerm, transliteration: e.target.value })
                    }
                    placeholder="e.g., Mas Rechisha"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="english_term">English Term *</Label>
                  <Input
                    id="english_term"
                    value={editingTerm.english_term || ''}
                    onChange={(e) =>
                      setEditingTerm({ ...editingTerm, english_term: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingTerm.category || 'general'}
                    onValueChange={(value) =>
                      setEditingTerm({ ...editingTerm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="capitalize">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="simple_explanation">Simple Explanation</Label>
                <Textarea
                  id="simple_explanation"
                  value={editingTerm.simple_explanation || ''}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, simple_explanation: e.target.value })
                  }
                  placeholder="A brief, easy-to-understand explanation"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="detailed_explanation">Detailed Explanation</Label>
                <Textarea
                  id="detailed_explanation"
                  value={editingTerm.detailed_explanation || ''}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, detailed_explanation: e.target.value })
                  }
                  placeholder="In-depth explanation with context"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usage_context">Usage Context</Label>
                <Textarea
                  id="usage_context"
                  value={editingTerm.usage_context || ''}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, usage_context: e.target.value })
                  }
                  placeholder="When/where this term is typically used"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pro_tip">Pro Tip</Label>
                <Textarea
                  id="pro_tip"
                  value={editingTerm.pro_tip || ''}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, pro_tip: e.target.value })
                  }
                  placeholder="Helpful advice for buyers"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={editingTerm.sort_order || 0}
                  onChange={(e) =>
                    setEditingTerm({ ...editingTerm, sort_order: parseInt(e.target.value) || 0 })
                  }
                  className="max-w-24"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTerm(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {isCreating ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTerm} onOpenChange={() => setDeletingTerm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Term</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTerm?.english_term}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingTerm && deleteMutation.mutate(deletingTerm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}