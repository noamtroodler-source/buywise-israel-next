import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, CheckCircle, Clock, Coins, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useVisibilityProducts, useActiveBoosts, useSlotAvailability, useActivateBoost, VisibilityProduct } from '@/hooks/useBoosts';
import { useSubscription } from '@/hooks/useSubscription';
import { BoostProductCard, ENTITY_LEVEL_SLUGS } from './BoostProductCard';
import { ListingPickerSheet } from './ListingPickerSheet';

type Category = 'all' | 'homepage' | 'search' | 'directory' | 'projects' | 'email';

const CATEGORY_SLUGS: Record<Category, string[]> = {
  all: [],
  homepage: ['homepage_sale_featured', 'homepage_rent_featured', 'homepage_project_hero', 'homepage_project_secondary'],
  search: ['search_priority', 'city_spotlight', 'similar_listings_priority'],
  directory: ['agency_directory_featured', 'developer_directory_featured'],
  projects: ['projects_boost'],
  email: ['email_digest_sponsored', 'budget_tool_sponsor'],
};

const CATEGORY_LABELS: Record<Category, string> = {
  all: 'All',
  homepage: 'Homepage',
  search: 'Search',
  directory: 'Directory',
  projects: 'Projects',
  email: 'Email',
};

interface BoostMarketplaceProps {
  entityType: 'agency' | 'developer';
  entityId: string | undefined;
  entityName: string;
}

export function BoostMarketplace({ entityType, entityId, entityName }: BoostMarketplaceProps) {
  const [category, setCategory] = useState<Category>('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VisibilityProduct | null>(null);

  const { data: sub } = useSubscription();
  const creditBalance = sub?.creditBalance ?? 0;

  const { data: products = [], isLoading: productsLoading } = useVisibilityProducts(entityType);
  const { data: activeBoosts = [], isLoading: boostsLoading } = useActiveBoosts();
  const { data: slotMap = {} } = useSlotAvailability(products);
  const activateBoost = useActivateBoost();

  const filteredProducts = category === 'all'
    ? products
    : products.filter(p => CATEGORY_SLUGS[category].includes(p.slug));

  // Build a lookup: productId → active boost (for this entity)
  const activeByProduct: Record<string, typeof activeBoosts[0]> = {};
  for (const boost of activeBoosts) {
    activeByProduct[boost.product_id] = boost;
  }

  const handleActivate = (product: VisibilityProduct) => {
    if (ENTITY_LEVEL_SLUGS.has(product.slug)) {
      // Entity-level: activate immediately without picker
      activateBoost.mutate({
        product_slug: product.slug,
        target_type: entityType,
        target_id: entityId!,
      });
    } else {
      setSelectedProduct(product);
      setPickerOpen(true);
    }
  };

  const handlePickerConfirm = (
    product: VisibilityProduct,
    targetType: 'property' | 'project',
    targetId: string
  ) => {
    activateBoost.mutate(
      { product_slug: product.slug, target_type: targetType, target_id: targetId },
      {
        onSuccess: () => {
          setPickerOpen(false);
          setSelectedProduct(null);
        },
      }
    );
  };

  const billingPath = entityType === 'agency' ? '/agency/billing' : '/developer/billing';

  return (
    <div className="space-y-6">
      {/* Credit balance bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Coins className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{creditBalance} credits available</p>
            <p className="text-xs text-muted-foreground">≈ ₪{(creditBalance * 20).toLocaleString()} in visibility value</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
          <Link to={billingPath}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Buy Credits
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList className="rounded-xl">
          <TabsTrigger value="marketplace" className="rounded-lg gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg gap-1.5">
            <CheckCircle className="h-3.5 w-3.5" />
            Active Boosts
            {activeBoosts.length > 0 && (
              <Badge className="bg-primary/20 text-primary border-0 text-xs ml-1">{activeBoosts.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Marketplace tab */}
        <TabsContent value="marketplace" className="mt-5 space-y-5">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Product grid */}
          {productsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-52 rounded-2xl" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No products in this category for your account type.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map(product => (
                <BoostProductCard
                  key={product.id}
                  product={product}
                  slotAvailability={product.max_slots ? slotMap[product.id] : undefined}
                  activeBoost={activeByProduct[product.id]}
                  creditBalance={creditBalance}
                  entityName={entityName}
                  entityType={entityType}
                  onActivate={handleActivate}
                  isActivating={activateBoost.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Active Boosts tab */}
        <TabsContent value="active" className="mt-5">
          {boostsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : activeBoosts.length === 0 ? (
            <Card className="rounded-2xl border-primary/10">
              <CardContent className="p-10 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">No active boosts</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Purchase a boost product from the Marketplace tab to start promoting your listings.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => document.querySelector<HTMLButtonElement>('[value="marketplace"]')?.click()}
                >
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeBoosts.map(boost => {
                const product = products.find(p => p.id === boost.product_id);
                return (
                  <div
                    key={boost.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-primary/10 bg-primary/5"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product?.name ?? 'Boost'}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        <span>Expires {formatDistanceToNow(new Date(boost.ends_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">Active</Badge>
                  </div>
                );
              })}
              <div className="pt-2 text-center">
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-muted-foreground">
                  <Link to={billingPath + '?tab=boost'}>
                    View full ROI analytics →
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Listing Picker Sheet */}
      <ListingPickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        product={selectedProduct}
        entityType={entityType}
        entityId={entityId}
        creditBalance={creditBalance}
        onConfirm={handlePickerConfirm}
        isActivating={activateBoost.isPending}
      />
    </div>
  );
}
