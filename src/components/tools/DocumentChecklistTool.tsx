import { useState, useMemo, useEffect } from 'react';
import { FileText, Download, ChevronDown, ChevronRight, MapPin, Clock, Info, Check, RotateCcw, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ToolLayout } from './shared/ToolLayout';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { ResultCard } from './shared/ResultCard';
import { useDocumentsByStage, DocumentChecklistItem } from '@/hooks/useDocumentChecklist';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { cn } from '@/lib/utils';

type TransactionType = 'buy' | 'rent';
type BuyerTypeFilter = 'all' | 'israeli' | 'oleh' | 'foreign';

const STAGE_CONFIG: Record<string, { label: string; description: string; icon: string }> = {
  // Purchase stages
  pre_approval: { label: 'Pre-Approval & ID', description: 'Documents for mortgage pre-approval', icon: '🔍' },
  pre_purchase: { label: 'Pre-Purchase Research', description: 'Documents to gather before signing', icon: '🔍' },
  contract_signing: { label: 'Contract & Due Diligence', description: 'When signing the purchase agreement', icon: '📝' },
  closing: { label: 'Closing & Financing', description: 'Completing the transaction', icon: '🏦' },
  post_purchase: { label: 'Post-Purchase', description: 'After receiving your keys', icon: '🔑' },
  // Rental stages
  rental_search: { label: 'Prepare Your Application', description: 'Documents landlords will request', icon: '📋' },
  rental_guarantor: { label: 'Guarantor Documents', description: 'Required in most Israeli rentals', icon: '🤝' },
  rental_contract: { label: 'Signing & Payment', description: 'Contract and move-in costs', icon: '✍️' },
  rental_movein: { label: 'Move-In Setup', description: 'Utilities and registration', icon: '🏠' },
};

const BUY_STAGE_ORDER = ['pre_approval', 'contract_signing', 'closing', 'post_purchase'];
const RENT_STAGE_ORDER = ['rental_search', 'rental_guarantor', 'rental_contract', 'rental_movein'];

const BUYER_TYPE_OPTIONS = [
  { value: 'all', label: 'All Documents', description: 'Show everything' },
  { value: 'israeli', label: 'Israeli Resident', description: 'Toshav Israel' },
  { value: 'oleh', label: 'Oleh Hadash', description: 'New immigrant' },
  { value: 'foreign', label: 'Foreign Buyer', description: 'Non-resident' },
];

const STORAGE_KEY = 'buywise-document-checklist';

interface StoredState {
  checkedItems: string[];
  buyerType: BuyerTypeFilter;
  transactionType: TransactionType;
}

