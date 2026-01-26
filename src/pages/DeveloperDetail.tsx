import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, Globe, Phone, Mail, Calendar, CheckCircle, ArrowLeft, Loader2,
  MessageCircle, Eye, Users, TrendingUp, Shield, FileText, MapPin, Share2,
  Linkedin, Instagram, Facebook
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeveloper, useDeveloperProjects } from '@/hooks/useProjects';
import { useAuthorBlogPosts } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { BlogCard } from '@/components/blog/BlogCard';
import { useProjectInquiryTracking } from '@/hooks/useProjectInquiryTracking';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { toast } from 'sonner';

export default function DeveloperDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading, error } = useDeveloper(slug || '');
  const { data: projects = [] } = useDeveloperProjects(developer?.id || '');
  const { data: blogPosts = [] } = useAuthorBlogPosts('developer', developer?.id);
  const { isArticleSaved, toggleSave } = useSavedArticles();
  const { mutate: trackInquiry } = useProjectInquiryTracking();
  const [logoError, setLogoError] = useState(false);
  const { user } = useAuth();

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

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: developer?.name, url });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  // Check if current user owns this developer profile
  const isOwnProfile = developer && user?.id === developer.user_id;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'pre_sale': return 'Pre-Sale';
      case 'under_construction': return 'Under Construction';
      case 'completed': case 'delivery': return 'Completed';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-muted text-muted-foreground';
      case 'pre_sale': return 'bg-primary/20 text-primary';
      case 'under_construction': return 'bg-primary text-primary-foreground';
      case 'completed': case 'delivery': return 'bg-primary/10 text-primary';
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

  const formatCompanySize = (size: string | null) => {
    if (!size) return null;
    const sizeLabels: Record<string, string> = {
      '1-10': '1-10 employees',
      '11-50': '11-50 employees',
      '51-200': '51-200 employees',
      '201-500': '201-500 employees',
      '500+': '500+ employees',
    };
    return sizeLabels[size] || size;
  };

  const formatCompanyType = (type: string | null) => {
    if (!type) return null;
    const typeLabels: Record<string, string> = {
      'private': 'Private Company',
      'public': 'Public Company',
      'subsidiary': 'Subsidiary',
      'partnership': 'Partnership',
    };
    return typeLabels[type] || type;
  };

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

  const activeProjectsList = projects.filter(p => p.status !== 'delivery');
  const completedProjectsList = projects.filter(p => p.status === 'delivery');

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

          {/* Hero Card */}
          <Card className="overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Logo */}
                {developer.logo_url && !logoError ? (
                  <img
                    src={developer.logo_url}
                    alt={developer.name}
                    className="h-24 w-24 object-contain rounded-xl bg-muted p-3 shrink-0"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="h-24 w-24 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  {/* Name & Verified Badge */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-3xl font-bold text-foreground">{developer.name}</h1>
                    {developer.is_verified && (
                      <Badge className="bg-primary text-primary-foreground">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified Developer
                      </Badge>
                    )}
                  </div>

                  {/* Company Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {developer.founded_year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Est. {developer.founded_year}
                      </span>
                    )}
                    {formatCompanyType(developer.company_type) && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{formatCompanyType(developer.company_type)}</span>
                      </>
                    )}
                    {formatCompanySize(developer.company_size) && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{formatCompanySize(developer.company_size)}</span>
                      </>
                    )}
                    {yearsActive !== null && yearsActive > 0 && (
                      <>
                        <span className="text-muted-foreground/50">·</span>
                        <span>{yearsActive}+ years in business</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  {developer.description && (
                    <p className="text-muted-foreground max-w-2xl">{developer.description}</p>
                  )}

                  {/* Office Location */}
                  {developer.office_city && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span>{developer.office_city} Office</span>
                      {developer.office_address && (
                        <span className="text-muted-foreground/70">· {developer.office_address}</span>
                      )}
                    </div>
                  )}

                  {/* Specializations */}
                  {developer.specialties && developer.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {developer.specialties.map((spec) => (
                        <Badge key={spec} variant="secondary" className="capitalize">
                          {spec.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Contact Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {whatsappUrl && (
                      <Button onClick={handleWhatsAppClick} size="sm">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        WhatsApp
                      </Button>
                    )}
                    {developer.phone && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${developer.phone}`}>
                          <Phone className="h-4 w-4 mr-2" />
                          Call
                        </a>
                      </Button>
                    )}
                    {developer.email && (
                      <Button variant="outline" size="sm" asChild onClick={handleEmailClick}>
                        <a href={`mailto:${developer.email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </a>
                      </Button>
                    )}
                    {developer.website && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={developer.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          Website
                        </a>
                      </Button>
                    )}

                    <Separator orientation="vertical" className="h-6 hidden sm:block" />

                    {/* Social Links */}
                    {developer.linkedin_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={developer.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {developer.instagram_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={developer.instagram_url} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {developer.facebook_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={developer.facebook_url} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{activeProjects}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{completedProjects}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mx-auto mb-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{totalUnits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabbed Interface */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="h-12 p-1 bg-muted/50 rounded-xl w-full md:w-auto">
              <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-background">
                Active Projects
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {activeProjectsList.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-background">
                Completed
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {completedProjectsList.length}
                </span>
              </TabsTrigger>
              {blogPosts.length > 0 && (
                <TabsTrigger value="blog" className="rounded-lg data-[state=active]:bg-background">
                  Blog
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {blogPosts.length}
                  </span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeProjectsList.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No active projects at the moment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeProjectsList.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      getStatusLabel={getStatusLabel}
                      getStatusColor={getStatusColor}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {completedProjectsList.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No completed projects yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {completedProjectsList.map((project) => (
                    <ProjectCard 
                      key={project.id} 
                      project={project} 
                      getStatusLabel={getStatusLabel}
                      getStatusColor={getStatusColor}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {blogPosts.length > 0 && (
              <TabsContent value="blog" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {blogPosts.map((post, index) => (
                    <BlogCard
                      key={post.id}
                      post={post}
                      index={index}
                      isSaved={isArticleSaved(post.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </motion.div>
      </div>
    </Layout>
  );
}

// Extracted ProjectCard component for cleaner code
interface ProjectCardProps {
  project: {
    id: string;
    slug: string;
    name: string;
    images?: string[] | null;
    status: string;
    neighborhood?: string | null;
    city: string;
    price_from: number | null;
    views_count: number;
    construction_progress_percent?: number | null;
  };
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  formatPrice: (price: number | null) => string;
}

function ProjectCard({ project, getStatusLabel, getStatusColor, formatPrice }: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.slug}`}>
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
  );
}
