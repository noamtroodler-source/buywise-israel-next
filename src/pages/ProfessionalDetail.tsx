import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { PageLoader } from '@/components/shared/PageLoader';
import { ProfessionalContactCard } from '@/components/professionals/ProfessionalContactCard';
import { ProfessionalHighlights } from '@/components/professionals/ProfessionalHighlights';
import { useTrustedProfessional, getCategoryLabel } from '@/hooks/useTrustedProfessionals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, MapPin, Info } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';

export default function ProfessionalDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: professional, isLoading } = useTrustedProfessional(slug || '');

  if (isLoading) return <PageLoader />;

  if (!professional) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Professional not found</h1>
          <p className="text-muted-foreground mt-2">The profile you're looking for doesn't exist.</p>
          <Button asChild className="mt-6">
            <Link to={ROUTES.PROFESSIONALS}>Browse Professionals</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const title = `${professional.name}${professional.company ? ` — ${professional.company}` : ''} | ${SITE_CONFIG.siteName}`;
  const description = professional.description || `${getCategoryLabel(professional.category)} working with international buyers in Israel.`;

  return (
    <Layout>
      <SEOHead
        title={title.slice(0, 60)}
        description={description.slice(0, 160)}
        canonicalUrl={`${SITE_CONFIG.siteUrl}/professionals/${professional.slug}`}
      />
      <div className="container py-6 md:py-8 space-y-6">
        <DualNavigation
          parentLabel="Trusted Professionals"
          parentPath={ROUTES.PROFESSIONALS}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                      {professional.logo_url ? (
                        <img
                          src={professional.logo_url}
                          alt={`${professional.name} logo`}
                          className="h-full w-full object-cover rounded-xl"
                        />
                      ) : (
                        <span className="text-3xl font-bold text-primary">
                          {professional.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                        {professional.name}
                      </h1>
                      {professional.company && (
                        <p className="text-muted-foreground">{professional.company}</p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          {getCategoryLabel(professional.category)}
                        </Badge>
                        {professional.works_with_internationals && (
                          <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                            <Globe className="h-3 w-3 mr-1" />
                            International buyers
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <ProfessionalHighlights professional={professional} />

                  {/* Language & city badges */}
                  <div className="mt-5 pt-5 border-t border-border space-y-4">
                    {professional.languages?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Languages</p>
                        <div className="flex flex-wrap gap-1.5">
                          {professional.languages.map((lang) => (
                            <Badge key={lang} variant="outline" className="text-xs">
                              {lang}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {professional.cities_covered?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Areas Covered</p>
                        <div className="flex flex-wrap gap-1.5">
                          {professional.cities_covered.map((city) => (
                            <Badge key={city} variant="outline" className="text-xs bg-muted/50">
                              <MapPin className="h-3 w-3 mr-1" />
                              {city}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* About */}
            {professional.long_description && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent className="p-6 md:p-8">
                    <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
                    <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                      {professional.long_description}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Specializations */}
            {professional.specializations?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Specializations</h2>
                    <div className="flex flex-wrap gap-2">
                      {professional.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Trust Disclaimer */}
            <div className="bg-muted/30 rounded-xl p-5 border border-border/50">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  BuyWise connects buyers with professionals many internationals have successfully worked with. Buyers should always evaluate which advisor is right for their personal situation.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ProfessionalContactCard professional={professional} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
