import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Loader2, Home, Plus, Search, Eye, Clock,
  CheckCircle2, Building2, Edit, Trash2, Send, MoreHorizontal,
  AlertTriangle, MessageSquare, Heart, Download, X,
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAgentProperties, useDeleteProperty, useSubmitForReview, useBulkDeleteProperties, useBulkSubmitForReview } from '@/hooks/useAgentProperties';
import { STALE_THRESHOLD_DAYS } from '@/hooks/useAgentProfile';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { differenceInDays, parseISO, format } from 'date-fns';
import { cn } from '@/lib/utils';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  pending_review: { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600' },
  approved: { label: 'Active', color: 'bg-green-500/10 text-green-600' },
  changes_requested: { label: 'Changes', color: 'bg-orange-500/10 text-orange-600' },
  rejected: { label: 'Rejected', color: 'bg-red-500/10 text-red-600' },
};

function exportListingsToCSV(listings: any[], formatPrice: (price: number, currency: string) => string) {
  const headers = ['Title', 'City', 'Address', 'Status', 'Price', 'Currency', 'Views', 'Days on Market', 'Created At'];
  const rows = listings.map(l => [
    `"${(l.title || '').replace(/"/g, '""')}"`,
    l.city || '',
    `"${(l.address || '').replace(/"/g, '""')}"`,
    (l as any).verification_status || 'draft',
    l.price || 0,
    l.currency || 'ILS',
    l.views_count || 0,
    Math.floor((Date.now() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    format(new Date(l.created_at), 'yyyy-MM-dd'),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-listings-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AgentProperties() {
  const { data: properties = [], isLoading } = useAgentProperties();
  const deleteProperty = useDeleteProperty();
  const submitForReview = useSubmitForReview();
  const bulkDelete = useBulkDeleteProperties();
  const bulkSubmit = useBulkSubmitForReview();
  const formatPrice = useFormatPrice();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const cities = useMemo(() => [...new Set(properties.map(p => p.city).filter(Boolean))], [properties]);

  const filteredListings = useMemo(() => properties.filter(listing => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        listing.title?.toLowerCase().includes(query) ||
        listing.address?.toLowerCase().includes(query) ||
        listing.city?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    if (statusFilter !== 'all' && (listing as any).verification_status !== statusFilter) return false;
    if (cityFilter !== 'all' && listing.city !== cityFilter) return false;
    return true;
  }), [properties, searchQuery, statusFilter, cityFilter]);

  const stats = useMemo(() => ({
    total: properties.length,
    active: properties.filter(l => (l as any).verification_status === 'approved').length,
    pending: properties.filter(l => (l as any).verification_status === 'pending_review').length,
    totalViews: properties.reduce((sum, l) => sum + (l.views_count || 0), 0),
  }), [properties]);

  const getDaysOnMarket = (createdAt: string) =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));

  const isPropertyStale = (property: typeof properties[0]) => {
    if ((property as any).verification_status !== 'approved') return false;
    const renewedAt = (property as any).last_renewed_at || property.created_at;
    if (!renewedAt) return false;
    return differenceInDays(new Date(), parseISO(renewedAt)) >= STALE_THRESHOLD_DAYS;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredListings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredListings.map(l => l.id)));
    }
  };

  const allSelectedCanSubmit = useMemo(() => {
    if (selectedIds.size === 0) return false;
    return [...selectedIds].every(id => {
      const listing = properties.find(p => p.id === id);
      if (!listing) return false;
      const vs = (listing as any).verification_status;
      return vs === 'draft' || vs === 'changes_requested';
    });
  }, [selectedIds, properties]);

  const handleBulkDelete = () => {
    bulkDelete.mutate([...selectedIds], {
      onSuccess: () => {
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
      },
    });
  };

  const handleBulkSubmit = () => {
    bulkSubmit.mutate([...selectedIds], {
      onSuccess: () => setSelectedIds(new Set()),
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="rounded-xl">
                <Link to="/agent"><ArrowLeft className="h-4 w-4" /></Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">My Listings</h1>
                <p className="text-muted-foreground">Manage all your properties</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => exportListingsToCSV(filteredListings, formatPrice)}
                disabled={filteredListings.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button asChild className="rounded-xl">
                <Link to="/agent/properties/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Listing
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: stats.total, icon: Home },
              { label: 'Active', value: stats.active, icon: CheckCircle2 },
              { label: 'Pending Review', value: stats.pending, icon: Clock, highlight: stats.pending > 0 },
              { label: 'Total Views', value: stats.totalViews, icon: Eye },
            ].map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <Card className={cn('rounded-2xl border-primary/10', stat.highlight && 'bg-primary/5 border-primary/20')}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('p-2 rounded-xl', stat.highlight ? 'bg-primary/20' : 'bg-primary/10')}>
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
                  <SelectTrigger className="w-full sm:w-[140px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="approved">Active</SelectItem>
                    <SelectItem value="pending_review">Pending</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="changes_requested">Changes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-full sm:w-[140px] rounded-xl"><SelectValue placeholder="City" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
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
                    {properties.length === 0
                      ? "Create your first listing to get started"
                      : "Try adjusting your filters"}
                  </p>
                  {properties.length === 0 && (
                    <Button asChild className="mt-4 rounded-xl">
                      <Link to="/agent/properties/new">
                        <Plus className="h-4 w-4 mr-2" />Create Listing
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="md:hidden divide-y divide-border">
                    {filteredListings.map((listing) => {
                      const verificationStatus = (listing as any).verification_status as keyof typeof statusConfig;
                      const status = statusConfig[verificationStatus] || statusConfig.draft;
                      const isDraft = verificationStatus === 'draft';
                      const isChangesRequested = verificationStatus === 'changes_requested';
                      const isApproved = verificationStatus === 'approved';
                      const canSubmit = isDraft || isChangesRequested;
                      const stale = isPropertyStale(listing);

                      return (
                        <div key={listing.id} className="p-4 space-y-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedIds.has(listing.id)}
                              onCheckedChange={() => toggleSelect(listing.id)}
                              className="mt-1"
                            />
                            <div className="h-16 w-20 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              {listing.images?.[0] ? (
                                <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Home className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm line-clamp-1">{listing.title}</p>
                              <p className="text-xs text-muted-foreground">{listing.city}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <Badge variant="outline" className={cn('text-xs', status.color)}>
                                  {status.label}
                                </Badge>
                                {stale && isApproved && (
                                  <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Renewal
                                  </Badge>
                                )}
                              </div>
                              {isChangesRequested && (listing as any).rejection_reason && (
                                <p className="text-xs text-orange-600 mt-1 line-clamp-1">
                                  ⚠ {(listing as any).rejection_reason}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{formatPrice(listing.price, listing.currency)}</span>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" asChild className="rounded-lg h-8 w-8 p-0">
                                <Link to={`/agent/properties/${listing.id}/edit`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              {canSubmit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="rounded-lg h-8 w-8 p-0"
                                  onClick={() => submitForReview.mutate(listing.id)}
                                  disabled={submitForReview.isPending}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
                              {isApproved && (
                                <Button variant="ghost" size="sm" asChild className="rounded-lg h-8 w-8 p-0">
                                  <Link to={`/properties/${listing.id}`} target="_blank">
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuSeparator />
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{listing.title}"? This cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteProperty.mutate(listing.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={filteredListings.length > 0 && selectedIds.size === filteredListings.length}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-center">Views</TableHead>
                          <TableHead className="text-center">Saves</TableHead>
                          <TableHead className="text-center">Inquiries</TableHead>
                          <TableHead className="text-center">Days</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredListings.map((listing) => {
                          const verificationStatus = (listing as any).verification_status as keyof typeof statusConfig;
                          const status = statusConfig[verificationStatus] || statusConfig.draft;
                          const isDraft = verificationStatus === 'draft';
                          const isChangesRequested = verificationStatus === 'changes_requested';
                          const isApproved = verificationStatus === 'approved';
                          const canSubmit = isDraft || isChangesRequested;
                          const stale = isPropertyStale(listing);

                          return (
                            <TableRow key={listing.id} className={cn('hover:bg-muted/30', selectedIds.has(listing.id) && 'bg-primary/5')}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedIds.has(listing.id)}
                                  onCheckedChange={() => toggleSelect(listing.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                                    {listing.images?.[0] ? (
                                      <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center">
                                        <Home className="h-4 w-4 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-medium truncate max-w-[200px]">{listing.title}</p>
                                    <p className="text-xs text-muted-foreground">{listing.city}</p>
                                    {isChangesRequested && (listing as any).rejection_reason && (
                                      <p className="text-xs text-orange-600 truncate max-w-[200px]">
                                        ⚠ {(listing as any).rejection_reason}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className={cn('text-xs w-fit', status.color)}>
                                    {status.label}
                                  </Badge>
                                  {stale && isApproved && (
                                    <Badge variant="outline" className="text-xs w-fit bg-amber-50 text-amber-700 border-amber-200 gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Renewal Due
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatPrice(listing.price, listing.currency)}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm text-muted-foreground">{listing.views_count || 0}</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm text-muted-foreground">—</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm text-muted-foreground">—</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm text-muted-foreground">{getDaysOnMarket(listing.created_at)}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="sm" asChild className="rounded-lg">
                                    <Link to={`/agent/properties/${listing.id}/edit`}>
                                      <Edit className="h-4 w-4" />
                                    </Link>
                                  </Button>
                                  {canSubmit && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="rounded-lg"
                                      onClick={() => submitForReview.mutate(listing.id)}
                                      disabled={submitForReview.isPending}
                                      title="Submit for Review"
                                    >
                                      <Send className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {isApproved && (
                                    <Button variant="ghost" size="sm" asChild className="rounded-lg">
                                      <Link to={`/properties/${listing.id}`} target="_blank">
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="rounded-lg">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete "{listing.title}"? This cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => deleteProperty.mutate(listing.id)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="rounded-2xl border-primary/20 shadow-lg bg-background/95 backdrop-blur-sm">
              <CardContent className="p-3 flex items-center gap-3 flex-wrap justify-center">
                <span className="text-sm font-medium whitespace-nowrap">
                  {selectedIds.size} selected
                </span>
                {allSelectedCanSubmit && (
                  <Button
                    size="sm"
                    className="rounded-xl"
                    onClick={handleBulkSubmit}
                    disabled={bulkSubmit.isPending}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Submit for Review
                  </Button>
                )}
                <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="rounded-xl">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {selectedIds.size} Listing(s)</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedIds.size} listing(s)? This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBulkDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={bulkDelete.isPending}
                      >
                        Delete All
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setSelectedIds(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
