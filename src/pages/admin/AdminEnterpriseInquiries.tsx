import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Search, ChevronDown, ChevronRight, Paperclip, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_OPTIONS = ['all', 'new', 'contacted', 'closed'] as const;

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  closed: 'bg-muted text-muted-foreground',
};

export default function AdminEnterpriseInquiries() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['enterprise-inquiries', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('enterprise_inquiries' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('enterprise_inquiries' as any)
        .update({ status } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-inquiries'] });
      // No toast - badge updates inline
    },
    onError: (err: any) => toast.error(err.message),
  });

  const saveNotes = useMutation({
    mutationFn: async ({ id, admin_notes }: { id: string; admin_notes: string }) => {
      const { error } = await supabase
        .from('enterprise_inquiries' as any)
        .update({ admin_notes } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprise-inquiries'] });
      toast.success('Notes saved');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = inquiries.filter((i: any) =>
    !search ||
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.email?.toLowerCase().includes(search.toLowerCase()) ||
    i.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNotesBlur = (inq: any) => {
    const draft = notesDraft[inq.id];
    if (draft !== undefined && draft !== (inq.admin_notes ?? '')) {
      saveNotes.mutate({ id: inq.id, admin_notes: draft });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Enterprise Inquiries</h2>
          <p className="text-sm text-muted-foreground">{inquiries.length} total inquiries</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No inquiries found</TableCell></TableRow>
            ) : (
              filtered.map((inq: any) => (
                <>
                  <TableRow
                    key={inq.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setExpandedId(expandedId === inq.id ? null : inq.id)}
                  >
                    <TableCell className="pr-0">
                      {expandedId === inq.id
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {inq.name}
                        {inq.message && <Paperclip className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                        {inq.phone && <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell>{inq.email}</TableCell>
                    <TableCell>{inq.company_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{inq.entity_type}</Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={inq.status}
                        onValueChange={(val) => updateStatus.mutate({ id: inq.id, status: val })}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <Badge className={statusColors[inq.status] || ''} variant="secondary">
                            {inq.status}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(inq.created_at), 'MMM d, yyyy')}
                    </TableCell>
                  </TableRow>
                  {expandedId === inq.id && (
                    <TableRow key={`${inq.id}-expanded`} className="bg-muted/30">
                      <TableCell colSpan={7} className="py-4 px-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Contact details */}
                          <div className="space-y-2">
                            {inq.phone && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Phone</p>
                                <p className="text-sm">{inq.phone}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Prospect's Message</p>
                              {inq.message ? (
                                <p className="text-sm whitespace-pre-wrap border-l-2 border-primary/30 pl-3">{inq.message}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground italic">No message provided</p>
                              )}
                            </div>
                          </div>

                          {/* Admin notes */}
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Admin Notes</p>
                            <Textarea
                              placeholder="Add internal notes (auto-saves on blur)..."
                              rows={4}
                              className="text-sm resize-none"
                              value={notesDraft[inq.id] ?? (inq.admin_notes ?? '')}
                              onChange={(e) => setNotesDraft(prev => ({ ...prev, [inq.id]: e.target.value }))}
                              onBlur={() => handleNotesBlur(inq)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
