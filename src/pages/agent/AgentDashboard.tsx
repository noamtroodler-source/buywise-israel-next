import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plus, Eye, Home, BarChart3, Loader2, FileText, Clock, CheckCircle, AlertCircle, Settings, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLeadStats } from '@/hooks/useAgentLeads';
import { useAgentProfile, useAgentProperties } from '@/hooks/useAgentProperties';

export default function AgentDashboard() {
  const { data: agentProfile, isLoading: profileLoading } = useAgentProfile();
  const { data: properties = [], isLoading: propertiesLoading } = useAgentProperties();
  const { data: leadStats } = useLeadStats();

  const isLoading = profileLoading || propertiesLoading;

  // Count by verification status
  const statusCounts = {
    draft: properties.filter(p => (p as any).verification_status === 'draft').length,
    pending_review: properties.filter(p => (p as any).verification_status === 'pending_review').length,
    changes_requested: properties.filter(p => (p as any).verification_status === 'changes_requested').length,
    approved: properties.filter(p => (p as any).verification_status === 'approved').length,
    rejected: properties.filter(p => (p as any).verification_status === 'rejected').length,
  };
  
  const totalViews = properties.reduce((sum, p) => sum + (p.views_count || 0), 0);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const statusCards = [
    { key: 'draft', label: 'Drafts', icon: FileText, color: 'text-muted-foreground', bg: 'bg-muted' },
    { key: 'pending_review', label: 'Pending Review', icon: Clock, color: 'text-primary', bg: 'bg-primary/10' },
    { key: 'changes_requested', label: 'Changes Requested', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'approved', label: 'Live', icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
  ];

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
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Welcome, {agentProfile?.name}
                </h1>
                <p className="text-muted-foreground">
                  {agentProfile?.agency_name || 'Independent Agent'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/agent/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/agent/analytics">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              <Button asChild>
                <Link to="/agent/properties/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Link>
              </Button>
            </div>
          </div>

          {/* Changes Requested Alert */}
          {statusCounts.changes_requested > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">Action Required</p>
                <p className="text-sm text-orange-700">
                  {statusCounts.changes_requested} listing{statusCounts.changes_requested > 1 ? 's' : ''} need{statusCounts.changes_requested === 1 ? 's' : ''} changes before approval.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild className="flex-shrink-0">
                <Link to="/agent/properties?tab=changes_requested">View</Link>
              </Button>
            </div>
          )}

          {/* Status Cards */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            {statusCards.map((s) => (
              <Card key={s.key}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{statusCounts[s.key as keyof typeof statusCounts]}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{totalViews}</p>
                    <p className="text-xs text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {}}>
              <Link to="/agent/properties">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Home className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Manage Properties</h3>
                    <p className="text-sm text-muted-foreground">
                      View, edit, or delete your listings
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link to="/agent/leads">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">Leads</h3>
                      {(leadStats?.new || 0) > 0 && (
                        <Badge variant="default" className="text-xs">
                          {leadStats?.new} new
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Manage buyer inquiries
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link to="/agent/properties/new">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Add New Property</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a new property listing
                    </p>
                  </div>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Recent Properties */}
          {properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {properties.slice(0, 5).map((property) => (
                    <div
                      key={property.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                          alt={property.title}
                          className="h-12 w-12 rounded object-cover"
                        />
                        <div>
                          <p className="font-medium line-clamp-1">{property.title}</p>
                          <p className="text-sm text-muted-foreground">{property.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          (property as any).verification_status === 'approved' 
                            ? 'bg-primary/10 text-primary' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {(property as any).verification_status === 'approved' ? 'Live' : 
                           (property as any).verification_status === 'pending_review' ? 'Pending' :
                           (property as any).verification_status === 'changes_requested' ? 'Changes Needed' :
                           'Draft'}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/agent/properties/${property.id}/edit`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
