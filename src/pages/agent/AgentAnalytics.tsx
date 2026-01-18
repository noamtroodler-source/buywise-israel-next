import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Eye, Heart, MessageSquare, TrendingUp, Loader2, MessageCircle, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAgentProperties } from '@/hooks/useAgentProperties';
import { useAgentAnalytics } from '@/hooks/useAgentAnalytics';

export default function AgentAnalytics() {
  const { data: properties = [], isLoading: propertiesLoading } = useAgentProperties();
  const { data: analytics, isLoading: analyticsLoading } = useAgentAnalytics();

  const isLoading = propertiesLoading || analyticsLoading;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const conversionRateDisplay = analytics?.totalViews && analytics.totalViews > 0 
    ? `${analytics.conversionRate.toFixed(1)}%`
    : '—';

  return (
    <Layout>
      <div className="container py-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <Button variant="ghost" asChild className="mb-2">
                <Link to="/agent">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Analytics</h1>
              <p className="text-muted-foreground">Track your listing performance</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalViews || 0}</p>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Total Saves
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalSaves || 0}</p>
                <p className="text-xs text-muted-foreground">Users who favorited</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Inquiries
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{analytics?.totalInquiries || 0}</p>
                <p className="text-xs text-muted-foreground">WhatsApp, calls, emails</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{conversionRateDisplay}</p>
                <p className="text-xs text-muted-foreground">Inquiries / Views</p>
              </CardContent>
            </Card>
          </div>

          {/* Inquiry Breakdown */}
          {analytics && analytics.totalInquiries > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inquiry Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-green-100">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics.inquiriesByType.whatsapp}</p>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-blue-100">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics.inquiriesByType.call}</p>
                      <p className="text-sm text-muted-foreground">Phone Calls</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{analytics.inquiriesByType.email}</p>
                      <p className="text-sm text-muted-foreground">Emails</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No listings yet. Create your first listing to see analytics.
                </p>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => {
                    const propertyStats = analytics?.propertyAnalytics.find(p => p.propertyId === property.id);
                    
                    return (
                      <div key={property.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=100'}
                            alt={property.title}
                            className="h-12 w-12 rounded object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium line-clamp-1">{property.title}</p>
                            <p className="text-sm text-muted-foreground">{property.city}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-medium">{propertyStats?.views || property.views_count || 0}</p>
                            <p className="text-xs text-muted-foreground">views</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{propertyStats?.saves || 0}</p>
                            <p className="text-xs text-muted-foreground">saves</p>
                          </div>
                          <div className="text-center">
                            <p className="font-medium">{propertyStats?.inquiries || 0}</p>
                            <p className="text-xs text-muted-foreground">inquiries</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
