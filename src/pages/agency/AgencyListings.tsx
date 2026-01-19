import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, Loader2, Home, Plus, Search, Filter,
  Eye, MessageSquare, Clock, CheckCircle2, XCircle, Building2
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useMyAgency, useAgencyTeam } from '@/hooks/useAgencyManagement';
import { useAgencyListingsManagement } from '@/hooks/useAgencyListings';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  pending_review: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600' },
  approved: { label: 'Active', color: 'bg-green-500/10 text-green-600' },
  changes_requested: { label: 'Changes', color: 'bg-orange-500/10 text-orange-600' },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-600' },
};

export default function AgencyListings() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: listings = [], isLoading: listingsLoading } = useAgencyListingsManagement(agency?.id);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  if (agencyLoading || listingsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <p className="text-muted-foreground mb-6">You need to have an agency to view listings.</p>
          <Button asChild>
            <Link to="/agency/register">Register Agency</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Get unique cities from listings
  const cities = [...new Set(listings.map(l => l.city).filter(Boolean))];

  // Filter listings
  const filteredListings = listings.filter(listing => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        listing.title?.toLowerCase().includes(query) ||
        listing.address?.toLowerCase().includes(query) ||
        listing.city?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'all' && listing.verification_status !== statusFilter) return false;
    if (agentFilter !== 'all' && listing.agent_id !== agentFilter) return false;
    if (cityFilter !== 'all' && listing.city !== cityFilter) return false;

    return true;
  });

  // Stats
  const stats = {
    total: listings.length,
    active: listings.filter(l => l.verification_status === 'approved').length,
    pending: listings.filter(l => l.verification_status === 'pending_review').length,
    totalViews: listings.reduce((sum, l) => sum + (l.views_count || 0), 0),
  };

  const formatPrice = (price: number, currency: string = 'ILS') => {
    if (currency === 'USD') {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `₪${(price / 1000000).toFixed(2)}M`;
  };

  const getAgentName = (agentId: string) => {
    const agent = team.find(a => a.id === agentId);
    return agent?.name || 'Unknown';
  };

  const getDaysOnMarket = (createdAt: string) => {
    const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="rounded-xl">
                <Link to="/agency">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Agency Listings</h1>
                <p className="text-muted-foreground">Manage all properties across your team</p>
              </div>
            </div>
            <Button asChild className="rounded-xl">
              <Link to="/agent/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Listing
              </Link>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: stats.total, icon: Home },
              { label: 'Active', value: stats.active, icon: CheckCircle2 },
              { label: 'Pending Review', value: stats.pending, icon: Clock, highlight: stats.pending > 0 },
              { label: 'Total Views', value: stats.totalViews, icon: Eye },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "rounded-2xl border-primary/10",
                  stat.highlight && "bg-primary/5 border-primary/20"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        stat.highlight ? "bg-primary/20" : "bg-primary/10"
                      )}>
                        <stat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <Card className="rounded-2xl border-primary/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Active</SelectItem>
                    <SelectItem value="pending_review">Pending</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="changes_requested">Changes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-[160px] rounded-xl">
                    <SelectValue placeholder="Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {team.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Listings Table */}
          <Card className="rounded-2xl border-primary/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Listings ({filteredListings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredListings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No listings found</p>
                  <p className="text-sm">
                    {listings.length === 0 
                      ? "Your team hasn't added any listings yet"
                      : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Views</TableHead>
                        <TableHead className="text-center">Days</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredListings.map((listing) => {
                        const status = statusConfig[listing.verification_status as keyof typeof statusConfig] || statusConfig.draft;
                        
                        return (
                          <TableRow key={listing.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-12 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                  {listing.images?.[0] ? (
                                    <img 
                                      src={listing.images[0]} 
                                      alt={listing.title}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Home className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate max-w-[200px]">{listing.title}</p>
                                  <p className="text-xs text-muted-foreground">{listing.city}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{getAgentName(listing.agent_id)}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-xs", status.color)}>
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(listing.price, listing.currency)}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">
                                {listing.views_count || 0}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm text-muted-foreground">
                                {getDaysOnMarket(listing.created_at)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                asChild
                                className="rounded-lg"
                              >
                                <Link to={`/property/${listing.id}`}>
                                  View
                                </Link>
                              </Button>
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
        </motion.div>
      </div>
    </Layout>
  );
}
