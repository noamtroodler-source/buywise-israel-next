import { format } from 'date-fns';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Users, 
  Home, 
  MapPin, 
  Briefcase,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminAgency } from '@/hooks/useAdminAgencies';
import { useState } from 'react';

interface AgencyDetailSheetProps {
  agency: AdminAgency | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (agencyId: string) => void;
  onUnverify: (agencyId: string) => void;
  onDelete: (agencyId: string) => void;
  isVerifying?: boolean;
  isDeleting?: boolean;
}

export function AgencyDetailSheet({
  agency,
  open,
  onOpenChange,
  onVerify,
  onUnverify,
  onDelete,
  isVerifying,
  isDeleting,
}: AgencyDetailSheetProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!agency) return null;

  const handleVerify = () => {
    onVerify(agency.id);
    onOpenChange(false);
  };

  const handleUnverify = () => {
    onUnverify(agency.id);
    onOpenChange(false);
  };

  const handleDelete = () => {
    onDelete(agency.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Agency Review
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6">
            {/* Header with Logo and Name */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 rounded-lg border">
                <AvatarImage src={agency.logo_url || ''} alt={agency.name} />
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xl">
                  {agency.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold truncate">{agency.name}</h2>
                <p className="text-sm text-muted-foreground">/{agency.slug}</p>
                <div className="mt-2">
                  {agency.is_verified ? (
                    <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                      <XCircle className="h-3 w-3 mr-1" />
                      Pending Verification
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Contact Information
              </h3>
              <div className="space-y-2">
                {agency.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${agency.email}`} className="text-primary hover:underline">
                      {agency.email}
                    </a>
                  </div>
                )}
                {agency.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${agency.phone}`} className="hover:underline">
                      {agency.phone}
                    </a>
                  </div>
                )}
                {agency.website && (
                  <div className="flex items-center gap-3 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={agency.website.startsWith('http') ? agency.website : `https://${agency.website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {agency.website}
                      <span className="text-xs">↗</span>
                    </a>
                  </div>
                )}
                {!agency.email && !agency.phone && !agency.website && (
                  <p className="text-sm text-muted-foreground italic">No contact information provided</p>
                )}
              </div>
            </div>

            <Separator />

            {/* About */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                About
              </h3>
              {agency.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{agency.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided</p>
              )}
              {agency.founded_year && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Founded in {agency.founded_year}
                </div>
              )}
            </div>

            <Separator />

            {/* Cities Covered */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Cities Covered
              </h3>
              {agency.cities_covered && agency.cities_covered.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agency.cities_covered.map((city) => (
                    <Badge key={city} variant="secondary" className="text-xs">
                      {city}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No cities specified</p>
              )}
            </div>

            <Separator />

            {/* Specializations */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Specializations
              </h3>
              {agency.specializations && agency.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {agency.specializations.map((spec) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No specializations specified</p>
              )}
            </div>

            <Separator />

            {/* Stats */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{agency.agent_count || 0}</span>
                  <span className="text-muted-foreground">agents</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{agency.listing_count || 0}</span>
                  <span className="text-muted-foreground">listings</span>
                </div>
              </div>
              {agency.created_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Registered {format(new Date(agency.created_at), 'MMM d, yyyy')}
                </div>
              )}
            </div>

            <Separator />

            {/* Accepting Agents Status */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Settings
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Accepting new agents:</span>
                {agency.is_accepting_agents ? (
                  <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="secondary">No</Badge>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
              {agency.is_verified ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleUnverify}
                  disabled={isVerifying}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Remove Verification
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleVerify}
                  disabled={isVerifying}
                >
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Verify Agency
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agency</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{agency.name}</strong>? This action cannot be undone.
              All associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Agency
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
