import { useState } from 'react';
import { 
  Check, X, MessageSquare, Eye, MapPin, Home, 
  Building2, ChevronDown, ChevronUp, Calendar, Clock, FileImage, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { AdminProject, ProjectVerificationStatus, useAdminProjectUnits } from '@/hooks/useAdminProjects';
import { formatDistanceToNow, format } from 'date-fns';
import { ProjectPreviewModal } from './ProjectPreviewModal';
import { CategorizedAmenities } from './CategorizedAmenities';
import { UnitTypesPreview } from './UnitTypesPreview';

interface ProjectReviewCardProps {
  project: AdminProject;
  onApprove: (id: string, notes?: string) => void;
  onRequestChanges: (id: string, feedback: string) => void;
  onReject: (id: string, reason: string) => void;
  isLoading?: boolean;
}

const statusConfig: Record<ProjectVerificationStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  pending_review: { label: 'Pending Review', className: 'bg-primary/10 text-primary' },
  changes_requested: { label: 'Changes Requested', className: 'bg-primary/10 text-primary' },
  approved: { label: 'Approved', className: 'bg-primary/10 text-primary' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive' },
};

const constructionStatusLabels: Record<string, string> = {
  planning: 'Planning Phase',
  pre_sale: 'Pre-Sale',
  foundation: 'Foundation',
  structure: 'Structure',
  finishing: 'Finishing',
  delivery: 'Delivery',
};

const amenityLabels: Record<string, string> = {
  lobby: 'Grand Lobby',
  concierge: '24/7 Concierge',
  security: 'Security',
  gym: 'Fitness Center',
  pool: 'Swimming Pool',
  spa: 'Spa & Wellness',
  rooftop: 'Rooftop Terrace',
  garden: 'Gardens',
  parking: 'Underground Parking',
  storage: 'Storage Rooms',
  mamad: 'Safe Rooms (ממ״ד)',
  shabbat_elevator: 'Shabbat Elevator',
  accessible: 'Full Accessibility',
  shul: 'Synagogue (בית כנסת)',
  mikvah: 'Mikvah (מקווה)',
  sukkot_area: 'Designated Sukkot Area',
  playground: 'Playground',
  doorman: 'Doorman',
  coworking: 'Co-Working Space',
  ev_charging: 'EV Charging',
  smart_home: 'Smart Home',
  generator: 'Backup Generator',
  solar: 'Solar Panels',
  dog_park: 'Dog Park',
  tennis: 'Tennis Court',
  basketball: 'Basketball Court',
  bbq_area: 'BBQ Area',
  wine_cellar: 'Wine Cellar',
  cinema: 'Private Cinema',
  guest_suite: 'Guest Suite',
  bike_storage: 'Bike Storage',
  package_lockers: 'Package Lockers',
  club_room: 'Club Room',
  kids_room: 'Kids Room',
};

export function ProjectReviewCard({ 
  project, 
  onApprove, 
  onRequestChanges, 
  onReject,
  isLoading 
}: ProjectReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Fetch units when expanded
  const { data: projectUnits = [] } = useAdminProjectUnits(isExpanded ? project.id : undefined);

  const status = (project.verification_status || 'draft') as ProjectVerificationStatus;
  const statusInfo = statusConfig[status];

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    try {
      return format(new Date(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  const handleApprove = () => {
    onApprove(project.id, adminNotes || undefined);
  };

  const handleRequestChanges = () => {
    if (!reason.trim()) return;
    onRequestChanges(project.id, reason);
    setShowChangesDialog(false);
    setReason('');
    setAdminNotes('');
  };

  const handleReject = () => {
    if (!reason.trim()) return;
    onReject(project.id, reason);
    setShowRejectDialog(false);
    setReason('');
    setAdminNotes('');
  };

  const canTakeAction = status === 'pending_review' || status === 'changes_requested';

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="lg:w-48 h-48 lg:h-auto flex-shrink-0 bg-muted">
              {project.images?.[0] ? (
                <img
                  src={project.images[0]}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={statusInfo.className}>
                      {statusInfo.label}
                    </Badge>
                    {project.submitted_at && (
                      <span className="text-xs text-muted-foreground">
                        Submitted {formatDistanceToNow(new Date(project.submitted_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{project.city}{project.neighborhood && `, ${project.neighborhood}`}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{formatPrice(project.price_from)}</p>
                  {project.price_to && project.price_from !== project.price_to && (
                    <p className="text-xs text-muted-foreground">to {formatPrice(project.price_to)}</p>
                  )}
                </div>
              </div>

              {/* Project Details */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Home className="h-4 w-4" />
                  {project.total_units || 0} units
                </span>
                {project.completion_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                )}
                {project.construction_progress_percent !== null && (
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {project.construction_progress_percent}% complete
                  </span>
                )}
              </div>

              {/* Developer Info */}
              {project.developer && (
                <div className="flex items-center gap-2 text-sm mb-3 pb-3 border-b">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.developer.logo_url || undefined} />
                    <AvatarFallback><Building2 className="h-3 w-3" /></AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{project.developer.name}</span>
                  {project.developer.is_verified && (
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
                  <div className="space-y-4 pt-3 border-t">
                    {/* Construction Status */}
                    {project.status && (
                      <div>
                        <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Construction Status
                        </h4>
                        <Badge variant="outline">
                          {constructionStatusLabels[project.status] || project.status}
                        </Badge>
                      </div>
                    )}

                    {/* Timeline */}
                    {(project.construction_start || project.completion_date) && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Project Timeline
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          {project.construction_start && (
                            <div className="p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Construction Start</p>
                              <p className="font-medium">{formatDate(project.construction_start)}</p>
                            </div>
                          )}
                          {project.completion_date && (
                            <div className="p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Expected Completion</p>
                              <p className="font-medium">{formatDate(project.completion_date)}</p>
                            </div>
                          )}
                          {project.construction_progress_percent !== null && (
                            <div className="p-2 bg-muted/50 rounded">
                              <p className="text-xs text-muted-foreground">Progress</p>
                              <p className="font-medium">{project.construction_progress_percent}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {project.address && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Address</h4>
                        <p className="text-sm text-muted-foreground">{project.address}</p>
                      </div>
                    )}

                    {/* Full Description */}
                    {project.description && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">{project.description}</p>
                      </div>
                    )}

                    {/* Amenities - Categorized */}
                    {project.amenities && project.amenities.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Amenities ({project.amenities.length})</h4>
                        <CategorizedAmenities amenities={project.amenities} compact />
                      </div>
                    )}

                    {/* Unit Types Summary */}
                    {projectUnits.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Unit Types</h4>
                        <UnitTypesPreview units={projectUnits} compact />
                      </div>
                    )}

                    {/* Floor Plans */}
                    {project.floor_plans && project.floor_plans.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                          <FileImage className="h-4 w-4" />
                          Floor Plans ({project.floor_plans.length})
                        </h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {project.floor_plans.map((plan, i) => (
                            <img
                              key={i}
                              src={plan}
                              alt={`Floor Plan ${i + 1}`}
                              className="h-24 w-20 object-cover rounded border flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* All Photos */}
                    {project.images && project.images.length > 1 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">All Photos ({project.images.length})</h4>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {project.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Photo ${i + 1}`}
                              className="h-20 w-28 object-cover rounded flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Previous Feedback */}
                    {project.admin_feedback && (
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded">
                        <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          Previous Admin Feedback
                        </h4>
                        <p className="text-sm text-muted-foreground">{project.admin_feedback}</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t mt-3">
                {canTakeAction && (
                  <>
                    <Button
                      onClick={handleApprove}
                      disabled={isLoading}
                      size="sm"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowChangesDialog(true)}
                      disabled={isLoading}
                      size="sm"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Request Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowRejectDialog(true)}
                      disabled={isLoading}
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
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
              Explain what changes the developer needs to make before this project can be approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Feedback for Developer *</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Please add more photos, update pricing, description needs more detail..."
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
            <DialogTitle>Reject Project</DialogTitle>
            <DialogDescription>
              This project will be rejected. The developer will be notified with your reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Duplicate project, inappropriate content, unverified developer..."
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
              Reject Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <ProjectPreviewModal 
        project={project} 
        open={showPreviewModal} 
        onOpenChange={setShowPreviewModal} 
      />
    </>
  );
}
