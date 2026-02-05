import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertTriangle, Bug, ChevronDown, ChevronRight, RefreshCw, Search, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ClientError {
  id: string;
  error_type: string;
  error_message: string;
  page_path: string;
  stack_trace: string | null;
  session_id: string;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default function AdminClientErrors() {
  const [searchQuery, setSearchQuery] = useState('');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: errors, isLoading, refetch } = useQuery({
    queryKey: ['clientErrors', errorTypeFilter],
    queryFn: async () => {
      let query = supabase
        .from('client_errors')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (errorTypeFilter && errorTypeFilter !== 'all') {
        query = query.eq('error_type', errorTypeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ClientError[];
    },
  });

  const { data: errorTypes } = useQuery({
    queryKey: ['clientErrorTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_errors')
        .select('error_type');
      if (error) throw error;
      const types = [...new Set(data.map(e => e.error_type))];
      return types;
    },
  });

  const filteredErrors = errors?.filter(error =>
    error.error_message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    error.page_path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('client_errors').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete error');
    } else {
      toast.success('Error deleted');
      refetch();
    }
  };

  const getErrorTypeBadgeVariant = (type: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (type) {
      case 'uncaught':
      case 'unhandledrejection':
        return 'destructive';
      case 'react':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Client Errors</h2>
          <p className="text-muted-foreground">Monitor and manage client-side errors</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search errors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={errorTypeFilter} onValueChange={setErrorTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {errorTypes?.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Errors (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {errors?.filter(e => 
                new Date(e.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Error Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorTypes?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Most Affected Page</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium truncate">
              {errors?.length ? 
                Object.entries(
                  errors.reduce((acc, e) => {
                    acc[e.page_path] = (acc[e.page_path] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
              : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Recent Errors
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading errors...</div>
          ) : filteredErrors?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No errors found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors?.map(error => (
                <Collapsible
                  key={error.id}
                  open={expandedIds.has(error.id)}
                  onOpenChange={() => toggleExpanded(error.id)}
                >
                  <div className="border rounded-lg p-4">
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 text-left">
                          {expandedIds.has(error.id) ? (
                            <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mt-1 text-muted-foreground" />
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={getErrorTypeBadgeVariant(error.error_type)}>
                                {error.error_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(error.created_at), 'MMM d, HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm font-medium line-clamp-1">
                              {error.error_message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Page: {error.page_path}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(error.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-4 ml-7 space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Session ID:</span>
                            <p className="font-mono text-xs">{error.session_id}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">User ID:</span>
                            <p className="font-mono text-xs">{error.user_id || 'Anonymous'}</p>
                          </div>
                        </div>
                        {error.metadata && (
                          <div>
                            <span className="text-sm text-muted-foreground">Browser Info:</span>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(error.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                        {error.stack_trace && (
                          <div>
                            <span className="text-sm text-muted-foreground">Stack Trace:</span>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto max-h-48">
                              {error.stack_trace}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
