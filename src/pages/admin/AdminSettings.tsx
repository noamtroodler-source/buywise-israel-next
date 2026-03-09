import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { 
  Save, ExternalLink, RefreshCw, DollarSign, Percent, Calculator, 
  Building, Home, Megaphone, Tag, ChevronDown, Check, Pencil, X,
  Clock, AlertCircle, Zap, CheckCircle2
} from 'lucide-react';
import { CalculatorConstant } from '@/hooks/useCalculatorConstants';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConstantGroup {
  category: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  constants: CalculatorConstant[];
  isJson?: boolean;
  defaultOpen?: boolean;
}

export function AdminSettings() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [editedJsonValues, setEditedJsonValues] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    fees: true,
  });


  const { data: constants, isLoading } = useQuery({
    queryKey: ['admin-calculator-constants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calculator_constants')
        .select('*')
        .eq('is_current', true)
        .order('category')
        .order('constant_key');
      if (error) throw error;
      return data as CalculatorConstant[];
    },
  });

  const updateNumericMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const { error } = await supabase
        .from('calculator_constants')
        .update({ value_numeric: value, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-calculator-constants'] });
      queryClient.invalidateQueries({ queryKey: ['calculator-constants'] });
      toast.success('Setting updated successfully');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error('Failed to update setting: ' + error.message);
    },
  });

  const updateJsonMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: unknown }) => {
      const { error } = await supabase
        .from('calculator_constants')
        .update({ value_json: value as any, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-calculator-constants'] });
      queryClient.invalidateQueries({ queryKey: ['calculator-constants'] });
      toast.success('Setting updated successfully');
      setEditingId(null);
    },
    onError: (error) => {
      toast.error('Failed to update setting: ' + error.message);
    },
  });

  const handleSaveNumeric = (constant: CalculatorConstant) => {
    const newValue = editedValues[constant.id];
    if (newValue === undefined) return;
    
    const numValue = parseFloat(newValue);
    if (isNaN(numValue)) {
      toast.error('Please enter a valid number');
      return;
    }
    
    updateNumericMutation.mutate({ id: constant.id, value: numValue });
    setEditedValues((prev) => {
      const next = { ...prev };
      delete next[constant.id];
      return next;
    });
  };

  const handleSaveJson = (constant: CalculatorConstant) => {
    const newValue = editedJsonValues[constant.id];
    if (newValue === undefined) return;
    
    try {
      const jsonValue = JSON.parse(newValue);
      updateJsonMutation.mutate({ id: constant.id, value: jsonValue });
      setEditedJsonValues((prev) => {
        const next = { ...prev };
        delete next[constant.id];
        return next;
      });
    } catch (e) {
      toast.error('Invalid JSON format');
    }
  };

  const handleCancelEdit = (constantId: string) => {
    setEditingId(null);
    setEditedValues((prev) => {
      const next = { ...prev };
      delete next[constantId];
      return next;
    });
    setEditedJsonValues((prev) => {
      const next = { ...prev };
      delete next[constantId];
      return next;
    });
  };

  const groupedConstants: ConstantGroup[] = [
    {
      category: 'general',
      label: 'General',
      description: 'Exchange rates and base values',
      icon: <DollarSign className="h-5 w-5" />,
      constants: constants?.filter((c) => c.category === 'general') || [],
      defaultOpen: true,
    },
    {
      category: 'fees',
      label: 'Professional Fees',
      description: 'Agent commissions, lawyer fees, and other professional charges',
      icon: <Percent className="h-5 w-5" />,
      constants: constants?.filter((c) => c.category === 'fees') || [],
      defaultOpen: true,
    },
    {
      category: 'mortgage',
      label: 'Mortgage',
      description: 'Mortgage rates and loan parameters',
      icon: <Building className="h-5 w-5" />,
      constants: constants?.filter((c) => c.category === 'mortgage') || [],
    },
    {
      category: 'tax',
      label: 'Tax Rates',
      description: 'Purchase tax, capital gains, and other tax settings',
      icon: <Calculator className="h-5 w-5" />,
      constants: constants?.filter((c) => c.category === 'tax') || [],
    },
    {
      category: 'municipal',
      label: 'Municipal',
      description: 'Municipal and property-related constants',
      icon: <Home className="h-5 w-5" />,
      constants: constants?.filter((c) => c.category === 'municipal') || [],
    },
    {
      category: 'arnona_discounts',
      label: 'Arnona Discounts',
      description: 'Municipal tax discount rules (JSON format)',
      icon: <Tag className="h-5 w-5" />,
      constants: constants?.filter((c) => c.category === 'arnona_discounts') || [],
      isJson: true,
    },
    {
      category: 'branding',
      label: 'Branding & Contact',
      description: 'Support contact information and branding values',
      icon: <Megaphone className="h-5 w-5" />,
      constants: constants?.filter((c) => c.category === 'branding') || [],
      isJson: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const renderNumericConstant = (constant: CalculatorConstant) => {
    const isEditing = editingId === constant.id;
    const currentValue = editedValues[constant.id] ?? constant.value_numeric?.toString() ?? '';
    const hasUnsavedChanges = editedValues[constant.id] !== undefined;
    const isStale = constant.updated_at && 
      new Date().getTime() - new Date(constant.updated_at).getTime() > 7 * 24 * 60 * 60 * 1000;

    return (
      <div
        key={constant.id}
        className={cn(
          "flex items-center justify-between p-4 rounded-lg border bg-card transition-all",
          isEditing && "ring-2 ring-primary ring-offset-2",
          isStale && !isEditing && "border-yellow-500/30"
        )}
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {constant.label || constant.constant_key}
            </p>
            {isStale && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-500/50 text-[10px]">
                <Clock className="h-3 w-3 mr-1" />
                Stale
              </Badge>
            )}
          </div>
          {constant.description && (
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {constant.description}
            </p>
          )}
          {constant.updated_at && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated {formatDistanceToNow(new Date(constant.updated_at), { addSuffix: true })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Input
                type="number"
                step="any"
                value={currentValue}
                onChange={(e) =>
                  setEditedValues((prev) => ({
                    ...prev,
                    [constant.id]: e.target.value,
                  }))
                }
                className="w-32 h-9"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-primary hover:text-primary"
                onClick={() => handleSaveNumeric(constant)}
                disabled={!hasUnsavedChanges || updateNumericMutation.isPending}
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => handleCancelEdit(constant.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold text-foreground bg-muted px-3 py-1 rounded">
                  {constant.value_numeric}
                </span>
                {constant.source && (
                  <Badge variant="outline" className="text-[10px]">
                    {constant.source}
                    {constant.source_url && (
                      <a
                        href={constant.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </Badge>
                )}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9"
                onClick={() => setEditingId(constant.id)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderJsonConstant = (constant: CalculatorConstant) => {
    const isEditing = editingId === constant.id;
    const currentValue = editedJsonValues[constant.id] ?? JSON.stringify(constant.value_json || {}, null, 2);
    const hasUnsavedChanges = editedJsonValues[constant.id] !== undefined;

    return (
      <Card key={constant.id} className={cn(isEditing && "ring-2 ring-primary ring-offset-2")}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {constant.label || constant.constant_key}
                {constant.source && (
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {constant.source}
                    {constant.source_url && (
                      <a
                        href={constant.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </Badge>
                )}
              </CardTitle>
              {constant.description && (
                <CardDescription className="mt-1">{constant.description}</CardDescription>
              )}
            </div>
            {!isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingId(constant.id)}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={currentValue}
                onChange={(e) =>
                  setEditedJsonValues((prev) => ({
                    ...prev,
                    [constant.id]: e.target.value,
                  }))
                }
                className="font-mono text-sm min-h-[180px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleSaveJson(constant)}
                  disabled={!hasUnsavedChanges || updateJsonMutation.isPending}
                  size="sm"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelEdit(constant.id)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <pre className="bg-muted/50 rounded-lg p-4 text-sm font-mono overflow-x-auto max-h-[200px]">
              {JSON.stringify(constant.value_json || {}, null, 2)}
            </pre>
          )}
          {constant.updated_at && (
            <p className="text-xs text-muted-foreground mt-3">
              Last updated {formatDistanceToNow(new Date(constant.updated_at), { addSuffix: true })}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Site Settings</h2>
          <p className="text-muted-foreground">
            Manage calculator constants, exchange rates, and site-wide configurations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-calculator-constants'] })}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Settings Sections */}
      <div className="space-y-4">
        {groupedConstants.map((group) => (
          <Collapsible
            key={group.category}
            open={openSections[group.category] ?? group.defaultOpen}
            onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, [group.category]: open }))}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {group.icon}
                      </div>
                      <div className="text-left">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {group.label}
                          <Badge variant="secondary" className="text-xs">
                            {group.constants.length}
                          </Badge>
                        </CardTitle>
                        <CardDescription>{group.description}</CardDescription>
                      </div>
                    </div>
                    <ChevronDown className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform",
                      openSections[group.category] && "rotate-180"
                    )} />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  {group.constants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No settings found in this category</p>
                    </div>
                  ) : group.isJson ? (
                    <div className="space-y-4">
                      {group.constants.map((constant) => renderJsonConstant(constant))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.constants.map((constant) => renderNumericConstant(constant))}
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>

      {/* Payment Provider Section */}
      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Payment Configuration</CardTitle>
              <CardDescription>
                PayPlus payment integration — configure once API keys are available.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed bg-muted/30 p-6 text-center space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm font-medium text-foreground">PayPlus integration pending</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Payment processing will be configured once PayPlus API credentials are provided. 
              Founding Partner enrollments (free trial) work without payment processing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
