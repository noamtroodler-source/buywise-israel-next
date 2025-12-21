import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Plus, Eye, Home, MessageSquare, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAgentProfile, useAgentProperties } from '@/hooks/useAgentProperties';

export default function AgentDashboard() {
  const { data: agentProfile, isLoading: profileLoading } = useAgentProfile();
  const { data: properties = [], isLoading: propertiesLoading } = useAgentProperties();

  const isLoading = profileLoading || propertiesLoading;

  const publishedCount = properties.filter(p => p.is_published).length;
  const unpublishedCount = properties.filter(p => !p.is_published).length;
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
            <Button asChild>
              <Link to="/agent/properties/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Property
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{properties.length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Published
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  <span className="text-2xl font-bold">{publishedCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Drafts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl font-bold">{unpublishedCount}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold">{totalViews}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 sm:grid-cols-2">
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
                          property.is_published ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {property.is_published ? 'Published' : 'Draft'}
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
