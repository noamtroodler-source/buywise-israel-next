import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, Globe, Phone, Mail, MapPin, CheckCircle2, Users, Home, Clock, TrendingUp, FileText, Linkedin, Instagram, Facebook, Key } from 'lucide-react';
import { useExtractedColor } from '@/hooks/useExtractedColor';
import { ProfileShareMenu } from '@/components/shared/ProfileShareMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { PropertyCard } from '@/components/property/PropertyCard';
import { BlogCard } from '@/components/blog/BlogCard';
import { CategoryToggle } from '@/components/shared/CategoryToggle';
import { useAgency, useAgencyAgents, useAgencyListings, useAgencyStats } from '@/hooks/useAgency';
import { useAuthorBlogPosts } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { toast } from 'sonner';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { generateAgencyMeta, generateAgencyJsonLd, SITE_CONFIG } from '@/lib/seo';

export default function AgencyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [category, setCategory] = useState<'buy' | 'rent'>('buy');
  const [logoError, setLogoError] = useState(false);
  
  const { data: agency, isLoading: agencyLoading, error } = useAgency(slug || '');
  const accentColor = useExtractedColor(agency?.logo_url);
  const { data: agents, isLoading: agentsLoading } = useAgencyAgents(agency?.id, category);
  const { data: activeListings, isLoading: activeLoading } = useAgencyListings(agency?.id, 'active', category);
  const { data: pastListings, isLoading: pastLoading } = useAgencyListings(agency?.id, 'past', category);
  const { data: stats } = useAgencyStats(agency?.id, category);
  
  // Get both stats for toggle badges
  const { data: buyStats } = useAgencyStats(agency?.id, 'buy');
  const { data: rentStats } = useAgencyStats(agency?.id, 'rent');
  
  const { data: blogPosts = [], isLoading: blogLoading } = useAuthorBlogPosts('agency', agency?.id);
  const { isArticleSaved, toggleSave } = useSavedArticles();
  
  const { data: userAgent } = useQuery({
    queryKey: ['user-agent', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('agents')
        .select('agency_id')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const isOwner = agency && userAgent?.agency_id === agency.id;

  // handleShare removed — now using ProfileShareMenu component

  const formatPriceHook = useFormatPrice();
  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return formatPriceHook(price, 'ILS');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (agencyLoading) {
    return (
      <Layout>
        <div className="container py-8 space-y-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (error || !agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Agency Not Found</h1>
          <p className="text-muted-foreground mb-6">The agency you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/agencies">View All Agencies</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const seoMeta = generateAgencyMeta(agency);
  const jsonLd = generateAgencyJsonLd(agency);
  
  const buyTotal = (buyStats?.activeListingsCount ?? 0) + (buyStats?.pastListingsCount ?? 0);
  const rentTotal = (rentStats?.activeListingsCount ?? 0) + (rentStats?.pastListingsCount ?? 0);

  return (
    <Layout>
      <SEOHead 
        title={seoMeta.title}
        description={seoMeta.description}
        image={agency.logo_url || undefined}
        canonicalUrl={`${SITE_CONFIG.siteUrl}/agencies/${agency.slug}`}
        jsonLd={jsonLd}
      />
      <div className="container py-8 space-y-8">
        <DualNavigation
          parentLabel={isOwner ? "Dashboard" : "All Agencies"}
          parentPath={isOwner ? "/agency" : "/agencies"}
        />

        {/* Hero Card */}
        <Card 
          className="overflow-hidden"
          style={accentColor ? {
            borderTop: `3px solid ${accentColor}`,
            background: `linear-gradient(160deg, ${accentColor}12, ${accentColor}05 40%, transparent 70%)`,
          } : undefined}
        >
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <div 
                  className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-muted flex items-center justify-center overflow-hidden"
                  style={accentColor ? { boxShadow: `0 0 0 2px ${accentColor}30` } : undefined}
                >
                  {agency.logo_url && !logoError ? (
                    <img 
                      src={agency.logo_url} 
                      alt={agency.name} 
                      className="w-full h-full object-cover"
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold">{agency.name}</h1>
                    {agency.is_verified && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  {agency.founded_year && (
                    <p className="text-muted-foreground mt-1">Est. {agency.founded_year}</p>
                  )}
                </div>

                {agency.description && (
                  <p className="text-muted-foreground line-clamp-2">{agency.description}</p>
                )}

                <div className="flex flex-wrap gap-2">
                  {agency.cities_covered?.map((city) => (
                    <Badge key={city} variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {city}
                    </Badge>
                  ))}
                  {agency.specializations?.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {agency.website && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={agency.website} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Website
                      </a>
                    </Button>
                  )}
                  {agency.phone && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${agency.phone}`}>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </a>
                    </Button>
                  )}
                  {agency.email && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={`mailto:${agency.email}`}>
                        <Mail className="h-4 w-4 mr-2" />
                        Email
                      </a>
                    </Button>
                  )}
                  <ProfileShareMenu 
                    name={agency.name} 
                    profileType="agency" 
                    size="sm"
                  />
                  {(agency.social_links?.linkedin || agency.social_links?.instagram || agency.social_links?.facebook) && (
                    <>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      {agency.social_links?.linkedin && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={agency.social_links.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <Linkedin className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {agency.social_links?.instagram && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={agency.social_links.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                            <Instagram className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {agency.social_links?.facebook && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={agency.social_links.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                            <Facebook className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Toggle */}
        <div className="flex justify-center">
          <CategoryToggle
            value={category}
            onChange={setCategory}
            buyCount={buyTotal}
            rentCount={rentTotal}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-2" style={accentColor ? { color: accentColor } : undefined} />
              <p className="text-2xl font-bold">{stats?.totalAgents ?? 0}</p>
              <p className="text-sm text-muted-foreground">Agents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              {category === 'buy' ? (
                <Home className="h-5 w-5 mx-auto mb-2" style={accentColor ? { color: accentColor } : undefined} />
              ) : (
                <Key className="h-5 w-5 mx-auto mb-2" style={accentColor ? { color: accentColor } : undefined} />
              )}
              <p className="text-2xl font-bold">{stats?.activeListingsCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                {category === 'buy' ? 'For Sale' : 'For Rent'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-2" style={accentColor ? { color: accentColor } : undefined} />
              <p className="text-2xl font-bold">{formatPrice(stats?.medianPrice ?? null)}</p>
              <p className="text-sm text-muted-foreground">
                {category === 'buy' ? 'Median Price' : 'Median Rent'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-2" style={accentColor ? { color: accentColor } : undefined} />
              <p className="text-2xl font-bold">{stats?.avgDaysOnMarket ?? 'N/A'}</p>
              <p className="text-sm text-muted-foreground">Avg. Days on Market</p>
            </CardContent>
          </Card>
        </div>

        {/* Our Team */}
        {agents && agents.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold">Our Team</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {agentsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))
              ) : (
                agents.map((agent) => (
                  <Link key={agent.id} to={`/agents/${agent.id}`}>
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4 text-center">
                        <Avatar className="h-16 w-16 mx-auto mb-3">
                          <AvatarImage src={agent.avatar_url || undefined} alt={agent.name} className="object-cover" />
                          <AvatarFallback>{getInitials(agent.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <p className="font-medium text-sm">{agent.name}</p>
                          {agent.is_verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {agent.years_experience}+ years
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {agent.activeListingsCount} {category === 'buy' ? 'for sale' : 'for rent'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </section>
        )}

        {/* Listings Tabs */}
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="active" className="gap-2 h-10 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {category === 'buy' ? 'For Sale' : 'For Rent'}
              <span className="ml-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {stats?.activeListingsCount ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2 h-10 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {category === 'buy' ? 'Sold' : 'Rented'}
              <span className="ml-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {stats?.pastListingsCount ?? 0}
              </span>
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2 h-10 px-4 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Blog
              <span className="ml-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                {blogPosts.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            {activeLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : activeListings && activeListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeListings.map((property: any) => (
                  <PropertyCard key={property.id} property={property} showCategoryBadge hideFeaturedBadge maxBadges={2} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  {category === 'buy' ? (
                    <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  ) : (
                    <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  )}
                  <h3 className="text-lg font-medium mb-2">
                    {category === 'buy' ? 'No Properties For Sale' : 'No Rentals Available'}
                  </h3>
                  <p className="text-muted-foreground">
                    {category === 'buy' 
                      ? "This agency doesn't have any properties for sale right now."
                      : "This agency doesn't have any rentals available right now."
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            {pastLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : pastListings && pastListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastListings.map((property: any) => (
                  <PropertyCard key={property.id} property={property} showCategoryBadge hideFeaturedBadge maxBadges={2} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {category === 'buy' ? 'No Past Sales' : 'No Past Rentals'}
                  </h3>
                  <p className="text-muted-foreground">
                    {category === 'buy'
                      ? 'No past sales to display yet.'
                      : 'No past rentals to display yet.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="blog" className="space-y-6">
            {blogLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : blogPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Blog Posts</h3>
                  <p className="text-muted-foreground">This agency hasn't published any blog posts yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
