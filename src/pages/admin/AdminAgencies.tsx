import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, CheckCircle2, XCircle, Users, Home, 
  Globe, Mail, Phone, Calendar, ExternalLink, Trash2, Shield, ShieldOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useAdminAgencies, 
  useAgencyStats, 
  useVerifyAgency, 
  useUnverifyAgency,
  useDeleteAgency 
} from '@/hooks/useAdminAgencies';
import { format } from 'date-fns';

export default function AdminAgencies() {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'verify' | 'unverify' | 'delete';
    agencyId: string;
    agencyName: string;
  } | null>(null);

  const { data: stats, isLoading: statsLoading } = useAgencyStats();
  const { data: agencies, isLoading: agenciesLoading } = useAdminAgencies();

  const verifyAgency = useVerifyAgency();
  const unverifyAgency = useUnverifyAgency();
  const deleteAgency = useDeleteAgency();

  const handleAction = () => {
    if (!confirmDialog) return;

    const { action, agencyId } = confirmDialog;
    switch (action) {
      case 'verify':
        verifyAgency.mutate(agencyId);
        break;
      case 'unverify':
        unverifyAgency.mutate(agencyId);
        break;
      case 'delete':
        deleteAgency.mutate(agencyId);
        break;
    }
    setConfirmDialog(null);
  };

  const actionLabels = {
    verify: { 
      title: 'Verify Agency', 
      description: 'This will mark the agency as verified and display a verification badge on their profile.' 
    },
    unverify: { 
      title: 'Remove Verification', 
      description: 'This will remove the verified status from the agency.' 
    },
    delete: { 
      title: 'Delete Agency', 
      description: 'This will permanently delete the agency and remove all agent associations. This action cannot be undone.' 
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Agency Management</h2>
        <p className="text-muted-foreground">View and manage registered agencies</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statsLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Agencies</p>
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  </div>
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.verified || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Unverified</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.unverified || 0}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Agencies List */}
      <Card>
        <CardHeader>
          <CardTitle>All Agencies</CardTitle>
        </CardHeader>
        <CardContent>
          {agenciesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : agencies?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No agencies registered yet
            </div>
          ) : (
            <div className="space-y-4">
              {agencies?.map((agency) => (
                <Card key={agency.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Logo */}
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={agency.logo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {agency.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Link 
                                to={`/agencies/${agency.slug}`}
                                className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                              >
                                {agency.name}
                              </Link>
                              {agency.is_verified && (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            {agency.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {agency.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {agency.created_at && format(new Date(agency.created_at), 'MMM d, yyyy')}
                          </div>
                        </div>

                        {/* Stats Row */}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span><strong>{agency.agent_count}</strong> agents</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Home className="h-4 w-4" />
                            <span><strong>{agency.listing_count}</strong> listings</span>
                          </div>
                          {agency.email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span className="truncate max-w-[200px]">{agency.email}</span>
                            </div>
                          )}
                          {agency.phone && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{agency.phone}</span>
                            </div>
                          )}
                          {agency.website && (
                            <a 
                              href={agency.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-primary hover:underline"
                            >
                              <Globe className="h-4 w-4" />
                              <span>Website</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>

                        {/* Cities & Specializations */}
                        {(agency.cities_covered?.length || agency.specializations?.length) && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {agency.cities_covered?.slice(0, 3).map((city) => (
                              <Badge key={city} variant="outline" className="text-xs">
                                {city}
                              </Badge>
                            ))}
                            {agency.cities_covered && agency.cities_covered.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{agency.cities_covered.length - 3} cities
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col gap-2 sm:w-32">
                        {agency.is_verified ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDialog({
                              open: true,
                              action: 'unverify',
                              agencyId: agency.id,
                              agencyName: agency.name,
                            })}
                          >
                            <ShieldOff className="h-4 w-4 mr-1" />
                            Unverify
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setConfirmDialog({
                              open: true,
                              action: 'verify',
                              agencyId: agency.id,
                              agencyName: agency.name,
                            })}
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setConfirmDialog({
                            open: true,
                            action: 'delete',
                            agencyId: agency.id,
                            agencyName: agency.name,
                          })}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog?.open} 
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog && actionLabels[confirmDialog.action].title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog && (
                <>
                  Are you sure you want to {confirmDialog.action} <strong>{confirmDialog.agencyName}</strong>?
                  <br /><br />
                  {actionLabels[confirmDialog.action].description}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction}
              className={confirmDialog?.action === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
