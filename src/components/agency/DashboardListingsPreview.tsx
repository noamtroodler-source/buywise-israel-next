import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, ExternalLink, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAgencyListingsManagement, AgencyListing } from '@/hooks/useAgencyListings';
import { useAgencyTeam } from '@/hooks/useAgencyManagement';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'Approved', variant: 'default' },
  pending: { label: 'Pending', variant: 'secondary' },
  draft: { label: 'Draft', variant: 'outline' },
  changes_requested: { label: 'Changes', variant: 'destructive' },
  rejected: { label: 'Rejected', variant: 'destructive' },
};

interface Props {
  agencyId: string;
}

export function DashboardListingsPreview({ agencyId }: Props) {
  const { data: listings = [], isLoading } = useAgencyListingsManagement(agencyId);
  const { data: team = [] } = useAgencyTeam(agencyId);
  const [search, setSearch] = useState('');

  const agentMap = useMemo(() => new Map(team.map(a => [a.id, a.name])), [team]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const results = q
      ? listings.filter(l =>
          l.title?.toLowerCase().includes(q) ||
          l.address?.toLowerCase().includes(q) ||
          (l.agent_id && agentMap.get(l.agent_id)?.toLowerCase().includes(q))
        )
      : listings;
    return results.slice(0, 5);
  }, [listings, search, agentMap]);

  return (
    <Card className="rounded-2xl border-border/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Recent Listings
          </CardTitle>
          <Link to="/agency/listings" className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Input
          placeholder="Search by title, address, or agent..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-8 text-sm rounded-xl mb-3"
        />
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {search ? 'No matching listings' : 'No listings yet'}
          </p>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-xs">Title</TableHead>
                  <TableHead className="h-8 text-xs">Agent</TableHead>
                  <TableHead className="h-8 text-xs">Status</TableHead>
                  <TableHead className="h-8 text-xs text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(listing => {
                  const status = statusConfig[listing.verification_status] || { label: listing.verification_status, variant: 'outline' as const };
                  return (
                    <TableRow key={listing.id} className="text-xs">
                      <TableCell className="py-2 font-medium truncate max-w-[140px]">
                        {listing.title || 'Untitled'}
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground truncate max-w-[100px]">
                        {(listing.agent_id && agentMap.get(listing.agent_id)) || '—'}
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <span className="flex items-center justify-end gap-1 text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {listing.views_count || 0}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
