import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, MapPin, Calendar, Home, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';

export default function Projects() {
  const { data: projects = [], isLoading } = useProjects();

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

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">New Projects</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore new development projects across Israel. Buy directly from developers with flexible payment plans.
            </p>
          </div>

          {/* Projects Grid */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No projects yet</h2>
              <p className="text-muted-foreground">
                New construction projects will be available soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link to={`/projects/${project.slug}`}>
                    <Card className="h-full overflow-hidden hover:shadow-card-hover transition-all duration-300 group">
                      <div className="aspect-[16/10] overflow-hidden relative">
                        <img
                          src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                          alt={project.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusLabel(project.status)}
                          </Badge>
                          {project.is_featured && (
                            <Badge className="bg-accent text-accent-foreground">Featured</Badge>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-5 space-y-3">
                        <div className="space-y-1">
                          <h2 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {project.name}
                          </h2>
                          {project.developer && (
                            <p className="text-sm text-primary font-medium">
                              by {project.developer.name}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-muted-foreground text-sm">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">
                            {project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {project.completion_date && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(project.completion_date).getFullYear()}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-border">
                          <p className="text-xs text-muted-foreground">Starting from</p>
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(project.price_from)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
