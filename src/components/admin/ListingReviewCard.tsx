import { useState } from 'react';
import { 
  Check, X, MessageSquare, Eye, MapPin, Bed, Bath, 
  Ruler, User, Building2, ChevronDown, ChevronUp, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { PropertyForReview } from '@/hooks/useListingReview';
import { formatDistanceToNow } from 'date-fns';
import { PropertyPreviewModal } from './PropertyPreviewModal';

interface ListingReviewCardProps {
  property: PropertyForReview;
  onApprove: (id: string, notes?: string, agentId?: string, propertyTitle?: string, featureThis?: boolean) => void;
  onRequestChanges: (id: string, reason: string, notes?: string, agentId?: string, propertyTitle?: string) => void;
  onReject: (id: string, reason: string, notes?: string, agentId?: string, propertyTitle?: string) => void;
  isLoading?: boolean;
}

export function ListingReviewCard({ 
  property, 
  onApprove, 
  onRequestChanges, 
  onReject,
  isLoading 
}: ListingReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [featureThis, setFeatureThis] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleApprove = () => {
    onApprove(property.id, adminNotes || undefined, property.agent?.id, property.title, featureThis);
  };

  const handleRequestChanges = () => {
    if (!reason.trim()) return;
    onRequestChanges(property.id, reason, adminNotes || undefined, property.agent?.id, property.title);
    setShowChangesDialog(false);
    setReason('');
    setAdminNotes('');
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(property.id, reason, adminNotes || undefined, property.agent?.id, property.title);
    setShowRejectDialog(false);
    setReason('');
    setAdminNotes('');
  };

  const getStatusBadge = () => {
    const statusStyles = {
      draft: 'bg-muted text-muted-foreground',
      pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      changes_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      approved: 'bg-primary/10 text-primary',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    const statusLabels = {
      draft: 'Draft',
      pending_review: 'Pending Review',
      changes_requested: 'Changes Requested',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    return (
      <Badge className={statusStyles[property.verification_status]}>
        {statusLabels[property.verification_status]}
      </Badge>
    );
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-48 h-48 lg:h-auto flex-shrink-0">
              <img
                src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge()}
                    {property.submitted_at && (
                      <span className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(property.submitted_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{property.city}{property.neighborhood && `, ${property.neighborhood}`}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatPrice(property.price)}</p>
                  <p className="text-xs text-muted-foreground capitalize">{property.property_type.replace('_', ' ')}</p>
                </div>
              </div>

              {/* Property Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                {property.bedrooms && (
                  <span className="flex items-center gap-1">
                    <Bed className="h-4 w-4" />
                    {property.bedrooms} beds
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-4 w-4" />
                    {property.bathrooms} baths
                  </span>
                )}
                {property.size_sqm && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    {property.size_sqm} sqm
                  </span>
                )}
              </div>

              {/* Agent Info */}
              {property.agent && (
                <div className="flex items-center gap-2 text-sm mb-3 pb-3 border-b">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{property.agent.name}</span>
                  {property.agent.agency_name && (
                    <>
                      <Building2 className="h-4 w-4 text-muted-foreground ml-2" />
                      <span className="text-muted-foreground">{property.agent.agency_name}</span>
                    </>
                  )}
                  {property.agent.is_verified && (
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  )}
                </div>
              )}

              {/* Expandable Details */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mb-2">
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show More Details
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-3 pt-2 border-t">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Address</h4>
                      <p className="text-sm text-muted-foreground">{property.address}</p>
                    </div>
                    {property.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground line-clamp-4">{property.description}</p>
                      </div>
                    )}
                    {property.images && property.images.length > 1 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">All Photos ({property.images.length})</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {property.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Photo ${i + 1}`}
                              className="h-20 w-20 object-cover rounded flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {property.rejection_reason && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-400 mb-1">
                          Previous Feedback
                        </h4>
                        <p className="text-sm text-orange-700 dark:text-orange-300">{property.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t mt-3">
                <Button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                
                {/* Feature checkbox - only show for pending listings */}
                {property.verification_status === 'pending_review' && (
                  <label className="flex items-center gap-2 text-sm cursor-pointer px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <Checkbox 
                      checked={featureThis} 
                      onCheckedChange={(checked) => setFeatureThis(checked === true)}
                    />
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-muted-foreground">Feature this</span>
                  </label>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => setShowChangesDialog(true)}
                  disabled={isLoading}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Request Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isLoading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setShowPreviewModal(true)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Changes Dialog */}
      <Dialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Explain what changes the agent needs to make before this listing can be approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Feedback for Agent *</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Please add more photos, price seems incorrect, description needs more detail..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Internal Notes (optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes only visible to admins..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangesDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRequestChanges}
              disabled={!reason.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Send Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Listing</DialogTitle>
            <DialogDescription>
              This listing will be rejected. The agent will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Duplicate listing, inappropriate content, suspicious pricing..."
                className="mt-1"
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Internal Notes (optional)</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Notes only visible to admins..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleReject}
              disabled={!reason.trim()}
              variant="destructive"
            >
              Reject Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <PropertyPreviewModal 
        property={property} 
        open={showPreviewModal} 
        onOpenChange={setShowPreviewModal} 
      />
    </>
  );
}
