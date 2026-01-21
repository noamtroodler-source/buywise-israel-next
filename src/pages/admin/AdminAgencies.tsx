import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, CheckCircle2, XCircle, Users, Home, 
  Globe, Mail, Phone, Calendar, ExternalLink, Trash2, Shield, ShieldOff, Eye, Clock, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AgencyDetailSheet } from '@/components/admin/AgencyDetailSheet';
import { 
  useAdminAgencies, 
  useAgencyStats, 
  useVerifyAgency, 
  useUnverifyAgency,
  useDeleteAgency,
  useSuspendAgency,
  AdminAgency,
  AgencyStatus
} from '@/hooks/useAdminAgencies';
import { format } from 'date-fns';

const statusConfig: Record<AgencyStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  active: { label: 'Verified', variant: 'default', icon: CheckCircle2 },
  suspended: { label: 'Suspended', variant: 'destructive', icon: AlertTriangle },
};

export default function AdminAgencies() {
  const [selectedAgency, setSelectedAgency] = useState<AdminAgency | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AgencyStatus | 'all'>('pending');

  const { data: stats, isLoading: statsLoading } = useAgencyStats();
  const { data: agencies, isLoading: agenciesLoading } = useAdminAgencies(
    activeTab === 'all' ? undefined : activeTab
  );

  const verifyAgency = useVerifyAgency();
  const unverifyAgency = useUnverifyAgency();
  const deleteAgency = useDeleteAgency();
  const suspendAgency = useSuspendAgency();

  const handleOpenReview = (agency: AdminAgency) => {
    setSelectedAgency(agency);
    setSheetOpen(true);
  };

  const getAgencyStatus = (agency: AdminAgency): AgencyStatus => {
    if (agency.status) return agency.status;
    // Fallback for legacy data
    return agency.is_verified ? 'active' : 'pending';
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
      <div className="grid gap-4 sm:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
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
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats?.pending || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Suspended</p>
                    <p className="text-2xl font-bold text-destructive">{stats?.suspended || 0}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabs for filtering */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AgencyStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending
            {stats?.pending ? <Badge variant="secondary" className="ml-1">{stats.pending}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Verified
          </TabsTrigger>
          <TabsTrigger value="suspended" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Suspended
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Agencies List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'all' ? 'All Agencies' : `${statusConfig[activeTab as AgencyStatus]?.label || 'All'} Agencies`}
          </CardTitle>
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
              {activeTab === 'pending' 
                ? 'No agencies pending verification'
                : activeTab === 'suspended'
                ? 'No suspended agencies'
                : 'No agencies registered yet'
              }
            </div>
          ) : (
            <div className="space-y-4">
              {agencies?.map((agency) => {
                const agencyStatus = getAgencyStatus(agency);
                const StatusIcon = statusConfig[agencyStatus]?.icon || Clock;
                
                return (
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
                                <Badge variant={statusConfig[agencyStatus]?.variant || 'secondary'}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusConfig[agencyStatus]?.label || 'Unknown'}
                                </Badge>
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
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenReview(agency)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                          {agencyStatus === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => verifyAgency.mutate(agency.id)}
                              disabled={verifyAgency.isPending}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                          {agencyStatus === 'active' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              onClick={() => suspendAgency.mutate(agency.id)}
                              disabled={suspendAgency.isPending}
                            >
                              <ShieldOff className="h-4 w-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                          {agencyStatus === 'suspended' && (
                            <Button
                              size="sm"
                              onClick={() => verifyAgency.mutate(agency.id)}
                              disabled={verifyAgency.isPending}
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Reinstate
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agency Detail Sheet */}
      <AgencyDetailSheet
        agency={selectedAgency}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onVerify={(id) => verifyAgency.mutate(id)}
        onUnverify={(id) => unverifyAgency.mutate(id)}
        onDelete={(id) => deleteAgency.mutate(id)}
        isVerifying={verifyAgency.isPending}
        isDeleting={deleteAgency.isPending}
      />
    </motion.div>
  );
}
