import { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Eye, Loader2, Clock, CheckCircle, AlertCircle, 
  XCircle, FileText, Send, Copy, MoreHorizontal, Home, Key, 
  RefreshCw, Archive, CheckSquare, Square, X, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgentProperties, useDeleteProperty, useSubmitForReview } from '@/hooks/useAgentProperties';
import { useDuplicateProperty, useUpdatePropertyStatus, useRenewProperty, STALE_THRESHOLD_DAYS } from '@/hooks/useAgentProfile';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';

type VerificationStatus = 'draft' | 'pending_review' | 'approved' | 'changes_requested' | 'rejected';

const getVerificationBadge = (status: VerificationStatus | undefined) => {
  switch (status) {
    case 'draft':
      return { label: 'Draft', icon: FileText, className: 'bg-muted text-muted-foreground' };
    case 'pending_review':
      return { label: 'Pending Review', icon: Clock, className: 'bg-primary/10 text-primary' };
    case 'approved':
      return { label: 'Approved', icon: CheckCircle, className: 'bg-primary/10 text-primary' };
    case 'changes_requested':
      return { label: 'Changes Requested', icon: AlertCircle, className: 'bg-orange-100 text-orange-700' };
    case 'rejected':
      return { label: 'Rejected', icon: XCircle, className: 'bg-muted text-muted-foreground' };
    default:
      return { label: 'Unknown', icon: FileText, className: 'bg-muted text-muted-foreground' };
  }
};

