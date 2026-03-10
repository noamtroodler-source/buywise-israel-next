import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye, Loader2, Clock, CheckCircle, AlertCircle,
  XCircle, FileText, Home, AlertTriangle, ArrowLeft, Building2, Plus,
  Pencil, Trash2, Send
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAgentProperties, useDeleteProperty, useSubmitForReview } from '@/hooks/useAgentProperties';
import { STALE_THRESHOLD_DAYS } from '@/hooks/useAgentProfile';
import { differenceInDays, parseISO } from 'date-fns';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

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
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'all';
  const { data: properties = [], isLoading } = useAgentProperties();
  const deleteProperty = useDeleteProperty();
  const submitForReview = useSubmitForReview();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'for_sale': return 'For Sale';
      case 'for_rent': return 'For Rent';
      case 'sold': return 'Sold';
      case 'rented': return 'Rented';
      default: return status;
    }
  };

  const isPropertyStale = (property: typeof properties[0]) => {
    if ((property as any).verification_status !== 'approved') return false;
    const renewedAt = (property as any).last_renewed_at || property.created_at;
    if (!renewedAt) return false;
    const daysSinceRenewal = differenceInDays(new Date(), parseISO(renewedAt));
    return daysSinceRenewal >= STALE_THRESHOLD_DAYS;
  };

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
    const isStale = isPropertyStale(property);
    const canEdit = status === 'draft' || status === 'changes_requested';
    const canSubmit = status === 'draft' || status === 'changes_requested';

    return (
      <div className="flex flex-col gap-3 p-4 rounded-lg border border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
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
                <span className="text-sm font-medium">₪{property.price.toLocaleString()}</span>
                <Badge className={`${badge.className} gap-1`}>
                  <BadgeIcon className="h-3 w-3" />
                  {badge.label}
                </Badge>
                {(showStaleWarning || isStale) && status === 'approved' && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Renewal Due
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
              <Eye className="h-3 w-3" />
              {property.views_count || 0} views
            </div>

            {canSubmit && (
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

            {canEdit && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/agent/properties/${property.id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Link>
              </Button>
            )}

            {status === 'approved' && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/properties/${property.id}`} target="_blank">
                  <Eye className="h-4 w-4 mr-1" />
                  View Live
                </Link>
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete listing?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{property.title}". This action cannot be undone.
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
          </div>
        </div>

        {/* Show rejection reason inline */}
        {status === 'changes_requested' && (property as any).rejection_reason && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
            <span className="font-medium">Changes requested:</span> {(property as any).rejection_reason}
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/5 mb-4 -ml-2">
            <Link to="/agent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">My Listings</h1>
            </div>
            <Button asChild>
              <Link to="/agent/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                New Listing
              </Link>
            </Button>
          </div>

          {properties.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Home className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
                <p className="text-muted-foreground font-medium">No listings yet</p>
                <p className="text-sm text-muted-foreground mt-1">Create your first listing to get started.</p>
                <Button asChild className="mt-4">
                  <Link to="/agent/properties/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Listing
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue={initialTab}>
              <TabsList className="mb-4 flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All ({statusCounts.all})</TabsTrigger>
                <TabsTrigger value="draft">Drafts ({statusCounts.draft})</TabsTrigger>
                <TabsTrigger value="pending_review">Pending ({statusCounts.pending_review})</TabsTrigger>
                <TabsTrigger value="changes_requested">Changes ({statusCounts.changes_requested})</TabsTrigger>
                <TabsTrigger value="approved">Live ({statusCounts.approved})</TabsTrigger>
                {statusCounts.stale > 0 && (
                  <TabsTrigger value="stale" className="text-amber-700 data-[state=active]:bg-amber-100">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Renewal Due ({statusCounts.stale})
                  </TabsTrigger>
                )}
              </TabsList>

              {(['all', 'draft', 'pending_review', 'changes_requested', 'approved', 'stale'] as const).map((tab) => {
                const filteredProperties = filterByStatus(tab);
                return (
                  <TabsContent key={tab} value={tab}>
                    <Card>
                      <CardHeader>
                        <CardTitle>{filteredProperties.length} Listing{filteredProperties.length !== 1 ? 's' : ''}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {filteredProperties.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">No listings in this category</p>
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
