import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAgent, useAgentListings, useAgentStats } from '@/hooks/useAgent';
import { useAuthorBlogPosts } from '@/hooks/useBlog';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { PropertyCard } from '@/components/property/PropertyCard';
import { BlogCard } from '@/components/blog/BlogCard';
import { CategoryToggle } from '@/components/shared/CategoryToggle';
import { 
  MessageCircle, 
  Mail, 
  Share2, 
  Building2, 
  BadgeCheck,
  MapPin,
  FileText,
  ShieldCheck,
  Linkedin,
  Instagram,
  Facebook,
  ChevronRight
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useFormatPrice } from '@/contexts/PreferencesContext';
import { trackInquiry } from '@/hooks/useInquiryTracking';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppUrl, openWhatsApp } from '@/lib/whatsapp';
import { SEOHead } from '@/components/seo/SEOHead';
import { DualNavigation } from '@/components/shared/DualNavigation';
import { generateAgentMeta, generateAgentJsonLd, SITE_CONFIG } from '@/lib/seo';

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const [category, setCategory] = useState<'buy' | 'rent'>('buy');
  
  const { data: agent, isLoading: agentLoading } = useAgent(id || '');
  const { data: activeListings, isLoading: activeLoading } = useAgentListings(id || '', 'active', category);
  const { data: pastListings, isLoading: pastLoading } = useAgentListings(id || '', 'past', category);
  const { data: stats } = useAgentStats(id || '', category);
  
  // Get both stats for toggle badges
  const { data: buyStats } = useAgentStats(id || '', 'buy');
  const { data: rentStats } = useAgentStats(id || '', 'rent');
  
  const { data: blogPosts = [], isLoading: blogLoading } = useAuthorBlogPosts('agent', agent?.id);
  const { isArticleSaved, toggleSave } = useSavedArticles();
  const formatPrice = useFormatPrice();
  const { user } = useAuth();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const whatsappUrl = agent?.phone 
    ? buildWhatsAppUrl(agent.phone, `Hi ${agent?.name || ''}, I found your profile on BuyWise Israel and would like to connect.`)
    : '';

  const handleWhatsAppClick = () => {
    const propertyId = activeListings?.[0]?.id;
    if (propertyId && agent?.id) {
      trackInquiry({
        propertyId,
        agentId: agent.id,
        inquiryType: 'whatsapp',
        propertyTitle: 'Agent Profile',
        userId: user?.id,
      });
    }
    openWhatsApp(whatsappUrl);
  };

  const handleEmail = () => {
    if (agent?.email) {
      const propertyId = activeListings?.[0]?.id;
      if (propertyId && agent.id) {
        trackInquiry({
          propertyId,
          agentId: agent.id,
          inquiryType: 'email',
          propertyTitle: 'Agent Profile',
          userId: user?.id,
        });
      }
      const subject = encodeURIComponent(`Inquiry from BuyWise Israel`);
      window.location.href = `mailto:${agent.email}?subject=${subject}`;
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: agent?.name,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard');
    }
  };

  if (agentLoading) {
    return (
      <Layout>
        <div className="container py-8 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-64" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!agent) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Agent not found</h1>
          <p className="text-muted-foreground mt-2">The agent profile you're looking for doesn't exist.</p>
          <Button asChild className="mt-6">
            <Link to="/listings">Browse Listings</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = agent && user?.id === agent.user_id;
  const seoMeta = generateAgentMeta(agent);
  const jsonLd = generateAgentJsonLd(agent);
  
  const buyTotal = (buyStats?.activeListingsCount ?? 0) + (buyStats?.pastListingsCount ?? 0);
  const rentTotal = (rentStats?.activeListingsCount ?? 0) + (rentStats?.pastListingsCount ?? 0);

  return (
    <Layout>
      <SEOHead 
        title={seoMeta.title}
        description={seoMeta.description}
        image={agent.avatar_url || undefined}
        canonicalUrl={`${SITE_CONFIG.siteUrl}/agents/${agent.id}`}
        jsonLd={jsonLd}
      />
      <div className="container py-6 md:py-8 space-y-6">
        <DualNavigation
          parentLabel={isOwnProfile ? "Dashboard" : "Browse Listings"}
          parentPath={isOwnProfile ? "/agent" : "/listings"}
        />

        {/* Hero Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-2 ring-border">
                <AvatarImage src={agent.avatar_url || undefined} alt={agent.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">{agent.name}</h1>
                  {agent.is_verified ? (
                    <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/20">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified Agent
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Basic Profile</Badge>
                  )}
                </div>

                {agent.agency ? (
                  <Link 
                    to={`/agencies/${agent.agency.slug}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Building2 className="h-4 w-4" />
                    <span>{agent.agency.name}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : agent.agency_name ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{agent.agency_name}</span>
                  </div>
                ) : null}

                {agent.license_number && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <ShieldCheck className="h-4 w-4" />
                    <span>License: #{agent.license_number}</span>
                  </div>
                )}

                {agent.languages && agent.languages.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {agent.languages.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                )}

                {agent.specializations && agent.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {agent.specializations.map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 md:min-w-[160px]">
                {agent.phone && whatsappUrl && (
                  <Button className="gap-2" onClick={handleWhatsAppClick}>
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </Button>
                )}
                <Button variant="outline" className="gap-1.5" onClick={handleEmail}>
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
                <Button variant="ghost" className="gap-2" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                  Share Profile
                </Button>
                {(agent.linkedin_url || agent.instagram_url || agent.facebook_url) && (
                  <>
                    <Separator orientation="vertical" className="h-8" />
                    {agent.linkedin_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={agent.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {agent.instagram_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={agent.instagram_url} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {agent.facebook_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={agent.facebook_url} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            {agent.bio && (
              <p className="mt-6 text-muted-foreground leading-relaxed line-clamp-2">{agent.bio}</p>
            )}

            {agent.neighborhoods_covered && agent.neighborhoods_covered.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <MapPin className="h-4 w-4" />
                  Areas Covered
                </div>
                <div className="flex flex-wrap gap-2">
                  {agent.neighborhoods_covered.map((area) => (
                    <Badge key={area} variant="outline" className="bg-muted/50">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
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

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats?.activeListingsCount ?? 0}</p>
              <p className="text-sm text-muted-foreground">
                {category === 'buy' ? 'For Sale' : 'For Rent'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {stats?.medianPrice ? formatPrice(stats.medianPrice, 'ILS') : '—'}
              </p>
              <p className="text-sm text-muted-foreground">
                {category === 'buy' ? 'Median Price' : 'Median Rent'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {stats?.avgDaysOnMarket ?? '—'}
              </p>
              <p className="text-sm text-muted-foreground">Avg. Days on Market</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{agent.years_experience}</p>
              <p className="text-sm text-muted-foreground">Years Experience</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
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

          <TabsContent value="active">
            {activeLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : activeListings && activeListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeListings.map((property) => (
                  <PropertyCard key={property.id} property={property as any} showCategoryBadge hideFeaturedBadge maxBadges={2} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {category === 'buy' 
                      ? 'No properties for sale at this time.'
                      : 'No rentals available at this time.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </div>
            ) : pastListings && pastListings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastListings.map((property) => (
                  <PropertyCard key={property.id} property={property as any} showCategoryBadge hideFeaturedBadge maxBadges={2} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {category === 'buy'
                      ? 'No past sales recorded yet.'
                      : 'No past rentals recorded yet.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="blog">
            {blogLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
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
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No articles published yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
