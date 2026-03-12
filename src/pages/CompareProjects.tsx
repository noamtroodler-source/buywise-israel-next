import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Building, MapPin, Calendar, Home, HardHat, Clock, 
  Wrench, CheckCircle 
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCompare } from '@/contexts/CompareContext';
import { supabase } from '@/integrations/supabase/client';
import { useProjectFavorites } from '@/hooks/useProjectFavorites';
import { useFormatPrice, useFormatArea } from '@/contexts/PreferencesContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Project, ProjectUnit } from '@/types/projects';
import { GuestSignupNudge } from '@/components/shared/GuestSignupNudge';
import {
  CompareHero,
  CompareProjectCard,
  CompareProjectQuickInsights,
  CompareSection,
  CompareProjectWinnerSummary,
  CompareUnitTypesSection,
  type ComparisonRow,
} from '@/components/compare';

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
  const [projectUnits, setProjectUnits] = useState<Record<string, ProjectUnit[]>>({});
  const [loading, setLoading] = useState(true);
  const { projectFavoriteIds, toggleProjectFavorite } = useProjectFavorites();
  const { user } = useAuth();
  const formatPrice = useFormatPrice();
  const formatArea = useFormatArea();

  useEffect(() => {
    async function fetchProjects() {
      if (compareIds.length === 0) {
        setProjects([]);
        setProjectUnits({});
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

        // Fetch units for all projects
        const { data: unitsData } = await supabase
          .from('project_units')
          .select('*')
          .in('project_id', compareIds)
          .order('display_order');

        if (unitsData) {
          const unitsByProject: Record<string, ProjectUnit[]> = {};
          unitsData.forEach(unit => {
            if (!unitsByProject[unit.project_id]) {
              unitsByProject[unit.project_id] = [];
            }
            unitsByProject[unit.project_id].push(unit as ProjectUnit);
          });
          setProjectUnits(unitsByProject);
        }
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

  const handleToggleFavorite = (projectId: string) => {
    toggleProjectFavorite(projectId);
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

  // Core details rows
  const coreDetailsRows: ComparisonRow[] = useMemo(() => [
    {
      label: 'Price Range',
      getValue: (p: any) => {
        const project = p as CompareProject;
        if (!project.price_from) return 'TBD';
        const from = formatPrice(project.price_from, project.currency || 'ILS');
        const to = project.price_to ? formatPrice(project.price_to, project.currency || 'ILS') : null;
        return to ? `${from} - ${to}` : `From ${from}`;
      },
      highlight: true,
      getBestPropertyId: (props: any[]) => {
        const withPrice = (props as CompareProject[]).filter(p => p.price_from);
        if (withPrice.length < 2) return null;
        const min = withPrice.reduce((best, p) => 
          (p.price_from || Infinity) < (best.price_from || Infinity) ? p : best
        );
        return min.id;
      },
    },
    {
      label: 'City',
      getValue: (p: any) => (p as CompareProject).city,
      icon: MapPin,
    },
    {
      label: 'Neighborhood',
      getValue: (p: any) => (p as CompareProject).neighborhood || '—',
    },
    {
      label: 'Developer',
      getValue: (p: any) => (p as CompareProject).developer?.name || '—',
      icon: Building,
    },
  ], [formatPrice]);

  const constructionRows: ComparisonRow[] = useMemo(() => [
    {
      label: 'Status',
      getValue: (p: any) => getStatusLabel((p as CompareProject).status),
      icon: Wrench,
    },
    {
      label: 'Construction Progress',
      getValue: (p: any) => {
        const progress = (p as CompareProject).construction_progress_percent;
        return progress !== null ? `${progress}%` : '—';
      },
      icon: HardHat,
      getBestPropertyId: (props: any[]) => {
        const withProgress = (props as CompareProject[]).filter(p => p.construction_progress_percent !== null);
        if (withProgress.length < 2) return null;
        const max = withProgress.reduce((best, p) => 
          (p.construction_progress_percent || 0) > (best.construction_progress_percent || 0) ? p : best
        );
        return max.id;
      },
    },
    {
      label: 'Completion Date',
      getValue: (p: any) => {
        const date = (p as CompareProject).completion_date;
        return date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'TBD';
      },
      icon: Calendar,
      getBestPropertyId: (props: any[]) => {
        const withDate = (props as CompareProject[]).filter(p => p.completion_date);
        if (withDate.length < 2) return null;
        const soonest = withDate.reduce((best, p) => {
          if (!best.completion_date) return p;
          if (!p.completion_date) return best;
          return new Date(p.completion_date) < new Date(best.completion_date) ? p : best;
        });
        return soonest.id;
      },
    },
  ], []);

  const availabilityRows: ComparisonRow[] = useMemo(() => [
    {
      label: 'Total Units',
      getValue: (p: any) => (p as CompareProject).total_units?.toString() || '—',
      icon: Home,
    },
  ], []);

  const amenitiesRow: ComparisonRow[] = useMemo(() => [
    {
      label: 'Amenities',
      getValue: (p: any) => {
        const amenities = (p as CompareProject).amenities;
        if (!amenities?.length) return '—';
        return amenities.slice(0, 4).join(', ') + (amenities.length > 4 ? ` +${amenities.length - 4}` : '');
      },
      icon: CheckCircle,
    },
  ], []);

  // Winner counts
  const winnerCounts = useMemo(() => {
    if (projects.length < 2) return [];

    const allRows = [...coreDetailsRows, ...constructionRows, ...availabilityRows];
    const counts: Record<string, { name: string; wins: number }> = {};
    
    projects.forEach(p => {
      counts[p.id] = { name: p.name, wins: 0 };
    });

    allRows.forEach(row => {
      if (row.getBestPropertyId) {
        // Cast projects to Property[] since CompareSection expects that
        const bestId = row.getBestPropertyId(projects as any);
        if (bestId && counts[bestId]) {
          counts[bestId].wins++;
        }
      }
    });

    return Object.entries(counts).map(([projectId, data]) => ({
      projectId,
      title: data.name,
      wins: data.wins,
    }));
  }, [projects, coreDetailsRows, constructionRows, availabilityRows]);

  // Generate winner badges
  const getWinnerBadge = (projectId: string): string | null => {
    if (projects.length < 2) return null;
    
    const withPrice = projects.filter(p => p.price_from);
    if (withPrice.length > 0) {
      const lowestPrice = withPrice.reduce((min, p) => 
        (p.price_from || Infinity) < (min.price_from || Infinity) ? p : min
      );
      if (lowestPrice.id === projectId) return 'Lowest Price';
    }

    const withProgress = projects.filter(p => p.construction_progress_percent !== null);
    if (withProgress.length > 0) {
      const furthestAlong = withProgress.reduce((max, p) => 
        (p.construction_progress_percent || 0) > (max.construction_progress_percent || 0) ? p : max
      );
      if (furthestAlong.id === projectId && furthestAlong.construction_progress_percent! >= 50) {
        return 'Most Progress';
      }
    }

    return null;
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-8">
            <div className="animate-pulse space-y-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-72" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            </div>
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
      {/* Hero Header */}
      <CompareHero
        propertyCount={projects.length}
        maxProperties={maxItems}
        onShare={handleShare}
        onClearAll={clearCompare}
        category="projects"
      />

      <div className="container py-4 md:py-8 space-y-4 md:space-y-8">
        {/* Guest Session Warning */}
        {!user && projects.length > 0 && (
          <GuestSignupNudge
            icon={Clock}
            message="Your comparison is saved to this session only. Sign up to save comparisons and revisit them anytime."
            variant="banner"
          />
        )}

        {/* Project Cards */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {projects.map(project => (
              <CompareProjectCard
                key={project.id}
                project={project}
                formatPrice={formatPrice}
                isFavorite={projectFavoriteIds.includes(project.id)}
                onRemove={() => removeFromCompare(project.id)}
                onToggleFavorite={() => handleToggleFavorite(project.id)}
                winnerBadge={getWinnerBadge(project.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Insights */}
        <CompareProjectQuickInsights
          projects={projects}
          formatPrice={formatPrice}
        />

        {/* Comparison Sections */}
        <div className="space-y-4 md:space-y-6">
          <CompareSection
            title="Project Overview"
            icon={Building}
            rows={coreDetailsRows}
            properties={projects as any}
          />

          <CompareSection
            title="Construction"
            icon={HardHat}
            rows={constructionRows}
            properties={projects as any}
          />

          <CompareSection
            title="Units"
            icon={Home}
            rows={availabilityRows}
            properties={projects as any}
          />

          <CompareSection
            title="Amenities"
            icon={CheckCircle}
            rows={amenitiesRow}
            properties={projects as any}
          />
        </div>

        {/* Unit Type Comparison (Optional Section) */}
        <CompareUnitTypesSection
          projects={projects}
          projectUnits={projectUnits}
          formatPrice={formatPrice}
          formatArea={formatArea}
        />

        {/* Winner Summary */}
        <CompareProjectWinnerSummary
          projects={projects}
          winnerCounts={winnerCounts}
        />
      </div>
    </Layout>
  );
}
