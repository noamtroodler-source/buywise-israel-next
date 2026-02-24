import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';
import { SEOHead } from '@/components/seo/SEOHead';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { PageLoader } from '@/components/shared/PageLoader';
import { ProfessionalContactCard } from '@/components/professionals/ProfessionalContactCard';
import { ProfessionalHighlights } from '@/components/professionals/ProfessionalHighlights';
import { PROFESSIONAL_LOGOS } from '@/components/professionals/professionalLogos';
import { getAccentColor } from '@/components/professionals/professionalColors';
import { useExtractedColor } from '@/hooks/useExtractedColor';
import { useTrustedProfessional, getCategoryLabel } from '@/hooks/useTrustedProfessionals';
import { useProfessionalTestimonials } from '@/hooks/useProfessionalTestimonials';
import { ProfessionalHeroCard } from '@/components/professionals/ProfessionalHeroCard';
import { ProfessionalTestimonialCard } from '@/components/professionals/ProfessionalTestimonialCard';
import { ProfessionalProcessCard } from '@/components/professionals/ProfessionalProcessCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/seo';
import { ROUTES } from '@/lib/routes';

export default function ProfessionalDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: professional, isLoading } = useTrustedProfessional(slug || '');
  const { data: testimonials } = useProfessionalTestimonials(professional?.id);

  const logoUrl = professional?.logo_url || (professional ? PROFESSIONAL_LOGOS[professional.slug] : undefined) || undefined;
  const extractedColor = useExtractedColor(logoUrl);
  const accentColor = professional ? (extractedColor || getAccentColor(professional)) : extractedColor || '#6366f1';

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
            <ProfessionalHeroCard professional={professional} accentColor={accentColor} logoUrl={logoUrl} />

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

            {/* How It Works */}
            <ProfessionalProcessCard professional={professional} accentColor={accentColor} />

            {/* Testimonials */}
            <ProfessionalTestimonialCard professional={professional} accentColor={accentColor} testimonials={testimonials} />

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
            <ProfessionalContactCard professional={professional} accentColor={accentColor} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
