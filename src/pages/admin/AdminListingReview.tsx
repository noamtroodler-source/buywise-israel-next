import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ClipboardCheck, FileText, AlertCircle, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListingReviewCard } from '@/components/admin/ListingReviewCard';
import {
  useListingsForReview,
  useReviewStats,
  useApproveListing,
  useRequestChanges,
  useRejectListing,
  VerificationStatus,
} from '@/hooks/useListingReview';
import { useAddFeaturedProperty } from '@/hooks/useHomepageFeatured';
import { toast } from 'sonner';

export default function AdminListingReview() {
  const [activeTab, setActiveTab] = useState<VerificationStatus | 'all'>('pending_review');
  
  const { data: stats, isLoading: statsLoading } = useReviewStats();
  const { data: listings = [], isLoading: listingsLoading } = useListingsForReview(
    activeTab === 'all' ? undefined : activeTab
  );

  const approveListing = useApproveListing();
  const requestChanges = useRequestChanges();
  const rejectListing = useRejectListing();
  const addFeaturedProperty = useAddFeaturedProperty();

  const isLoading = statsLoading || listingsLoading;
  const isMutating = approveListing.isPending || requestChanges.isPending || rejectListing.isPending;

  const handleApprove = (id: string, notes?: string, agentId?: string, propertyTitle?: string, featureThis?: boolean) => {
    const property = listings.find(p => p.id === id);
    
    approveListing.mutate(
      { id, adminNotes: notes, agentId, propertyTitle },
      {
        onSuccess: () => {
          if (featureThis && property) {
            const slotType = property.listing_status === 'for_sale' ? 'property_sale' : 'property_rent';
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Default 7 days
            
            addFeaturedProperty.mutate(
              { propertyId: id, slotType, expiresAt },
              {
                onSuccess: () => {
                  toast.success('Property featured on homepage!');
                },
              }
            );
          }
        }
      }
    );
  };

  const handleRequestChanges = (id: string, reason: string, notes?: string) => {
    requestChanges.mutate({ id, reason, adminNotes: notes });
  };

  const handleReject = (id: string, reason: string, notes?: string) => {
    rejectListing.mutate({ id, reason, adminNotes: notes });
  };

  const statCards = [
    { 
      key: 'pending_review', 
      label: 'Pending Review', 
      icon: ClipboardCheck, 
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    { 
      key: 'changes_requested', 
      label: 'Changes Requested', 
      icon: AlertCircle, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
    { 
      key: 'approved', 
      label: 'Approved', 
      icon: CheckCircle, 
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    { 
      key: 'rejected', 
      label: 'Rejected', 
      icon: XCircle, 
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
    { 
      key: 'draft', 
      label: 'Drafts', 
      icon: FileText, 
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Listing Review Queue</h2>
          <p className="text-muted-foreground">
            Review and approve property listings before they go live
          </p>
        </div>
        {stats?.pending_review && stats.pending_review > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-base px-3 py-1">
            {stats.pending_review} awaiting review
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setActiveTab(stat.key as VerificationStatus)}
            className="cursor-pointer"
          >
            <Card className={`${activeTab === stat.key ? 'ring-2 ring-primary' : ''} transition-all`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {statsLoading ? '-' : stats?.[stat.key as keyof typeof stats] || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Listings Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as VerificationStatus | 'all')}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending_review" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Pending
            {stats?.pending_review ? (
              <Badge variant="secondary" className="ml-1">{stats.pending_review}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="changes_requested" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Changes Requested
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Filter className="h-4 w-4" />
            All
          </TabsTrigger>
        </TabsList>

        {/* Listings Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : listings.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-1">No listings to review</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'pending_review' 
                    ? "Great job! You've reviewed all pending listings."
                    : `No listings with status "${activeTab.replace('_', ' ')}"`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            listings.map((property) => (
              <motion.div
                key={property.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ListingReviewCard
                  property={property}
                  onApprove={handleApprove}
                  onRequestChanges={handleRequestChanges}
                  onReject={handleReject}
                  isLoading={isMutating}
                />
              </motion.div>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}
