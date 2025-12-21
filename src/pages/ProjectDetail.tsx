import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building, MapPin, Calendar, Home, Phone, Mail, 
  ArrowLeft, CheckCircle, Loader2, Bed, Bath, Maximize 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject, useProjectUnits } from '@/hooks/useProjects';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, error } = useProject(slug || '');
  const { data: units = [] } = useProjectUnits(project?.id || '');

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning Phase';
      case 'pre_sale': return 'Pre-Sale';
      case 'under_construction': return 'Under Construction';
      case 'completed': return 'Completed';
      default: return status;
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

  const getUnitStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'reserved': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'sold': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
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

  if (error || !project) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Project not found</h1>
          <Button asChild>
            <Link to="/projects">Browse All Projects</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Calculate timeline progress
  const getTimelineProgress = () => {
    if (!project.construction_start || !project.completion_date) return 0;
    const start = new Date(project.construction_start).getTime();
    const end = new Date(project.completion_date).getTime();
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Image */}
        <div className="relative h-[50vh] min-h-[400px]">
          <img
            src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920'}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container">
              <Button variant="ghost" className="text-white mb-4" asChild>
                <Link to="/projects">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Projects
                </Link>
              </Button>
              <Badge className="mb-3">{getStatusLabel(project.status)}</Badge>
              <h1 className="text-4xl font-bold text-white mb-2">{project.name}</h1>
              {project.developer && (
                <Link 
                  to={`/developers/${project.developer.slug}`}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  by {project.developer.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="container py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Key Info */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <MapPin className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-semibold">{project.city}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Home className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Available Units</p>
                  <p className="font-semibold">{project.available_units} of {project.total_units}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="font-semibold">
                    {project.completion_date 
                      ? new Date(project.completion_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : 'TBD'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Building className="h-6 w-6 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Price From</p>
                  <p className="font-semibold text-primary">{formatPrice(project.price_from)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Construction Timeline */}
            {project.construction_start && project.completion_date && (
              <Card>
                <CardHeader>
                  <CardTitle>Construction Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Start: {new Date(project.construction_start).toLocaleDateString()}
                      </span>
                      <span className="font-medium">{getTimelineProgress()}% Complete</span>
                      <span className="text-muted-foreground">
                        End: {new Date(project.completion_date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${getTimelineProgress()}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="units">Units ({units.length})</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Description */}
                {project.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-line">
                        {project.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Developer Contact */}
                {project.developer && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Developer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {project.developer.logo_url ? (
                            <img
                              src={project.developer.logo_url}
                              alt={project.developer.name}
                              className="h-16 w-16 object-contain rounded-lg bg-muted p-2"
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building className="h-8 w-8 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{project.developer.name}</h3>
                              {project.developer.is_verified && (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {project.developer.total_projects} Projects
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {project.developer.phone && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={`tel:${project.developer.phone}`}>
                                <Phone className="h-4 w-4 mr-1" />
                                Call
                              </a>
                            </Button>
                          )}
                          {project.developer.email && (
                            <Button size="sm" asChild>
                              <a href={`mailto:${project.developer.email}`}>
                                <Mail className="h-4 w-4 mr-1" />
                                Inquire
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="units">
                {units.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Home className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No unit details available yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {units.map((unit) => (
                      <Card key={unit.id}>
                        <CardContent className="p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{unit.unit_type}</h3>
                            <Badge className={getUnitStatusColor(unit.status)}>
                              {unit.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Bed className="h-4 w-4" />
                              <span>{unit.bedrooms}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Bath className="h-4 w-4" />
                              <span>{unit.bathrooms}</span>
                            </div>
                            {unit.size_sqm && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Maximize className="h-4 w-4" />
                                <span>{unit.size_sqm}m²</span>
                              </div>
                            )}
                          </div>
                          {unit.floor && (
                            <p className="text-sm text-muted-foreground">Floor {unit.floor}</p>
                          )}
                          <div className="pt-2 border-t border-border">
                            <p className="text-xl font-bold text-primary">
                              {formatPrice(unit.price)}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="amenities">
                {project.amenities && project.amenities.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Amenities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                        {project.amenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span>{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <p className="text-muted-foreground">No amenity details available yet</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
