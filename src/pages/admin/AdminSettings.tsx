import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, ExternalLink, RefreshCw, DollarSign, Percent, Calculator, Building, Home, Megaphone, Tag } from 'lucide-react';
import { CalculatorConstant } from '@/hooks/useCalculatorConstants';

interface ConstantGroup {
  category: string;
  label: string;
  icon: React.ReactNode;
  constants: CalculatorConstant[];
  isJson?: boolean;
}

export function AdminSettings() {
  const queryClient = useQueryClient();
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [editedJsonValues, setEditedJsonValues] = useState<Record<string, string>>({});

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

  const groupedConstants: ConstantGroup[] = [
    {
      category: 'general',
      label: 'General',
      icon: <DollarSign className="h-4 w-4" />,
      constants: constants?.filter((c) => c.category === 'general') || [],
    },
    {
      category: 'mortgage',
      label: 'Mortgage',
      icon: <Building className="h-4 w-4" />,
      constants: constants?.filter((c) => c.category === 'mortgage') || [],
    },
    {
      category: 'fees',
      label: 'Fees',
      icon: <Percent className="h-4 w-4" />,
      constants: constants?.filter((c) => c.category === 'fees') || [],
    },
    {
      category: 'tax',
      label: 'Tax',
      icon: <Calculator className="h-4 w-4" />,
      constants: constants?.filter((c) => c.category === 'tax') || [],
    },
    {
      category: 'municipal',
      label: 'Municipal',
      icon: <Home className="h-4 w-4" />,
      constants: constants?.filter((c) => c.category === 'municipal') || [],
    },
    {
      category: 'arnona_discounts',
      label: 'Arnona',
      icon: <Tag className="h-4 w-4" />,
      constants: constants?.filter((c) => c.category === 'arnona_discounts') || [],
      isJson: true,
    },
    {
      category: 'branding',
      label: 'Branding',
      icon: <Megaphone className="h-4 w-4" />,
      constants: constants?.filter((c) => c.category === 'branding') || [],
      isJson: true,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const renderConstantCard = (constant: CalculatorConstant, isJson: boolean) => {
    if (isJson || constant.value_json) {
      const currentValue = editedJsonValues[constant.id] ?? JSON.stringify(constant.value_json || {}, null, 2);
      return (
        <Card key={constant.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{constant.label || constant.constant_key}</CardTitle>
                {constant.description && (
                  <CardDescription>{constant.description}</CardDescription>
                )}
              </div>
              {constant.source && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {constant.source}
                  {constant.source_url && (
                    <a
                      href={constant.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Label htmlFor={constant.id}>JSON Value</Label>
              <Textarea
                id={constant.id}
                value={currentValue}
                onChange={(e) =>
                  setEditedJsonValues((prev) => ({
                    ...prev,
                    [constant.id]: e.target.value,
                  }))
                }
                className="font-mono text-sm min-h-[120px]"
              />
              <Button
                onClick={() => handleSaveJson(constant)}
                disabled={
                  editedJsonValues[constant.id] === undefined ||
                  updateJsonMutation.isPending
                }
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
            {constant.effective_from && (
              <p className="text-xs text-muted-foreground mt-2">
                Effective from: {new Date(constant.effective_from).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={constant.id}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{constant.label || constant.constant_key}</CardTitle>
              {constant.description && (
                <CardDescription>{constant.description}</CardDescription>
              )}
            </div>
            {constant.source && (
              <Badge variant="outline" className="flex items-center gap-1">
                {constant.source}
                {constant.source_url && (
                  <a
                    href={constant.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor={constant.id}>Value</Label>
              <Input
                id={constant.id}
                type="number"
                step="any"
                value={
                  editedValues[constant.id] !== undefined
                    ? editedValues[constant.id]
                    : constant.value_numeric ?? ''
                }
                onChange={(e) =>
                  setEditedValues((prev) => ({
                    ...prev,
                    [constant.id]: e.target.value,
                  }))
                }
                className="max-w-xs"
              />
            </div>
            <Button
              onClick={() => handleSaveNumeric(constant)}
              disabled={
                editedValues[constant.id] === undefined ||
                updateNumericMutation.isPending
              }
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
          {constant.effective_from && (
            <p className="text-xs text-muted-foreground mt-2">
              Effective from: {new Date(constant.effective_from).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Site Settings</h2>
        <p className="text-muted-foreground">
          Manage calculator constants, exchange rates, and other site-wide settings.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {groupedConstants.map((group) => (
            <TabsTrigger key={group.category} value={group.category} className="flex items-center gap-2">
              {group.icon}
              <span>{group.label}</span>
              {group.constants.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {group.constants.length}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {groupedConstants.map((group) => (
          <TabsContent key={group.category} value={group.category} className="space-y-4">
            {group.constants.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No settings found in this category.
                </CardContent>
              </Card>
            ) : (
              group.constants.map((constant) => renderConstantCard(constant, group.isJson || false))
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}