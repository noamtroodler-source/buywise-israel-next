import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Globe, Phone, Mail, Calendar, CheckCircle, ArrowLeft, Loader2,
  MessageCircle, Eye, Users, TrendingUp, Shield
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useDeveloper, useDeveloperProjects } from '@/hooks/useProjects';
import { useProjectInquiryTracking } from '@/hooks/useProjectInquiryTracking';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';

import { useState } from 'react';

export default function DeveloperDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading, error } = useDeveloper(slug || '');
  const { data: projects = [] } = useDeveloperProjects(developer?.id || '');
  const { mutate: trackInquiry } = useProjectInquiryTracking();
  const [logoError, setLogoError] = useState(false);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'pre_sale': return 'Pre-Sale';
      case 'under_construction': return 'Under Construction';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-muted text-muted-foreground';
      case 'pre_sale': return 'bg-accent text-accent-foreground';
      case 'under_construction': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculate stats
  const currentYear = new Date().getFullYear();
  const yearsActive = developer?.founded_year ? currentYear - developer.founded_year : null;
  const totalUnits = projects.reduce((acc, p) => acc + (p.total_units || 0), 0);
  const completedProjects = projects.filter(p => p.status === 'delivery').length;
  const activeProjects = projects.filter(p => p.status !== 'delivery').length;

  // Build WhatsApp URL using the helper
  const whatsappUrl = developer?.phone 
    ? buildWhatsAppUrl(developer.phone, `Hi, I'm interested in your projects`)
    : '';

  // Handle contact clicks with tracking
  const handleWhatsAppClick = () => {
    if (developer?.phone && projects[0]) {
      trackInquiry({
        projectId: projects[0].id,
        developerId: developer.id,
        inquiryType: 'whatsapp',
        projectName: 'Developer Profile',
      });
    }
    openWhatsApp(whatsappUrl);
  };

  const handleEmailClick = () => {
    if (developer?.email && projects[0]) {
      trackInquiry({
        projectId: projects[0].id,
        developerId: developer.id,
        inquiryType: 'email',
        projectName: 'Developer Profile',
      });
    }
  };

  // Check if current user owns this developer profile
  const { user } = useAuth();
  const isOwnProfile = developer && user?.id === developer.user_id;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error || !developer) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Developer not found</h1>
          <Button asChild>
            <Link to="/developers">Browse All Developers</Link>
          </Button>
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
          className="space-y-8"
        >
          {/* Back Button */}
          {isOwnProfile ? (
            <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/5 -ml-2">
              <Link to="/developer">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/5 -ml-2">
              <Link to="/developers">
                <ArrowLeft className="h-4 w-4 mr-2" />
                All Developers
              </Link>
            </Button>
          )}

          {/* Developer Header with Stats */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info Card - Takes 2 columns */}
            <Card className="lg:col-span-2">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {developer.logo_url && !logoError ? (
                    <img
                      src={developer.logo_url}
                      alt={developer.name}
                      className="h-24 w-24 object-contain rounded-lg bg-muted p-2"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-primary" />
                    </div>
                  )}

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold text-foreground">{developer.name}</h1>
                      {developer.is_verified && (
                        <Badge className="bg-primary text-primary-foreground">
                          <Shield className="h-3 w-3 mr-1" />
                          Verified Developer
                        </Badge>
                      )}
                    </div>

                    {developer.description && (
                      <p className="text-muted-foreground">{developer.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      {yearsActive !== null && yearsActive > 0 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {yearsActive}+ years in business
                        </div>
                      )}
                      {developer.founded_year && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          Est. {developer.founded_year}
                        </div>
                      )}
                      {developer.website && (
                        <a
                          href={developer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact CTA Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {whatsappUrl && (
                  <Button className="w-full" size="lg" onClick={handleWhatsAppClick}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {developer.phone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${developer.phone}`}>
                        <Phone className="h-4 w-4 mr-1.5" />
                        Call
                      </a>
                    </Button>
                  )}
                  {developer.email && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      asChild 
                      onClick={handleEmailClick}
                      className={!developer.phone ? 'col-span-2' : ''}
                    >
                      <a href={`mailto:${developer.email}`}>
                        <Mail className="h-4 w-4 mr-1.5" />
                        Email
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{projects.length}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-foreground">{completedProjects}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-accent mx-auto mb-2">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{activeProjects}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted mx-auto mb-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalUnits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Projects */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Projects by {developer.name}
            </h2>

            {projects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No projects listed yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.slug}`}>
                    <Card className="h-full hover:shadow-card-hover transition-all duration-300 group overflow-hidden">
                      <div className="aspect-[16/9] overflow-hidden relative">
                        <img
                          src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {project.construction_progress_percent !== undefined && project.construction_progress_percent > 0 && (
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-background/90 backdrop-blur-sm rounded-md px-2 py-1">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span>Progress</span>
                                <span className="font-medium">{project.construction_progress_percent}%</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all" 
                                  style={{ width: `${project.construction_progress_percent}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                          {project.views_count > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              {project.views_count}
                            </div>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
                        </p>
                        <div className="pt-2 border-t border-border">
                          <p className="text-sm text-muted-foreground">Starting from</p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(project.price_from)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
