import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Check, Download, Filter, ChevronDown, ChevronRight, AlertCircle, MapPin, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDocumentsByStage, DocumentChecklistItem } from '@/hooks/useDocumentChecklist';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';

type BuyerTypeFilter = 'all' | 'israeli' | 'oleh' | 'foreign';

const STAGE_LABELS: Record<string, { label: string; description: string }> = {
  pre_purchase: { label: 'Pre-Purchase', description: 'Before signing a contract' },
  contract_signing: { label: 'Contract Signing', description: 'When signing the purchase agreement' },
  closing: { label: 'Closing', description: 'Completing the transaction' },
  post_purchase: { label: 'Post-Purchase', description: 'After receiving keys' },
};

const STAGE_ORDER = ['pre_purchase', 'contract_signing', 'closing', 'post_purchase'];

export function InteractiveDocumentChecklist() {
  const { data: documentsByStage, isLoading } = useDocumentsByStage();
  const { data: buyerProfile } = useBuyerProfile();
  
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['pre_purchase']));
  const [buyerTypeFilter, setBuyerTypeFilter] = useState<BuyerTypeFilter>('all');

  // Auto-set filter based on buyer profile
  const defaultFilter = useMemo(() => {
    if (!buyerProfile) return 'all';
    if (buyerProfile.residency_status === 'oleh_hadash') return 'oleh';
    if (buyerProfile.residency_status === 'non_resident') return 'foreign';
    return 'israeli';
  }, [buyerProfile]);

  // Filter documents based on buyer type
  const filterDocuments = (docs: DocumentChecklistItem[]) => {
    if (buyerTypeFilter === 'all') return docs;
    
    return docs.filter(doc => {
      if (!doc.required_for || doc.required_for.length === 0) return true;
      if (doc.required_for.includes('all')) return true;
      
      switch (buyerTypeFilter) {
        case 'israeli':
          return doc.required_for.includes('israeli') || doc.required_for.includes('all');
        case 'oleh':
          return doc.required_for.includes('oleh') || doc.required_for.includes('all');
        case 'foreign':
          return doc.required_for.includes('foreign') || doc.required_for.includes('all');
        default:
          return true;
      }
    });
  };

  // Calculate progress
  const totalDocuments = useMemo(() => {
    if (!documentsByStage) return 0;
    return Object.values(documentsByStage).flat().length;
  }, [documentsByStage]);

  const completedCount = checkedItems.size;
  const progressPercent = totalDocuments > 0 ? (completedCount / totalDocuments) * 100 : 0;

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) {
        newSet.delete(stage);
      } else {
        newSet.add(stage);
      }
      return newSet;
    });
  };

  const downloadPDF = () => {
    // Generate printable version
    const printContent = generatePrintableContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintableContent = () => {
    const sortedStages = STAGE_ORDER.filter(stage => documentsByStage?.[stage]);
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Document Checklist - BuyWise Israel</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          h2 { color: #2d3748; margin-top: 30px; }
          .stage { margin-bottom: 30px; }
          .document { display: flex; align-items: flex-start; margin: 15px 0; padding: 10px; background: #f7fafc; border-radius: 8px; }
          .checkbox { width: 20px; height: 20px; border: 2px solid #cbd5e0; margin-right: 15px; flex-shrink: 0; }
          .checked { background: #48bb78; border-color: #48bb78; }
          .hebrew { color: #718096; font-size: 14px; direction: rtl; }
          .critical { border-left: 3px solid #e53e3e; }
          .info { font-size: 12px; color: #718096; margin-top: 5px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>📋 Document Checklist for Israel Property Purchase</h1>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
        <p>Buyer Type: ${buyerTypeFilter === 'all' ? 'All Documents' : buyerTypeFilter.charAt(0).toUpperCase() + buyerTypeFilter.slice(1)}</p>
    `;

    for (const stage of sortedStages) {
      const docs = filterDocuments(documentsByStage![stage]);
      if (docs.length === 0) continue;

      const stageInfo = STAGE_LABELS[stage] || { label: stage, description: '' };
      html += `
        <div class="stage">
          <h2>${stageInfo.label}</h2>
          <p style="color: #718096; margin-top: -10px;">${stageInfo.description}</p>
      `;

      for (const doc of docs) {
        const isChecked = checkedItems.has(doc.id);
        html += `
          <div class="document ${doc.is_critical ? 'critical' : ''}">
            <div class="checkbox ${isChecked ? 'checked' : ''}"></div>
            <div>
              <strong>${doc.document_name_english}</strong>
              ${doc.document_name_hebrew ? `<div class="hebrew">${doc.document_name_hebrew} (${doc.transliteration || ''})</div>` : ''}
              ${doc.where_to_get ? `<div class="info">📍 ${doc.where_to_get}</div>` : ''}
              ${doc.typical_timeline ? `<div class="info">⏱️ ${doc.typical_timeline}</div>` : ''}
            </div>
          </div>
        `;
      }

      html += '</div>';
    }

    html += '</body></html>';
    return html;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document checklist...</p>
        </CardContent>
      </Card>
    );
  }

  const sortedStages = STAGE_ORDER.filter(stage => documentsByStage?.[stage]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Document Checklist
            </CardTitle>
            <CardDescription className="mt-1">
              Track all documents needed for your property purchase
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={downloadPDF} className="gap-2">
            <Download className="h-4 w-4" />
            Print/PDF
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedCount} of {totalDocuments} documents</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mt-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={buyerTypeFilter} onValueChange={(v) => setBuyerTypeFilter(v as BuyerTypeFilter)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by buyer type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Documents</SelectItem>
              <SelectItem value="israeli">Israeli Resident</SelectItem>
              <SelectItem value="oleh">Oleh Hadash</SelectItem>
              <SelectItem value="foreign">Foreign Buyer</SelectItem>
            </SelectContent>
          </Select>
          {buyerProfile && buyerTypeFilter === 'all' && (
            <Button variant="ghost" size="sm" onClick={() => setBuyerTypeFilter(defaultFilter as BuyerTypeFilter)}>
              Show for my profile
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {sortedStages.map((stage) => {
          const docs = filterDocuments(documentsByStage![stage]);
          if (docs.length === 0) return null;

          const stageInfo = STAGE_LABELS[stage] || { label: stage, description: '' };
          const stageCompleted = docs.filter(d => checkedItems.has(d.id)).length;
          const isExpanded = expandedStages.has(stage);

          return (
            <Collapsible key={stage} open={isExpanded} onOpenChange={() => toggleStage(stage)}>
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-semibold">{stageInfo.label}</h3>
                      <p className="text-sm text-muted-foreground">{stageInfo.description}</p>
                    </div>
                  </div>
                  <Badge variant={stageCompleted === docs.length ? 'default' : 'secondary'}>
                    {stageCompleted}/{docs.length}
                  </Badge>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4 mt-2 space-y-2"
                  >
                    {docs.map((doc) => (
                      <DocumentItem
                        key={doc.id}
                        document={doc}
                        isChecked={checkedItems.has(doc.id)}
                        onToggle={() => toggleItem(doc.id)}
                      />
                    ))}
                  </motion.div>
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}

interface DocumentItemProps {
  document: DocumentChecklistItem;
  isChecked: boolean;
  onToggle: () => void;
}

function DocumentItem({ document, isChecked, onToggle }: DocumentItemProps) {
  return (
    <motion.div
      layout
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isChecked ? 'bg-primary/5 border-primary/20' : 'bg-background border-border hover:border-primary/30'
      } ${document.is_critical ? 'border-l-4 border-l-destructive' : ''}`}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
            {document.document_name_english}
          </span>
          {document.is_critical && (
            <Badge variant="destructive" className="text-xs">Required</Badge>
          )}
        </div>
        
        {document.document_name_hebrew && (
          <p className="text-sm text-muted-foreground mt-1" dir="rtl">
            {document.document_name_hebrew}
            {document.transliteration && (
              <span className="text-xs ml-2" dir="ltr">({document.transliteration})</span>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
          {document.where_to_get && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  <MapPin className="h-3 w-3" />
                  {document.where_to_get.length > 30 
                    ? document.where_to_get.slice(0, 30) + '...' 
                    : document.where_to_get}
                </span>
              </TooltipTrigger>
              <TooltipContent>{document.where_to_get}</TooltipContent>
            </Tooltip>
          )}
          {document.typical_timeline && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {document.typical_timeline}
            </span>
          )}
        </div>

        {document.notes && (
          <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            {document.notes}
          </p>
        )}
      </div>
    </motion.div>
  );
}
