import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building, Phone, Mail, Globe, CheckCircle, ChevronRight, Calendar, Star, MapPin, Users, TrendingUp, Award, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Developer } from '@/types/projects';

interface ProjectDeveloperCardProps {
  developer: Developer;
}

export function ProjectDeveloperCard({ developer }: ProjectDeveloperCardProps) {
  const [logoError, setLogoError] = useState(false);

  const hasAtAGlance = developer.is_publicly_traded || developer.tase_ticker ||
    (developer.specialties && developer.specialties.length > 0) ||
    (developer.regions_active && developer.regions_active.length > 0) ||
    developer.company_size || developer.company_type;

  const hasTrackRecord = (developer.notable_projects && developer.notable_projects.length > 0) ||
    developer.completed_projects_text || developer.awards_certifications;

  const developerMessage = developer.value_proposition || developer.description;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Star className="h-5 w-5 text-primary" />
          Why This Developer
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6 space-y-5">
        {/* 1. Identity Strip */}
        <div className="flex items-start gap-4">
          <Link to={`/developers/${developer.slug}`} className="shrink-0">
            {developer.logo_url && !logoError ? (
              <img
                src={developer.logo_url}
                alt={developer.name}
                className="w-16 h-16 object-contain rounded-lg bg-muted p-2 hover:ring-2 hover:ring-primary/20 transition-all"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center hover:ring-2 hover:ring-primary/20 transition-all">
                <Building className="h-8 w-8 text-primary" />
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={`/developers/${developer.slug}`}>
                <h3 className="font-semibold hover:text-primary hover:underline transition-colors inline-flex items-center gap-1">
                  {developer.name}
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                </h3>
              </Link>
              {developer.is_verified && (
                <Badge variant="secondary" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                {developer.total_projects || 0} Projects
              </span>
              {developer.founded_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Est. {developer.founded_year}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. At a Glance Chips */}
        {hasAtAGlance && (
          <div className="flex flex-wrap gap-1.5">
            {developer.is_publicly_traded && (
              <Badge variant="outline" className="gap-1 text-xs font-medium bg-muted/50">
                <TrendingUp className="h-3 w-3" />
                Publicly Traded{developer.tase_ticker ? ` (TASE: ${developer.tase_ticker})` : ''}
              </Badge>
            )}
            {developer.company_type && !developer.is_publicly_traded && (
              <Badge variant="outline" className="gap-1 text-xs font-medium bg-muted/50">
                <Briefcase className="h-3 w-3" />
                {developer.company_type}
              </Badge>
            )}
            {developer.company_size && (
              <Badge variant="outline" className="gap-1 text-xs font-medium bg-muted/50">
                <Users className="h-3 w-3" />
                {developer.company_size}
              </Badge>
            )}
            {developer.specialties?.map((specialty) => (
              <Badge key={specialty} variant="outline" className="text-xs font-medium bg-muted/50">
                {specialty}
              </Badge>
            ))}
            {developer.regions_active && developer.regions_active.length > 0 && (
              <Badge variant="outline" className="gap-1 text-xs font-medium bg-muted/50">
                <MapPin className="h-3 w-3" />
                Active in {developer.regions_active.join(', ')}
              </Badge>
            )}
          </div>
        )}

        {/* 3. Track Record */}
        {hasTrackRecord && (
          <div className="space-y-2.5 border-t border-border/50 pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Track Record</p>

            {developer.notable_projects && developer.notable_projects.length > 0 && (
              <div className="text-sm">
                <span className="font-medium text-foreground">Notable Projects: </span>
                <span className="text-muted-foreground">{developer.notable_projects.join(' · ')}</span>
              </div>
            )}

            {developer.completed_projects_text && (
              <p className="text-sm text-muted-foreground">{developer.completed_projects_text}</p>
            )}

            {developer.awards_certifications && (
              <div className="flex items-start gap-2 text-sm">
                <Award className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{developer.awards_certifications}</span>
              </div>
            )}
          </div>
        )}

        {/* 4. Value Proposition / Description */}
        {developerMessage && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">From the developer</p>
            <p className="text-sm text-foreground leading-relaxed italic">
              "{developerMessage}"
            </p>
          </div>
        )}

        {/* 5. Contact Actions */}
        <div className="flex flex-wrap gap-2">
          {developer.phone && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={`tel:${developer.phone}`}>
                <Phone className="h-4 w-4 mr-1.5" />
                Call
              </a>
            </Button>
          )}
          {developer.email && (
            <Button size="sm" className="flex-1" asChild>
              <a href={`mailto:${developer.email}`}>
                <Mail className="h-4 w-4 mr-1.5" />
                Email
              </a>
            </Button>
          )}
        </div>

        {developer.website && (
          <Button variant="ghost" size="sm" className="w-full justify-between" asChild>
            <a href={developer.website} target="_blank" rel="noopener noreferrer">
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4" />
                Visit Website
              </span>
              <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        )}

        <Link to={`/developers/${developer.slug}`}>
          <Button variant="secondary" size="sm" className="w-full justify-between">
            <span>View All {developer.name} Projects</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
