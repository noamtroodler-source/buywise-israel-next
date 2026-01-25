import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Building, MapPin, Calendar, Home, TrendingUp, TrendingDown, Maximize, Loader2, Sparkles, Clock, HardHat, DoorOpen } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { useProjectFavorites } from '@/hooks/useProjectFavorites';
import { useFormatPrice, useFormatArea, useAreaUnitLabel } from '@/contexts/PreferencesContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useNavigate } from 'react-router-dom';
interface CompareProject {
  id: string;
  name: string;
  slug: string;
  city: string;
  neighborhood: string | null;
  status: string;
  price_from: number | null;
  price_to: number | null;
  currency: string;
  completion_date: string | null;
  construction_progress_percent: number | null;
  total_units: number;
  available_units: number;
  images: string[] | null;
  amenities: string[] | null;
  developer?: {
    id: string;
    name: string;
  };
}

export default function CompareProjects() {
  const { compareIds, removeFromCompare, clearCompare, maxItems } = useCompare();
  const [projects, setProjects] = useState<CompareProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectFavoriteIds, toggleProjectFavorite } = useProjectFavorites();
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();
  const areaUnitLabel = useAreaUnitLabel();

  useEffect(() => {
    async function fetchProjects() {
      if (compareIds.length === 0) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          developer:developer_id (id, name)
        `)
        .in('id', compareIds);

      if (!error && data) {
        const ordered = compareIds
          .map(id => data.find(p => p.id === id))
          .filter(Boolean) as CompareProject[];
        setProjects(ordered);
      }
      setLoading(false);
    }

    fetchProjects();
  }, [compareIds]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Project Comparison',
          text: `Compare ${projects.length} development projects`,
          url: url,
        });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Comparison link copied to clipboard');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'pre_sale': return 'Pre-Sale';
      case 'foundation': return 'Foundation';
      case 'structure': return 'Structure';
      case 'finishing': return 'Finishing';
      case 'delivery': return 'Ready';
      default: return status;
    }
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'planning': return 0;
      case 'pre_sale': return 10;
      case 'foundation': return 30;
      case 'structure': return 50;
      case 'finishing': return 75;
      case 'delivery': return 100;
      default: return 0;
    }
  };

  // Quick Insights for projects
  const quickInsights = useMemo(() => {
    if (projects.length < 2) return [];

    const insights: { icon: React.ElementType; label: string; value: string; projectName: string }[] = [];

    // Lowest starting price
    const withPrice = projects.filter(p => p.price_from);
    if (withPrice.length > 0) {
      const lowestPrice = withPrice.reduce((min, p) => 
        (p.price_from || Infinity) < (min.price_from || Infinity) ? p : min
      );
      if (lowestPrice.price_from) {
        insights.push({
          icon: TrendingDown,
          label: 'Lowest Starting Price',
          value: formatPrice(lowestPrice.price_from, lowestPrice.currency || 'ILS'),
          projectName: lowestPrice.name,
        });
      }
    }

    // Most units available
    const withUnits = projects.filter(p => p.available_units !== null && p.available_units !== undefined);
    if (withUnits.length > 0) {
      const mostAvailable = withUnits.reduce((max, p) => 
        (p.available_units || 0) > (max.available_units || 0) ? p : max
      );
      if (mostAvailable.available_units && mostAvailable.available_units > 0) {
        insights.push({
          icon: DoorOpen,
          label: 'Most Available Units',
          value: `${mostAvailable.available_units} units`,
          projectName: mostAvailable.name,
        });
      }
    }

    // Soonest completion
    const withCompletion = projects.filter(p => p.completion_date);
    if (withCompletion.length > 0) {
      const soonest = withCompletion.reduce((earliest, p) => {
        if (!earliest.completion_date) return p;
        if (!p.completion_date) return earliest;
        return new Date(p.completion_date) < new Date(earliest.completion_date) ? p : earliest;
      });
      if (soonest.completion_date) {
        insights.push({
          icon: Calendar,
          label: 'Soonest Completion',
          value: new Date(soonest.completion_date).getFullYear().toString(),
          projectName: soonest.name,
        });
      }
    }

    // Furthest along in construction
    const withProgress = projects.filter(p => p.construction_progress_percent !== null);
    if (withProgress.length > 0) {
      const furthestAlong = withProgress.reduce((max, p) => 
        (p.construction_progress_percent || 0) > (max.construction_progress_percent || 0) ? p : max
      );
      if (furthestAlong.construction_progress_percent && furthestAlong.construction_progress_percent > 0) {
        insights.push({
          icon: HardHat,
          label: 'Most Progress',
          value: `${furthestAlong.construction_progress_percent}% complete`,
          projectName: furthestAlong.name,
        });
      }
    }

    return insights.slice(0, 4); // Max 4 insights
  }, [projects, formatPrice]);

  // Winner summary
  const winnerCounts = useMemo(() => {
    if (projects.length < 2) return [];

    const counts: Record<string, { name: string; wins: number }> = {};
    projects.forEach(p => {
      counts[p.id] = { name: p.name, wins: 0 };
    });

    // Lowest price wins
    const withPrice = projects.filter(p => p.price_from);
    if (withPrice.length > 1) {
      const lowestPrice = withPrice.reduce((min, p) => 
        (p.price_from || Infinity) < (min.price_from || Infinity) ? p : min
      );
      counts[lowestPrice.id].wins++;
    }

    // Most available units wins
    const withUnits = projects.filter(p => p.available_units);
    if (withUnits.length > 1) {
      const mostAvailable = withUnits.reduce((max, p) => 
        (p.available_units || 0) > (max.available_units || 0) ? p : max
      );
      counts[mostAvailable.id].wins++;
    }

    // Soonest completion wins
    const withCompletion = projects.filter(p => p.completion_date);
    if (withCompletion.length > 1) {
      const soonest = withCompletion.reduce((earliest, p) => {
        if (!earliest.completion_date) return p;
        if (!p.completion_date) return earliest;
        return new Date(p.completion_date) < new Date(earliest.completion_date) ? p : earliest;
      });
      counts[soonest.id].wins++;
    }

    // Most construction progress wins
    const withProgress = projects.filter(p => p.construction_progress_percent !== null);
    if (withProgress.length > 1) {
      const furthestAlong = withProgress.reduce((max, p) => 
        (p.construction_progress_percent || 0) > (max.construction_progress_percent || 0) ? p : max
      );
      counts[furthestAlong.id].wins++;
    }

    return Object.entries(counts).map(([projectId, data]) => ({
      projectId,
      title: data.name,
      wins: data.wins,
    }));
  }, [projects]);

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
          <div className="container py-8 md:py-10 text-center">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-96 mx-auto" />
          </div>
        </div>
        <div className="container py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Empty state
  if (compareIds.length === 0) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Building className="h-10 w-10 text-primary/60" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">No Projects to Compare</h1>
            <p className="text-muted-foreground mb-8">
              Save projects to your favorites and select them for comparison from the Favorites page.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild>
                <Link to="/favorites">Go to Favorites</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/projects">Browse Projects</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/60 to-background border-b border-border/50">
        <div className="container py-8 md:py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Compare <span className="text-primary">Projects</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Side-by-side comparison of {projects.length} development projects
            </p>
            <div className="flex justify-center gap-3 mt-6">
              <Button variant="outline" size="sm" onClick={handleShare}>
                Share Comparison
              </Button>
              <Button variant="ghost" size="sm" onClick={clearCompare}>
                Clear All
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container py-8 space-y-8">
        {/* Quick Insights */}
        {quickInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Quick Insights</span>
            </div>
            
            <div className={`grid grid-cols-1 gap-3 ${quickInsights.length <= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-4'}`}>
              {quickInsights.map((insight, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 bg-background/80 rounded-lg px-3 py-2.5"
                >
                  <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <insight.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{insight.label}</div>
                    <div className="text-sm font-semibold truncate">{insight.value}</div>
                    <div className="text-xs text-muted-foreground truncate">{insight.projectName}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Project Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={project.images?.[0] || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'}
                    alt={project.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg font-bold text-white">{project.name}</h3>
                    {project.developer && (
                      <p className="text-sm text-white/80">by {project.developer.name}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => removeFromCompare(project.id)}
                  >
                    ×
                  </Button>
                </div>
                <CardContent className="p-4 space-y-4">
                  {/* Price */}
                  <div>
                    <p className="text-xs text-muted-foreground">Starting from</p>
                    <p className="text-xl font-bold text-primary">
                      {project.price_from ? formatPrice(project.price_from, project.currency || 'ILS') : 'N/A'}
                    </p>
                    {project.price_to && (
                      <p className="text-sm text-muted-foreground">
                        up to {formatPrice(project.price_to, project.currency || 'ILS')}
                      </p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{project.neighborhood ? `${project.neighborhood}, ` : ''}{project.city}</span>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="secondary">{getStatusLabel(project.status)}</Badge>
                    </div>
                    <Progress value={getStatusProgress(project.status)} className="h-2" />
                  </div>

                  {/* Construction Progress */}
                  {project.construction_progress_percent !== null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <HardHat className="h-4 w-4" />
                        Construction
                      </span>
                      <span className="font-medium">{project.construction_progress_percent}%</span>
                    </div>
                  )}

                  {/* Completion */}
                  {project.completion_date && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Completion
                      </span>
                      <span className="font-medium">
                        {new Date(project.completion_date).getFullYear()}
                      </span>
                    </div>
                  )}

                  {/* Units */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      Available Units
                    </span>
                    <span className="font-medium">
                      {project.available_units ?? '—'} / {project.total_units ?? '—'}
                    </span>
                  </div>

                  <Button asChild className="w-full mt-4">
                    <Link to={`/projects/${project.slug}`}>View Project</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Quick Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-4 font-medium text-muted-foreground">Feature</th>
                    {projects.map(project => (
                      <th key={project.id} className="text-left py-3 px-4 font-medium">
                        {project.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Price Range</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">
                        {project.price_from ? formatPrice(project.price_from, project.currency || 'ILS') : 'N/A'}
                        {project.price_to && ` - ${formatPrice(project.price_to, project.currency || 'ILS')}`}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Location</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">{project.city}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Neighborhood</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">{project.neighborhood || '—'}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Developer</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">{project.developer?.name || 'N/A'}</td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Status</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">
                        <Badge variant="secondary">{getStatusLabel(project.status)}</Badge>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Construction Progress</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">
                        {project.construction_progress_percent !== null 
                          ? `${project.construction_progress_percent}%` 
                          : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Completion</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">
                        {project.completion_date 
                          ? new Date(project.completion_date).getFullYear()
                          : 'TBD'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 pr-4 text-muted-foreground">Available / Total Units</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">
                        {project.available_units ?? '—'} / {project.total_units ?? '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 text-muted-foreground">Amenities</td>
                    {projects.map(project => (
                      <td key={project.id} className="py-3 px-4">
                        {project.amenities?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {project.amenities.slice(0, 3).map(amenity => (
                              <Badge key={amenity} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {project.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Winner Summary */}
        {winnerCounts.length > 0 && winnerCounts.some(w => w.wins > 0) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Winner Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {winnerCounts
                  .sort((a, b) => b.wins - a.wins)
                  .map((item) => (
                    <div
                      key={item.projectId}
                      className={`p-4 rounded-lg border ${
                        item.wins === Math.max(...winnerCounts.map(w => w.wins)) && item.wins > 0
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{item.title}</span>
                        <Badge variant={item.wins > 0 ? 'default' : 'secondary'}>
                          {item.wins} {item.wins === 1 ? 'win' : 'wins'}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
