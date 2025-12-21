import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Globe, Phone, Mail, Calendar, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDeveloper, useDeveloperProjects } from '@/hooks/useProjects';

export default function DeveloperDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: developer, isLoading, error } = useDeveloper(slug || '');
  const { data: projects = [] } = useDeveloperProjects(developer?.id || '');

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
          <Button variant="ghost" asChild>
            <Link to="/developers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Developers
            </Link>
          </Button>

          {/* Developer Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {developer.logo_url ? (
                  <img
                    src={developer.logo_url}
                    alt={developer.name}
                    className="h-24 w-24 object-contain rounded-lg bg-muted p-2"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">{developer.name}</h1>
                    {developer.is_verified && (
                      <Badge className="bg-primary text-primary-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  {developer.description && (
                    <p className="text-muted-foreground">{developer.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    {developer.founded_year && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
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
                    {developer.phone && (
                      <a
                        href={`tel:${developer.phone}`}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {developer.phone}
                      </a>
                    )}
                    {developer.email && (
                      <a
                        href={`mailto:${developer.email}`}
                        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <Mail className="h-4 w-4" />
                        {developer.email}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">
              Projects ({projects.length})
            </h2>

            {projects.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No projects listed yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {projects.map((project) => (
                  <Link key={project.id} to={`/projects/${project.slug}`}>
                    <Card className="h-full hover:shadow-card-hover transition-all duration-300 group overflow-hidden">
                      <div className="aspect-[16/9] overflow-hidden">
                        <img
                          src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {project.available_units}/{project.total_units} available
                          </span>
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
