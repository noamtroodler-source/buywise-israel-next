import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Check, 
  ChevronDown, 
  ChevronRight,
  Printer,
  RotateCcw,
  HelpCircle,
  Building2,
  Scale,
  Landmark,
  User,
  Clock,
  CheckCircle2,
  Sparkles,
  Shield,
  Calculator,
  ClipboardList,
  Home,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToolLayout } from './shared/ToolLayout';
import { ToolDisclaimer } from './shared/ToolDisclaimer';
import { InsightCard } from './shared/InsightCard';
import { CTACard } from './shared/CTACard';
import { ToolFeedback } from './shared/ToolFeedback';
import { SourceAttribution } from './shared/SourceAttribution';
import { useDocumentsByStage, DocumentChecklistItem } from '@/hooks/useDocumentChecklist';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STAGE_CONFIG: Record<string, {
  label: string;
  description: string;
  icon: typeof FileText;
  estimatedDays: string;
  transactionType: 'buy' | 'rent' | 'both';
}> = {
  // Purchase stages - matching actual database stage values
  'pre_approval': { label: 'Mortgage Pre-Approval', description: 'Bank requirements for financing', icon: Landmark, estimatedDays: '1-2 weeks', transactionType: 'buy' },
  'contract_signing': { label: 'Contract Signing', description: 'Legal documents for the purchase agreement', icon: Scale, estimatedDays: '1-2 weeks', transactionType: 'buy' },
  'closing': { label: 'Closing & Handover', description: 'Final documents for property transfer', icon: Home, estimatedDays: '1-2 weeks', transactionType: 'buy' },
  'post_purchase': { label: 'Post-Purchase', description: 'Documents needed after purchase completion', icon: ClipboardList, estimatedDays: '1-3 months', transactionType: 'buy' },
  // Rental stages - matching actual database stage values
  'rental_search': { label: 'Rental Search', description: 'Documents to prepare before viewing apartments', icon: MapPin, estimatedDays: '1 week', transactionType: 'rent' },
  'rental_guarantor': { label: 'Application & Guarantor', description: 'Documents required by landlords', icon: User, estimatedDays: '3-5 days', transactionType: 'rent' },
  'rental_contract': { label: 'Rental Contract', description: 'Lease agreement documents', icon: Scale, estimatedDays: '1-3 days', transactionType: 'rent' },
  'rental_movein': { label: 'Move-In', description: 'Final documents for moving in', icon: Home, estimatedDays: '1-2 days', transactionType: 'rent' }
};

const BUY_STAGE_ORDER = ['pre_approval', 'contract_signing', 'closing', 'post_purchase'];
const RENT_STAGE_ORDER = ['rental_search', 'rental_guarantor', 'rental_contract', 'rental_movein'];
const BUYER_TYPE_OPTIONS = [{ value: 'all', label: 'All Buyers' }, { value: 'israeli_resident', label: 'Israeli Resident' }, { value: 'oleh', label: 'Oleh Chadash' }, { value: 'foreign', label: 'Foreign Buyer' }];
const STORAGE_KEY = 'document-checklist-state';

type TransactionType = 'buy' | 'rent';
type BuyerTypeFilter = 'all' | 'israeli_resident' | 'oleh' | 'foreign';
interface StoredState { checkedItems: Record<string, boolean>; transactionType: TransactionType; buyerTypeFilter: BuyerTypeFilter; }

function getSourceIcon(whereToGet: string | null) {
  if (!whereToGet) return null;
  const lower = whereToGet.toLowerCase();
  if (lower.includes('bank') || lower.includes('mortgage')) return Landmark;
  if (lower.includes('lawyer') || lower.includes('attorney')) return Scale;
  if (lower.includes('government') || lower.includes('ministry') || lower.includes('tabu')) return Building2;
  return User;
}

function getEncouragementMessage(percent: number): string {
  if (percent === 0) return "Let's get started!";
  if (percent < 25) return "Great first steps!";
  if (percent < 50) return "Building momentum!";
  if (percent < 75) return "Over halfway there!";
  if (percent < 100) return "Almost complete!";
  return "All done! 🎉";
}