export function DocumentChecklistTool() {
  const { data: documentsByStage, isLoading } = useDocumentsByStage();
  const { data: buyerProfile } = useBuyerProfile();

  // Load from localStorage
  const loadStoredState = (): StoredState => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return { checkedItems: [], buyerType: 'all', transactionType: 'buy' };
  };

  const [transactionType, setTransactionType] = useState<TransactionType>(() => loadStoredState().transactionType);
  const [buyerType, setBuyerType] = useState<BuyerTypeFilter>(() => loadStoredState().buyerType);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => new Set(loadStoredState().checkedItems));
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set(['pre_approval', 'rental_search']));

  // Save to localStorage
  useEffect(() => {
    const state: StoredState = {
      checkedItems: Array.from(checkedItems),
      buyerType,
      transactionType,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [checkedItems, buyerType, transactionType]);

  // Auto-set buyer type from profile
  useEffect(() => {
    if (buyerProfile && buyerType === 'all') {
      if (buyerProfile.residency_status === 'oleh_hadash') setBuyerType('oleh');
      else if (buyerProfile.residency_status === 'non_resident') setBuyerType('foreign');
      else if (buyerProfile.residency_status === 'israeli_resident') setBuyerType('israeli');
    }
  }, [buyerProfile]);

  // Filter documents based on buyer type
  const filterDocuments = (docs: DocumentChecklistItem[]) => {
    if (buyerType === 'all') return docs;
    return docs.filter(doc => {
      if (!doc.required_for || doc.required_for.length === 0) return true;
      if (doc.required_for.includes('all')) return true;
      return doc.required_for.includes(buyerType);
    });
  };

  // Calculate stats - filtered by transaction type
  const stats = useMemo(() => {
    if (!documentsByStage) return { total: 0, completed: 0, critical: 0, criticalCompleted: 0 };
    
    const relevantStages = transactionType === 'buy' ? BUY_STAGE_ORDER : RENT_STAGE_ORDER;
    const allDocs = relevantStages
      .filter(stage => documentsByStage[stage])
      .flatMap(stage => documentsByStage[stage]);
    
    const filteredDocs = allDocs.filter(doc => {
      if (buyerType === 'all') return true;
      if (!doc.required_for || doc.required_for.length === 0) return true;
      if (doc.required_for.includes('all')) return true;
      return doc.required_for.includes(buyerType);
    });
    
    const critical = filteredDocs.filter(d => d.is_critical);
    return {
      total: filteredDocs.length,
      completed: filteredDocs.filter(d => checkedItems.has(d.id)).length,
      critical: critical.length,
      criticalCompleted: critical.filter(d => checkedItems.has(d.id)).length,
    };
  }, [documentsByStage, checkedItems, buyerType, transactionType]);

  const progressPercent = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  const criticalPercent = stats.critical > 0 ? (stats.criticalCompleted / stats.critical) * 100 : 0;

  const toggleItem = (id: string) => {
    setCheckedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleStage = (stage: string) => {
    setExpandedStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stage)) newSet.delete(stage);
      else newSet.add(stage);
      return newSet;
    });
  };

  const resetProgress = () => {
    setCheckedItems(new Set());
  };

  const handlePrint = () => {
    const printContent = generatePrintContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePrintContent = () => {
    const stageOrder = transactionType === 'buy' ? BUY_STAGE_ORDER : RENT_STAGE_ORDER;
    const sortedStages = stageOrder.filter(stage => documentsByStage?.[stage]);
    const buyerLabel = BUYER_TYPE_OPTIONS.find(o => o.value === buyerType)?.label || 'All';

    let html = `<!DOCTYPE html><html><head><title>Document Checklist - BuyWise Israel</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; color: #1a1a1a; }
        h1 { font-size: 24px; margin-bottom: 8px; }
        .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
        .stage { margin-bottom: 32px; }
        .stage-title { font-size: 18px; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
        .stage-desc { color: #666; font-size: 14px; margin-bottom: 12px; }
        .doc { display: flex; gap: 12px; padding: 12px; margin: 8px 0; background: #f9f9f9; border-radius: 8px; border-left: 3px solid #ddd; }
        .doc.critical { border-left-color: #ef4444; }
        .doc.checked { background: #f0fdf4; border-left-color: #22c55e; }
        .checkbox { width: 18px; height: 18px; border: 2px solid #ccc; border-radius: 4px; flex-shrink: 0; }
        .checkbox.checked { background: #22c55e; border-color: #22c55e; }
        .doc-content { flex: 1; }
        .doc-name { font-weight: 500; }
        .doc-hebrew { color: #666; font-size: 14px; direction: rtl; }
        .doc-meta { font-size: 12px; color: #888; margin-top: 4px; }
        .badge { font-size: 11px; background: #fee2e2; color: #dc2626; padding: 2px 6px; border-radius: 4px; margin-left: 8px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <h1>📋 Israel Property Document Checklist</h1>
      <div class="meta">Buyer Type: ${buyerLabel} · Generated: ${new Date().toLocaleDateString()}</div>`;

    for (const stage of sortedStages) {
      const docs = filterDocuments(documentsByStage![stage]);
      if (docs.length === 0) continue;
      const config = STAGE_CONFIG[stage];

      html += `<div class="stage">
        <div class="stage-title">${config.icon} ${config.label}</div>
        <div class="stage-desc">${config.description}</div>`;

      for (const doc of docs) {
        const isChecked = checkedItems.has(doc.id);
        html += `<div class="doc ${doc.is_critical ? 'critical' : ''} ${isChecked ? 'checked' : ''}">
          <div class="checkbox ${isChecked ? 'checked' : ''}"></div>
          <div class="doc-content">
            <div class="doc-name">${doc.document_name_english}${doc.is_critical ? '<span class="badge">Required</span>' : ''}</div>
            ${doc.document_name_hebrew ? `<div class="doc-hebrew">${doc.document_name_hebrew} (${doc.transliteration || ''})</div>` : ''}
            <div class="doc-meta">
              ${doc.where_to_get ? `📍 ${doc.where_to_get}` : ''}
              ${doc.typical_timeline ? ` · ⏱ ${doc.typical_timeline}` : ''}
            </div>
          </div>
        </div>`;
      }
      html += '</div>';
    }

    return html + '</body></html>';
  };

  // Left column content
  const leftColumn = (
    <div className="space-y-6">
      {/* Transaction Type Toggle */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">What are you planning?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {(['buy', 'rent'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTransactionType(type)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  transactionType === type
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                )}
              >
                <span className="text-2xl mb-2 block">{type === 'buy' ? '🏠' : '🔑'}</span>
                <span className="font-medium">{type === 'buy' ? 'Buying' : 'Renting'}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {type === 'buy' ? 'Purchase documents' : 'Rental documents'}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Buyer Type Filter */}
      {transactionType === 'buy' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your buyer profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {BUYER_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBuyerType(option.value as BuyerTypeFilter)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    buyerType === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <span className="font-medium text-sm">{option.label}</span>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Stages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            </div>
          ) : (
            (transactionType === 'buy' ? BUY_STAGE_ORDER : RENT_STAGE_ORDER).filter(stage => documentsByStage?.[stage]).map((stage) => {
              const docs = filterDocuments(documentsByStage![stage]);
              if (docs.length === 0) return null;

              const config = STAGE_CONFIG[stage];
              const stageCompleted = docs.filter(d => checkedItems.has(d.id)).length;
              const isExpanded = expandedStages.has(stage);
              const isComplete = stageCompleted === docs.length;

              return (
                <Collapsible key={stage} open={isExpanded} onOpenChange={() => toggleStage(stage)}>
                  <CollapsibleTrigger asChild>
                    <div className={cn(
                      "flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors",
                      isComplete ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/30 hover:bg-muted/50"
                    )}>
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <span className="text-lg">{config.icon}</span>
                        <div>
                          <h3 className="font-medium text-sm">{config.label}</h3>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <Badge variant={isComplete ? 'default' : 'secondary'} className="shrink-0">
                        {stageCompleted}/{docs.length}
                      </Badge>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-2">
                    {docs.map((doc) => (
                      <DocumentItemRow
                        key={doc.id}
                        document={doc}
                        isChecked={checkedItems.has(doc.id)}
                        onToggle={() => toggleItem(doc.id)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Right column content
  const rightColumn = (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-primary">{Math.round(progressPercent)}%</div>
            <p className="text-sm text-muted-foreground">Complete</p>
          </div>
          <Progress value={progressPercent} className="h-3 mb-4" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{stats.completed} of {stats.total}</span>
            {progressPercent === 100 && (
              <span className="text-green-600 flex items-center gap-1">
                <Check className="h-4 w-4" /> All done!
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Documents */}
      <ResultCard
        label="Required Documents"
        value={`${stats.criticalCompleted}/${stats.critical}`}
        sublabel={criticalPercent === 100 ? "All critical docs ready" : "Must-have documents"}
        variant={criticalPercent === 100 ? "primary" : "default"}
        badge={criticalPercent === 100 ? { text: "Complete", variant: "success" } : undefined}
      />

      {/* Actions */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Button variant="outline" className="w-full gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print Checklist
          </Button>
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={resetProgress}>
            <RotateCcw className="h-4 w-4" />
            Reset Progress
          </Button>
        </CardContent>
      </Card>

      {/* Tips Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <h4 className="font-medium text-sm mb-2">💡 Pro Tips</h4>
          <ul className="text-xs text-muted-foreground space-y-2">
            <li>• Your progress saves automatically</li>
            <li>• Documents marked "Required" are essential</li>
            {transactionType === 'buy' ? (
              <>
                <li>• Ask your lawyer about timeline for each stage</li>
                <li>• Print this list for your meetings</li>
              </>
            ) : (
              <>
                <li>• Finding a guarantor is often the hardest part</li>
                <li>• Post-dated checks are standard in Israel</li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );

  const subtitle = transactionType === 'buy' 
    ? 'Track all documents needed for your Israel property purchase'
    : 'Track all documents needed for renting in Israel';

  return (
    <ToolLayout
      title="Document Checklist"
      subtitle={subtitle}
      icon={<FileText className="h-6 w-6" />}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      disclaimer={<ToolDisclaimer text="This checklist is for informational purposes. Requirements may vary by municipality and transaction type. Always consult with your lawyer." />}
    />
  );
}

// Document Item Component
interface DocumentItemRowProps {
  document: DocumentChecklistItem;
  isChecked: boolean;
  onToggle: () => void;
}

function DocumentItemRow({ document, isChecked, onToggle }: DocumentItemRowProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all ml-4",
        isChecked
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
          : "bg-background border-border hover:border-primary/30",
        document.is_critical && !isChecked && "border-l-4 border-l-destructive"
      )}
    >
      <Checkbox
        checked={isChecked}
        onCheckedChange={onToggle}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("font-medium text-sm", isChecked && "line-through text-muted-foreground")}>
            {document.document_name_english}
          </span>
          {document.is_critical && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Required</Badge>
          )}
        </div>

        {document.document_name_hebrew && (
          <p className="text-xs text-muted-foreground mt-0.5" dir="rtl">
            {document.document_name_hebrew}
            {document.transliteration && (
              <span className="text-[10px] ml-1" dir="ltr">({document.transliteration})</span>
            )}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-muted-foreground">
          {document.where_to_get && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  <MapPin className="h-3 w-3" />
                  {document.where_to_get.length > 25
                    ? document.where_to_get.slice(0, 25) + '...'
                    : document.where_to_get}
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">{document.where_to_get}</TooltipContent>
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
          <p className="text-[11px] text-muted-foreground mt-1.5 flex items-start gap-1">
            <Info className="h-3 w-3 mt-0.5 shrink-0" />
            {document.notes}
          </p>
        )}
      </div>
    </div>
  );
}
