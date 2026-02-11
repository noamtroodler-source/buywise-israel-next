import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ClipboardList, FileText, Building, Landmark, Home, Check, Plus, Trash2 } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  notes: string;
  required: boolean;
}

interface ChecklistCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ChecklistItem[];
}

const initialCategories: ChecklistCategory[] = [
  {
    id: 'personal',
    label: 'Personal Documents',
    icon: FileText,
    items: [
      { id: 'id', label: 'ID Card (Teudat Zehut)', checked: false, notes: '', required: true },
      { id: 'passport', label: 'Passport (if foreign resident)', checked: false, notes: '', required: false },
      { id: 'marriage', label: 'Marriage Certificate (if applicable)', checked: false, notes: '', required: false },
      { id: 'income_proof', label: 'Proof of Income (3 months payslips)', checked: false, notes: '', required: true },
      { id: 'tax_returns', label: 'Tax Returns (Shuma)', checked: false, notes: '', required: true },
      { id: 'bank_statements', label: 'Bank Statements (6 months)', checked: false, notes: '', required: true },
    ],
  },
  {
    id: 'property',
    label: 'Property Documents',
    icon: Home,
    items: [
      { id: 'tabu', label: 'Tabu Extract (Land Registry)', checked: false, notes: '', required: true },
      { id: 'purchase_agreement', label: 'Purchase Agreement', checked: false, notes: '', required: true },
      { id: 'floor_plan', label: 'Floor Plan / Blueprint', checked: false, notes: '', required: false },
      { id: 'permit_4', label: 'Form 4 (Building Permit)', checked: false, notes: '', required: true },
      { id: 'arnona', label: 'Arnona (Property Tax) Clearance', checked: false, notes: '', required: true },
      { id: 'vaad_bayit', label: 'Vaad Bayit Clearance', checked: false, notes: '', required: true },
    ],
  },
  {
    id: 'mortgage',
    label: 'Mortgage Documents',
    icon: Landmark,
    items: [
      { id: 'mortgage_approval', label: 'Mortgage Pre-Approval', checked: false, notes: '', required: true },
      { id: 'appraisal', label: 'Property Appraisal Report', checked: false, notes: '', required: true },
      { id: 'insurance_structure', label: 'Structural Insurance (Bituach Mivne)', checked: false, notes: '', required: true },
      { id: 'insurance_life', label: 'Life Insurance for Mortgage', checked: false, notes: '', required: true },
      { id: 'bank_forms', label: 'Bank Application Forms', checked: false, notes: '', required: true },
    ],
  },
  {
    id: 'legal',
    label: 'Legal & Transfer',
    icon: Building,
    items: [
      { id: 'lawyer_contract', label: 'Lawyer Engagement Letter', checked: false, notes: '', required: true },
      { id: 'power_attorney', label: 'Power of Attorney (if needed)', checked: false, notes: '', required: false },
      { id: 'mas_rechisha', label: 'Purchase Tax Declaration', checked: false, notes: '', required: true },
      { id: 'transfer_form', label: 'Transfer Registration Forms', checked: false, notes: '', required: true },
      { id: 'key_handover', label: 'Key Handover Protocol', checked: false, notes: '', required: true },
    ],
  },
];

export function DocumentChecklist() {
  const [categories, setCategories] = useState<ChecklistCategory[]>(initialCategories);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});

  const totalItems = categories.reduce((acc, cat) => acc + cat.items.length, 0);
  const checkedItems = categories.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.checked).length, 
    0
  );
  const progress = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
      };
    }));
  };

  const updateNotes = (categoryId: string, itemId: string, notes: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, notes } : item
        ),
      };
    }));
  };

  const addCustomItem = (categoryId: string) => {
    const text = newItemText[categoryId]?.trim();
    if (!text) return;

    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: [...cat.items, {
          id: `custom-${Date.now()}`,
          label: text,
          checked: false,
          notes: '',
          required: false,
        }],
      };
    }));
    setNewItemText(prev => ({ ...prev, [categoryId]: '' }));
  };

  const deleteItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.filter(item => item.id !== itemId),
      };
    }));
  };

  const resetAll = () => {
    setCategories(initialCategories);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          Document Checklist & Tracker
        </CardTitle>
        <CardDescription>
          Track all required documents for your property purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{checkedItems} of {totalItems} documents ready</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-3" />
          {progress === 100 && (
            <p className="text-sm text-semantic-green flex items-center gap-1">
              <Check className="h-4 w-4" />
              All documents collected! You're ready to proceed.
            </p>
          )}
        </div>

        {/* Categories */}
        <Accordion type="multiple" defaultValue={['personal']} className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryProgress = category.items.length > 0 
              ? (category.items.filter(i => i.checked).length / category.items.length) * 100 
              : 0;

            return (
              <AccordionItem key={category.id} value={category.id} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span>{category.label}</span>
                    <span className="text-sm text-muted-foreground">
                      ({category.items.filter(i => i.checked).length}/{category.items.length})
                    </span>
                    {categoryProgress === 100 && (
                      <Check className="h-4 w-4 text-semantic-green" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pb-4">
                  {category.items.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 rounded-lg border transition-all ${
                        item.checked ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={item.id}
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(category.id, item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <Label 
                            htmlFor={item.id} 
                            className={`cursor-pointer ${item.checked ? 'line-through text-muted-foreground' : ''}`}
                          >
                            {item.label}
                            {item.required && <span className="text-primary ml-1">*</span>}
                          </Label>
                          <Input
                            placeholder="Add notes..."
                            value={item.notes}
                            onChange={(e) => updateNotes(category.id, item.id, e.target.value)}
                            className="h-8 text-sm"
                          />
                        </div>
                        {item.id.startsWith('custom-') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => deleteItem(category.id, item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add custom item */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      placeholder="Add custom item..."
                      value={newItemText[category.id] || ''}
                      onChange={(e) => setNewItemText(prev => ({ ...prev, [category.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && addCustomItem(category.id)}
                      className="h-9"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => addCustomItem(category.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        <div className="flex justify-between items-center pt-4">
          <p className="text-sm text-muted-foreground">
            <span className="text-primary">*</span> Required documents
          </p>
          <Button variant="outline" onClick={resetAll}>
            Reset All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