export function DocumentChecklistTool() {
  const { data: groupedDocuments, isLoading, error } = useDocumentsByStage();
  const { data: buyerProfile } = useBuyerProfile();
  const [transactionType, setTransactionType] = useState<TransactionType>('buy');
  const [buyerTypeFilter, setBuyerTypeFilter] = useState<BuyerTypeFilter>('all');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>({});
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { const parsed: StoredState = JSON.parse(saved); setCheckedItems(parsed.checkedItems || {}); setTransactionType(parsed.transactionType || 'buy'); setBuyerTypeFilter(parsed.buyerTypeFilter || 'all'); } catch (e) { console.error('Failed to parse saved checklist state', e); } }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ checkedItems, transactionType, buyerTypeFilter })); }, [checkedItems, transactionType, buyerTypeFilter]);

  useEffect(() => {
    if (buyerProfile && buyerTypeFilter === 'all') {
      const mapping: Record<string, BuyerTypeFilter> = { israeli_resident: 'israeli_resident', oleh: 'oleh', foreign_resident: 'foreign', non_resident: 'foreign' };
      const mapped = mapping[buyerProfile.residency_status];
      if (mapped) setBuyerTypeFilter(mapped);
    }
  }, [buyerProfile, buyerTypeFilter]);

  const filterDocuments = (docs: DocumentChecklistItem[]) => buyerTypeFilter === 'all' ? docs : docs.filter(doc => !doc.required_for || doc.required_for.length === 0 || doc.required_for.includes(buyerTypeFilter));
  const stageOrder = transactionType === 'buy' ? BUY_STAGE_ORDER : RENT_STAGE_ORDER;

  const stats = useMemo(() => {
    if (!groupedDocuments) return { total: 0, completed: 0, critical: 0, criticalCompleted: 0, currentStage: '', stageProgress: {} as Record<string, { total: number; completed: number }> };
    let total = 0, completed = 0, critical = 0, criticalCompleted = 0, currentStage = '';
    const stageProgress: Record<string, { total: number; completed: number }> = {};
    stageOrder.forEach(stage => {
      const filtered = filterDocuments(groupedDocuments[stage] || []);
      const stageCompleted = filtered.filter(doc => checkedItems[doc.id]).length;
      stageProgress[stage] = { total: filtered.length, completed: stageCompleted };
      total += filtered.length; completed += stageCompleted;
      filtered.forEach(doc => { if (doc.is_critical) { critical++; if (checkedItems[doc.id]) criticalCompleted++; } });
      if (!currentStage && stageCompleted < filtered.length && filtered.length > 0) currentStage = stage;
    });
    if (!currentStage && stageOrder.length > 0) currentStage = stageOrder[stageOrder.length - 1];
    return { total, completed, critical, criticalCompleted, currentStage, stageProgress };
  }, [groupedDocuments, checkedItems, buyerTypeFilter, stageOrder]);

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const toggleDocument = (docId: string) => {
    const newChecked = !checkedItems[docId];
    setCheckedItems(prev => ({ ...prev, [docId]: newChecked }));
    if (newChecked && groupedDocuments) {
      Object.entries(groupedDocuments).forEach(([stage, docs]) => {
        const filtered = filterDocuments(docs);
        if (filtered.every(doc => doc.id === docId ? true : checkedItems[doc.id]) && filtered.length > 0 && STAGE_CONFIG[stage]) {
          toast.success(`${STAGE_CONFIG[stage].label} complete!`, { description: 'Great progress!', duration: 3000 });
        }
      });
    }
    if (newChecked && stats.completed + 1 === stats.total && stats.total > 0) { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 3000); }
  };

  const toggleStage = (stage: string) => setExpandedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
  const markStageComplete = (stage: string) => { if (!groupedDocuments) return; const updates: Record<string, boolean> = {}; filterDocuments(groupedDocuments[stage] || []).forEach(doc => { updates[doc.id] = true; }); setCheckedItems(prev => ({ ...prev, ...updates })); toast.success(`All documents in ${STAGE_CONFIG[stage]?.label || stage} marked complete!`); };
  const resetChecklist = () => { setCheckedItems({}); toast.success('Checklist reset'); };
  const printChecklist = () => window.print();

  const getInsightText = () => {
    const buyerLabel = BUYER_TYPE_OPTIONS.find(o => o.value === buyerTypeFilter)?.label || 'buyer';
    if (progressPercent === 0) return transactionType === 'rent' ? `Starting your rental search? As ${buyerLabel === 'All Buyers' ? 'a renter' : `an ${buyerLabel}`}, prepare documents landlords typically request.` : `Ready to start? As ${buyerLabel === 'All Buyers' ? 'a buyer' : `an ${buyerLabel}`}, begin by gathering personal documents and getting mortgage pre-approval.`;
    if (progressPercent < 50) return `You're making progress! Focus on completing the ${STAGE_CONFIG[stats.currentStage]?.label || 'current stage'} documents next.`;
    if (progressPercent < 100) return `Excellent! You're ${progressPercent}% complete with just ${stats.total - stats.completed} document${stats.total - stats.completed === 1 ? '' : 's'} remaining.`;
    return `Congratulations! You have all your documents ready for your ${transactionType === 'buy' ? 'property purchase' : 'rental'}.`;
  };

  const getNextStep = () => { const sp = stats.stageProgress[stats.currentStage]; if (!sp) return 'Start your checklist'; const r = sp.total - sp.completed; return r === 0 ? 'Stage complete!' : `${r} doc${r === 1 ? '' : 's'} remaining`; };

  if (isLoading) return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-pulse text-muted-foreground">Loading checklist...</div></div>;
  if (error) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-destructive">Failed to load checklist.</div></div>;

  const leftColumn = (
    <div className="space-y-6">
      <Card><CardContent className="pt-6 space-y-4">
        <div><label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 block">Transaction Type</label>
          <Tabs value={transactionType} onValueChange={(v) => setTransactionType(v as TransactionType)}><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="buy" className="gap-2"><Home className="h-4 w-4" />Buying</TabsTrigger><TabsTrigger value="rent" className="gap-2"><MapPin className="h-4 w-4" />Renting</TabsTrigger></TabsList></Tabs>
        </div>
        <div><label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2 block flex items-center gap-1">Your Situation<TooltipProvider><Tooltip><TooltipTrigger><HelpCircle className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger><TooltipContent><p className="max-w-xs">Filter documents based on your residency status.</p></TooltipContent></Tooltip></TooltipProvider></label>
          <Select value={buyerTypeFilter} onValueChange={(v) => setBuyerTypeFilter(v as BuyerTypeFilter)}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{BUYER_TYPE_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select>
        </div>
      </CardContent></Card>

      <div className="space-y-4">
        {stageOrder.map((stage, stageIndex) => {
          const config = STAGE_CONFIG[stage]; if (!config) return null;
          const filteredDocs = filterDocuments(groupedDocuments?.[stage] || []); if (filteredDocs.length === 0) return null;
          const sp = stats.stageProgress[stage] || { total: 0, completed: 0 };
          const isComplete = sp.completed === sp.total && sp.total > 0;
          const isExpanded = expandedStages[stage] ?? (stage === stats.currentStage || stageIndex === 0);
          const StageIcon = config.icon;
          return (
            <Card key={stage} className={cn("transition-all duration-200", isComplete && "bg-primary/5 border-primary/20")}>
              <Collapsible open={isExpanded} onOpenChange={() => toggleStage(stage)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", isComplete ? "bg-primary/10" : "bg-muted")}><StageIcon className={cn("h-5 w-5", isComplete ? "text-primary" : "text-muted-foreground")} /></div>
                        <div><CardTitle className="text-base font-semibold flex items-center gap-2">{config.label}{isComplete && <CheckCircle2 className="h-4 w-4 text-primary" />}</CardTitle><p className="text-sm text-muted-foreground">{config.description}</p></div>
                      </div>
                      <div className="flex items-center gap-3"><Badge variant="outline" className="font-normal">{sp.completed}/{sp.total}</Badge>{isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}</div>
                    </div>
                    <div className="mt-3"><Progress value={sp.total > 0 ? (sp.completed / sp.total) * 100 : 0} className="h-1.5" /></div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent><CardContent className="pt-0 space-y-2">
                  {!isComplete && <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-primary" onClick={(e) => { e.stopPropagation(); markStageComplete(stage); }}><CheckCircle2 className="h-4 w-4 mr-2" />Mark all complete</Button>}
                  {filteredDocs.map(doc => <DocumentItemRow key={doc.id} doc={doc} isChecked={!!checkedItems[doc.id]} onToggle={() => toggleDocument(doc.id)} />)}
                  <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />Typically takes {config.estimatedDays}</div>
                </CardContent></CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const rightColumn = (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/5 via-background to-background p-6 relative">
          <AnimatePresence>{showCelebration && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"><div className="text-center"><Sparkles className="h-12 w-12 text-primary mx-auto mb-2" /><p className="text-xl font-bold text-primary">All Complete!</p><p className="text-muted-foreground">You're ready to go!</p></div></motion.div>}</AnimatePresence>
          <div className="text-center"><p className="text-sm font-medium text-muted-foreground mb-2">Overall Progress</p><motion.div key={progressPercent} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="text-5xl font-bold text-primary mb-1">{progressPercent}%</motion.div><p className="text-sm text-muted-foreground">{getEncouragementMessage(progressPercent)}</p><div className="mt-4"><Progress value={progressPercent} className="h-2" /></div></div>
        </div>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-foreground">{stats.completed}/{stats.total}</p><p className="text-xs text-muted-foreground">Documents Done</p></div>
            <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-2xl font-bold text-foreground">{stats.criticalCompleted}/{stats.critical}</p><p className="text-xs text-muted-foreground">Required Done</p></div>
            <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-sm font-semibold text-foreground truncate">{STAGE_CONFIG[stats.currentStage]?.label || 'Not started'}</p><p className="text-xs text-muted-foreground">Current Stage</p></div>
            <div className="text-center p-3 rounded-lg bg-muted/50"><p className="text-sm font-semibold text-foreground truncate">{getNextStep()}</p><p className="text-xs text-muted-foreground">Next Step</p></div>
          </div>
        </CardContent>
      </Card>

      <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" />Stage Progress</CardTitle></CardHeader>
        <CardContent className="pt-0"><div className="space-y-3">
          {stageOrder.map((stage, index) => { const config = STAGE_CONFIG[stage]; if (!config) return null; const filtered = filterDocuments(groupedDocuments?.[stage] || []); if (filtered.length === 0) return null; const sp = stats.stageProgress[stage] || { total: 0, completed: 0 }; const isComplete = sp.completed === sp.total; const isCurrent = stage === stats.currentStage;
            return (<div key={stage} className="flex items-center gap-3"><div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0", isComplete ? "bg-primary text-primary-foreground" : isCurrent ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground")}>{isComplete ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs font-medium">{index + 1}</span>}</div><div className="flex-1 min-w-0"><p className={cn("text-sm font-medium truncate", isComplete ? "text-primary" : isCurrent ? "text-foreground" : "text-muted-foreground")}>{config.label}</p></div><Badge variant="outline" className="shrink-0 text-xs">{sp.completed}/{sp.total}</Badge></div>);
          })}
        </div></CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5"><CardContent className="pt-4 pb-4"><div className="flex items-start gap-3"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-foreground mb-1">Curated for Israel</p><ul className="text-xs text-muted-foreground space-y-1"><li>• Hebrew document names included</li><li>• Where to get each document</li><li>• Typical processing times</li></ul></div></div></CardContent></Card>

      <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={printChecklist}><Printer className="h-4 w-4 mr-2" />Print</Button><Button variant="outline" className="flex-1" onClick={resetChecklist}><RotateCcw className="h-4 w-4 mr-2" />Reset</Button></div>
    </div>
  );

  const bottomSection = (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Collapsible><Card><CollapsibleTrigger asChild><CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><CardTitle className="text-sm font-medium flex items-center justify-between"><span className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-primary" />Understanding the Process</span><ChevronDown className="h-4 w-4 text-muted-foreground" /></CardTitle></CardHeader></CollapsibleTrigger><CollapsibleContent><CardContent className="pt-0 text-sm text-muted-foreground space-y-2"><p>The {transactionType === 'buy' ? 'property purchase' : 'rental'} process in Israel typically takes {transactionType === 'buy' ? '2-4 months' : '1-3 weeks'} from start to finish.</p><p>Having documents ready beforehand speeds up the process significantly.</p><p>Critical documents (marked with a border) should be prioritized.</p></CardContent></CollapsibleContent></Card></Collapsible>
        <Collapsible><Card><CollapsibleTrigger asChild><CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors"><CardTitle className="text-sm font-medium flex items-center justify-between"><span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Key Hebrew Terms</span><ChevronDown className="h-4 w-4 text-muted-foreground" /></CardTitle></CardHeader></CollapsibleTrigger><CollapsibleContent><CardContent className="pt-0 text-sm space-y-2"><div className="flex justify-between"><span className="text-muted-foreground">Nesach Tabu</span><span>Land Registry Extract</span></div><div className="flex justify-between"><span className="text-muted-foreground">Ishur Ikroni</span><span>Pre-Approval Letter</span></div><div className="flex justify-between"><span className="text-muted-foreground">Mas Rechisha</span><span>Purchase Tax</span></div><div className="flex justify-between"><span className="text-muted-foreground">Teudat Zehut</span><span>ID Card</span></div></CardContent></CollapsibleContent></Card></Collapsible>
      </div>
      <InsightCard insights={[getInsightText()]} />
      <div className="grid sm:grid-cols-3 gap-4">
        <CTACard title="True Cost Calculator" description="Calculate all costs including professional fees" icon={<Calculator className="h-5 w-5" />} buttonText="Calculate Costs" buttonLink="/tools?tool=true-cost" />
        <CTACard title="Mortgage Calculator" description="Plan your financing strategy" icon={<Landmark className="h-5 w-5" />} buttonText="Plan Financing" buttonLink="/tools?tool=mortgage" />
        <CTACard title="Explore Areas" description="Find the right neighborhood" icon={<MapPin className="h-5 w-5" />} buttonText="View Areas" buttonLink="/areas" />
      </div>
      <ToolFeedback toolName="Document Checklist" variant="inline" />
    </div>
  );

  return <ToolLayout title="Document Checklist" subtitle={`Track the documents you need for ${transactionType === 'buy' ? 'buying' : 'renting'} property in Israel`} icon={<FileText className="h-6 w-6" />} leftColumn={leftColumn} rightColumn={rightColumn} bottomSection={bottomSection} sourceAttribution={<SourceAttribution toolType="documents" />} disclaimer={<ToolDisclaimer />} />;
}

interface DocumentItemRowProps { doc: DocumentChecklistItem; isChecked: boolean; onToggle: () => void; }

function DocumentItemRow({ doc, isChecked, onToggle }: DocumentItemRowProps) {
  const SourceIcon = getSourceIcon(doc.where_to_get);
  return (
    <motion.div layout initial={false} animate={{ opacity: 1 }} className={cn("flex items-start gap-3 p-3 rounded-lg border transition-all duration-200", isChecked ? "bg-primary/5 border-primary/20" : doc.is_critical ? "border-l-4 border-l-primary border-t border-r border-b" : "border-border hover:border-primary/30")}>
      <Checkbox id={doc.id} checked={isChecked} onCheckedChange={onToggle} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <label htmlFor={doc.id} className={cn("text-sm font-medium cursor-pointer block", isChecked && "line-through text-muted-foreground")}>{doc.document_name_english}{doc.is_critical && !isChecked && <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/20">Required</Badge>}</label>
        {doc.document_name_hebrew && <p className="text-xs text-muted-foreground mt-0.5">{doc.document_name_hebrew}{doc.transliteration && ` (${doc.transliteration})`}</p>}
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">{doc.where_to_get && <span className="flex items-center gap-1">{SourceIcon && <SourceIcon className="h-3 w-3" />}{doc.where_to_get}</span>}{doc.typical_timeline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{doc.typical_timeline}</span>}</div>
        {doc.notes && <p className="text-xs text-muted-foreground mt-2 italic">{doc.notes}</p>}
      </div>
    </motion.div>
  );
}
