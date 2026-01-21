import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, ToggleLeft, AlertTriangle } from 'lucide-react';

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
  const otherFlags = flags?.filter((f) => f.flag_key !== 'MAINTENANCE_MODE');

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