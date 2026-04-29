import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, ToggleLeft, AlertTriangle, ShieldCheck, Filter, TrendingUp, Star, DatabaseZap } from 'lucide-react';
import { PRICE_CONTEXT_FLAGS } from '@/lib/featureFlags';

interface FeatureFlag {
  id: string;
  flag_key: string;
  is_enabled: boolean;
  label: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function AdminFeatureFlags() {
  const queryClient = useQueryClient();

  const priceContextFlagDescriptions: Record<string, { label: string; description: string; icon: typeof ShieldCheck; risk: string }> = {
    [PRICE_CONTEXT_FLAGS.broadDisplay]: {
      label: 'Broad Price Context display',
      description: 'Shows listing-level Price Context more visibly across buyer surfaces while preserving public-language guardrails.',
      icon: ShieldCheck,
      risk: 'Buyer-facing',
    },
    [PRICE_CONTEXT_FLAGS.buyerFilter]: {
      label: 'Buyer Price Context filter',
      description: 'Enables the “complete Price Context” buyer filter only for listings backed by real metadata.',
      icon: Filter,
      risk: 'Discovery',
    },
    [PRICE_CONTEXT_FLAGS.placementBoost]: {
      label: 'Placement boost eligibility',
      description: 'Allows context-complete, high-confidence listings to receive controlled ranking support.',
      icon: TrendingUp,
      risk: 'Ranking',
    },
    [PRICE_CONTEXT_FLAGS.requireForFeatured]: {
      label: 'Require context for featured',
      description: 'Requires Pricing Context Complete before selected sale listings can qualify for featured exposure.',
      icon: Star,
      risk: 'Revenue',
    },
  };

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('flag_key');
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from('feature_flags')
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag updated');
    },
    onError: (error) => {
      toast.error('Failed to update: ' + error.message);
    },
  });

  const normalizePriceContextMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase
        .from('properties')
        .select('id, listing_status, price_context_confidence_tier, price_context_public_label') as any)
        .eq('listing_status', 'for_sale')
        .limit(500);

      if (error) throw error;

      const rows = (data ?? []) as Array<{
        id: string;
        listing_status: string | null;
        price_context_confidence_tier: string | null;
        price_context_public_label: string | null;
      }>;

      const safeConfidence = new Set(['strong_comparable_match', 'high_confidence', 'good_comparable_match']);
      const updates = rows.map((row) => {
        const eligibleForFilter = Boolean(row.price_context_public_label);
        const eligibleForPlacement = eligibleForFilter && safeConfidence.has(row.price_context_confidence_tier || '');

        return (supabase
          .from('properties')
          .update({
            price_context_filter_eligible: eligibleForFilter,
            price_context_display_mode: row.price_context_public_label ? 'soft' : 'hidden',
          } as any)
          .eq('id', row.id) as any);
      });

      const results = await Promise.all(updates);
      const failed = results.find((result: any) => result.error);
      if (failed?.error) throw failed.error;

      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['price-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      toast.success(`Price Context metadata refreshed for ${count} listings`);
    },
    onError: (error) => {
      toast.error('Failed to refresh Price Context metadata: ' + error.message);
    },
  });

  const handleToggle = (flag: FeatureFlag) => {
    toggleMutation.mutate({ id: flag.id, is_enabled: !flag.is_enabled });
  };

  const isCriticalFlag = (key: string) => {
    return key === 'MAINTENANCE_MODE';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const maintenanceFlag = flags?.find((f) => f.flag_key === 'MAINTENANCE_MODE');
  const priceContextKeys = new Set(Object.values(PRICE_CONTEXT_FLAGS));
  const priceContextFlags = flags?.filter((f) => priceContextKeys.has(f.flag_key as any)) || [];
  const otherFlags = flags?.filter((f) => f.flag_key !== 'MAINTENANCE_MODE' && !priceContextKeys.has(f.flag_key as any));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Feature Flags</h2>
        <p className="text-muted-foreground">
          Toggle features on or off without deploying code changes.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enabled</p>
                <p className="text-2xl font-bold text-green-600">
                  {flags?.filter((f) => f.is_enabled).length || 0}
                </p>
              </div>
              <ToggleLeft className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disabled</p>
                <p className="text-2xl font-bold text-muted-foreground">
                  {flags?.filter((f) => !f.is_enabled).length || 0}
                </p>
              </div>
              <ToggleLeft className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode - Special Card */}
      {maintenanceFlag && (
        <Card className={maintenanceFlag.is_enabled ? 'border-destructive bg-destructive/5' : ''}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className={`h-5 w-5 ${maintenanceFlag.is_enabled ? 'text-destructive' : 'text-yellow-600'}`} />
                <div>
                  <CardTitle className="text-lg">Maintenance Mode</CardTitle>
                  <CardDescription>
                    When enabled, users will see a maintenance page instead of the app.
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={maintenanceFlag.is_enabled ? 'destructive' : 'outline'}>
                  {maintenanceFlag.is_enabled ? 'ACTIVE' : 'OFF'}
                </Badge>
                <Switch
                  checked={maintenanceFlag.is_enabled}
                  onCheckedChange={() => handleToggle(maintenanceFlag)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Price Context rollout controls
              </CardTitle>
              <CardDescription>
                Stage buyer display, filters, ranking, and featured eligibility without bypassing review guardrails.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => normalizePriceContextMutation.mutate()}
              disabled={normalizePriceContextMutation.isPending}
            >
              <DatabaseZap className="mr-2 h-4 w-4" />
              {normalizePriceContextMutation.isPending ? 'Refreshing…' : 'Refresh metadata'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {priceContextFlags.length > 0 ? priceContextFlags.map((flag) => {
            const config = priceContextFlagDescriptions[flag.flag_key];
            const Icon = config?.icon || ShieldCheck;
            return (
              <div key={flag.id} className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-background p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{config?.label || flag.label || flag.flag_key}</p>
                      <Badge variant="outline">{config?.risk || 'Controlled'}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{config?.description || flag.description}</p>
                    <p className="font-mono text-xs text-muted-foreground">{flag.flag_key}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>{flag.is_enabled ? 'ON' : 'OFF'}</Badge>
                  <Switch
                    checked={flag.is_enabled}
                    onCheckedChange={() => handleToggle(flag)}
                    disabled={toggleMutation.isPending}
                  />
                </div>
              </div>
            );
          }) : (
            <p className="rounded-lg bg-background p-3 text-sm text-muted-foreground">
              Price Context flags have not been seeded yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Feature Flags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0 divide-y">
          {otherFlags?.map((flag) => (
            <div key={flag.id} className="flex items-center justify-between py-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{flag.label || flag.flag_key}</span>
                  {isCriticalFlag(flag.flag_key) && (
                    <Badge variant="destructive">Critical</Badge>
                  )}
                </div>
                {flag.description && (
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono">{flag.flag_key}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={flag.is_enabled ? 'default' : 'secondary'}>
                  {flag.is_enabled ? 'ON' : 'OFF'}
                </Badge>
                <Switch
                  checked={flag.is_enabled}
                  onCheckedChange={() => handleToggle(flag)}
                  disabled={toggleMutation.isPending}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p>
              Feature flags take effect immediately. Disabling a feature will hide it from all users.
              Use with caution, especially for critical features like calculators and the AI assistant.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}