export default function AgentProperties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const { data: properties = [], isLoading } = useAgentProperties();
  const deleteProperty = useDeleteProperty();
  const submitForReview = useSubmitForReview();
  const duplicateProperty = useDuplicateProperty();
  const updateStatus = useUpdatePropertyStatus();
  const renewProperty = useRenewProperty();

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'for_sale': return 'For Sale';
      case 'for_rent': return 'For Rent';
      case 'sold': return 'Sold';
      case 'rented': return 'Rented';
      default: return status;
    }
  };

  const handleDuplicate = (propertyId: string) => {
    duplicateProperty.mutate(propertyId, {
      onSuccess: (result) => {
        navigate(`/agent/properties/${result.newPropertyId}/edit`);
      },
    });
  };

  const handleMarkAsSold = (propertyId: string) => {
    updateStatus.mutate({ id: propertyId, listing_status: 'sold' });
  };

  const handleMarkAsRented = (propertyId: string) => {
    updateStatus.mutate({ id: propertyId, listing_status: 'rented' });
  };

  // Bulk action handlers
  const handleSelectAll = (currentProperties: typeof properties) => {
    if (selectedIds.size === currentProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentProperties.map(p => p.id)));
    }
  };

  const handleToggleSelect = (propertyId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(propertyId)) {
      newSelected.delete(propertyId);
    } else {
      newSelected.add(propertyId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkRenew = async () => {
    const selectedArray = Array.from(selectedIds);
    let successCount = 0;
    let failedCount = 0;
    
    for (const id of selectedArray) {
      try {
        await renewProperty.mutateAsync(id);
        successCount++;
      } catch (error) {
        failedCount++;
        console.error(`Failed to renew property ${id}:`, error);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Renewed ${successCount} listing${successCount !== 1 ? 's' : ''}`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to renew ${failedCount} listing${failedCount !== 1 ? 's' : ''}`);
    }
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    const selectedArray = Array.from(selectedIds);
    let successCount = 0;
    let failedCount = 0;
    
    for (const id of selectedArray) {
      try {
        await deleteProperty.mutateAsync(id);
        successCount++;
      } catch (error) {
        failedCount++;
        console.error(`Failed to delete property ${id}:`, error);
      }
    }
    
    if (successCount > 0) {
      toast.success(`Deleted ${successCount} listing${successCount !== 1 ? 's' : ''}`);
    }
    if (failedCount > 0) {
      toast.error(`Failed to delete ${failedCount} listing${failedCount !== 1 ? 's' : ''}`);
    }
    setSelectedIds(new Set());
    setIsBulkDeleting(false);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Helper to check if a property is stale
  const isPropertyStale = (property: typeof properties[0]) => {
    if ((property as any).verification_status !== 'approved') return false;
    const renewedAt = (property as any).last_renewed_at || property.created_at;
    if (!renewedAt) return false;
    const daysSinceRenewal = differenceInDays(new Date(), parseISO(renewedAt));
    return daysSinceRenewal >= STALE_THRESHOLD_DAYS;
  };

  // Filter properties by verification status
  const filterByStatus = (status: VerificationStatus | 'all' | 'stale') => {
    if (status === 'all') return properties;
    if (status === 'stale') return properties.filter(p => isPropertyStale(p));
    return properties.filter(p => (p as any).verification_status === status);
  };

  const statusCounts = {
    all: properties.length,
    draft: filterByStatus('draft').length,
    pending_review: filterByStatus('pending_review').length,
    changes_requested: filterByStatus('changes_requested').length,
    approved: filterByStatus('approved').length,
    stale: filterByStatus('stale').length,
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

  const PropertyRow = ({ property, showStaleWarning = false }: { property: typeof properties[0]; showStaleWarning?: boolean }) => {
    const status = (property as any).verification_status as VerificationStatus;
    const badge = getVerificationBadge(status);
    const BadgeIcon = badge.icon;
    const adminNotes = (property as any).admin_notes;
    const isSelected = selectedIds.has(property.id);
    const isStale = isPropertyStale(property);

    return (
      <div
        className={`flex flex-col gap-3 p-4 rounded-lg border transition-colors ${
          isSelected ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Checkbox for bulk selection */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => handleToggleSelect(property.id)}
              className="flex-shrink-0"
            />
            
            <img
              src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
              alt={property.title}
              className="h-16 w-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-semibold line-clamp-1">{property.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{property.address}, {property.city}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="outline">{getStatusLabel(property.listing_status)}</Badge>
                <span className="text-sm font-medium">
                  ₪{property.price.toLocaleString()}
                </span>
                <Badge className={`${badge.className} gap-1`}>
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                </Badge>
                {(showStaleWarning || isStale) && status === 'approved' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Needs Renewal
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {status === 'draft' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => submitForReview.mutate(property.id)}
                disabled={submitForReview.isPending}
              >
                <Send className="h-4 w-4 mr-1" />
                Submit
              </Button>
            )}

            <Button variant="ghost" size="sm" asChild>
              <Link to={`/agent/properties/${property.id}/edit`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>

            {status === 'approved' && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/properties/${property.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Link>
              </Button>
            )}

            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDuplicate(property.id)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Listing
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => renewProperty.mutate(property.id)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renew Listing
                </DropdownMenuItem>
                
                {status === 'approved' && property.listing_status === 'for_sale' && (
                  <DropdownMenuItem onClick={() => handleMarkAsSold(property.id)}>
                    <Home className="h-4 w-4 mr-2" />
                    Mark as Sold
                  </DropdownMenuItem>
                )}
                
                {status === 'approved' && property.listing_status === 'for_rent' && (
                  <DropdownMenuItem onClick={() => handleMarkAsRented(property.id)}>
                    <Key className="h-4 w-4 mr-2" />
                    Mark as Rented
                  </DropdownMenuItem>
                )}
                
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
                      <AlertDialogTitle>Delete Property</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{property.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProperty.mutate(property.id)}
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

        {/* Admin feedback for changes requested */}
        {status === 'changes_requested' && adminNotes && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-sm ml-10">
            <p className="font-medium text-orange-800 mb-1">Admin Feedback:</p>
            <p className="text-orange-700">{adminNotes}</p>
          </div>
        )}
      </div>
    );
  };

  // Bulk action bar component
  const BulkActionBar = ({ currentProperties }: { currentProperties: typeof properties }) => {
    const allSelected = currentProperties.length > 0 && selectedIds.size === currentProperties.length;
    const someSelected = selectedIds.size > 0;

    return (
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="shadow-lg border-primary/20">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectedIds.size} selected
                  </span>
                </div>
                
                <div className="h-6 w-px bg-border" />
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkRenew}
                    disabled={renewProperty.isPending}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Renew All
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.size} Properties</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedIds.size} properties? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBulkDelete}
                          disabled={isBulkDeleting}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isBulkDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Delete All'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/5 mb-4 -ml-2">
            <Link to="/agent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">My Properties</h1>
            <Button asChild>
              <Link to="/agent/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Link>
            </Button>
          </div>

          {properties.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground mb-4">You haven't added any properties yet</p>
                <Button asChild>
                  <Link to="/agent/properties/new">Add Your First Property</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={initialTab} onValueChange={() => setSelectedIds(new Set())}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                <TabsTrigger value="draft">Drafts ({statusCounts.draft})</TabsTrigger>
                <TabsTrigger value="pending_review">Pending ({statusCounts.pending_review})</TabsTrigger>
                <TabsTrigger value="changes_requested">
                  Changes ({statusCounts.changes_requested})
                </TabsTrigger>
                <TabsTrigger value="approved">Live ({statusCounts.approved})</TabsTrigger>
                {statusCounts.stale > 0 && (
                  <TabsTrigger value="stale" className="text-amber-700 data-[state=active]:bg-amber-100">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Needs Renewal ({statusCounts.stale})
                  </TabsTrigger>
                )}
              </TabsList>

              {(['all', 'draft', 'pending_review', 'changes_requested', 'approved', 'stale'] as const).map((tab) => {
                const filteredProperties = filterByStatus(tab);
                return (
                  <TabsContent key={tab} value={tab}>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{filteredProperties.length} Properties</CardTitle>
                          {filteredProperties.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSelectAll(filteredProperties)}
                              className="text-muted-foreground"
                            >
                              {selectedIds.size === filteredProperties.length ? (
                                <>
                                  <CheckSquare className="h-4 w-4 mr-1" />
                                  Deselect All
                                </>
                              ) : (
                                <>
                                  <Square className="h-4 w-4 mr-1" />
                                  Select All
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {filteredProperties.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No properties in this category</p>
                        ) : (
                          <div className="space-y-4">
                            {filteredProperties.map((property) => (
                              <PropertyRow 
                                key={property.id} 
                                property={property} 
                                showStaleWarning={tab === 'stale'}
                              />
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <BulkActionBar currentProperties={filteredProperties} />
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
