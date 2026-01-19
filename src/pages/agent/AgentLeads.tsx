import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Phone,
  Mail,
  Clock,
  MoreVertical,
  CheckCircle,
  UserCheck,
  XCircle,
  Home,
  ArrowLeft,
  ExternalLink,
  Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  useAgentLeads,
  useUpdateLeadStatus,
  useUpdateLeadNotes,
  useMarkLeadAsRead,
  useLeadStats,
  type LeadStatus,
  type Lead,
} from "@/hooks/useAgentLeads";

const statusConfig: Record<LeadStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  new: { label: "New", variant: "default" },
  contacted: { label: "Contacted", variant: "secondary" },
  qualified: { label: "Qualified", variant: "secondary" },
  closed: { label: "Closed", variant: "outline" },
};

function LeadCard({ lead, onStatusChange, onNotesChange }: { 
  lead: Lead; 
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onNotesChange: (leadId: string, notes: string) => void;
}) {
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState(lead.notes || "");
  const markAsRead = useMarkLeadAsRead();

  const handleOpenNotes = () => {
    if (!lead.is_read) {
      markAsRead.mutate(lead.id);
    }
    setIsNotesOpen(true);
  };

  const handleSaveNotes = () => {
    onNotesChange(lead.id, notes);
    setIsNotesOpen(false);
  };

  const getWhatsAppLink = () => {
    if (!lead.phone) return null;
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hi${lead.name ? ` ${lead.name}` : ''}, thank you for your interest in ${lead.property?.title || 'our property'}. I'd be happy to help you with any questions!`
    );
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  return (
    <>
      <Card className={`rounded-2xl transition-all ${!lead.is_read ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' : 'border-primary/10 hover:border-primary/20'}`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            {/* Lead Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-primary" />
                </div>
                <span className="font-medium truncate">{lead.name || "Anonymous"}</span>
                {!lead.is_read && (
                  <Badge variant="default" className="text-xs">New</Badge>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground space-y-1">
                {lead.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <a href={`mailto:${lead.email}`} className="hover:underline truncate">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <a href={`tel:${lead.phone}`} className="hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
              </div>

              {lead.message && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic">
                  "{lead.message}"
                </p>
              )}

              <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                {lead.contacted_at && (
                  <span className="text-primary">
                    • Contacted {formatDistanceToNow(new Date(lead.contacted_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            {/* Property Preview */}
            {lead.property && (
              <Link 
                to={`/properties/${lead.property.id}`}
                className="hidden sm:flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors max-w-[200px]"
              >
                {lead.property.images?.[0] ? (
                  <img 
                    src={lead.property.images[0]} 
                    alt={lead.property.title}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <Home className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{lead.property.title}</p>
                  <p className="text-xs text-muted-foreground">{lead.property.city}</p>
                </div>
              </Link>
            )}

            {/* Status & Actions */}
            <div className="flex flex-col items-end gap-2">
              <Badge 
                variant={statusConfig[lead.status as LeadStatus]?.variant || 'secondary'}
                className="bg-primary/10 text-primary border-0"
              >
                {statusConfig[lead.status as LeadStatus]?.label || lead.status}
              </Badge>

              <div className="flex items-center gap-1">
                {lead.phone && (
                  <Button size="sm" variant="outline" asChild className="rounded-lg border-primary/20">
                    <a href={getWhatsAppLink() || '#'} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </a>
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="rounded-lg">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'contacted')}>
                      <Phone className="h-4 w-4 mr-2" />
                      Mark as Contacted
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'qualified')}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Mark as Qualified
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(lead.id, 'closed')}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Mark as Closed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenNotes}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      {lead.notes ? 'Edit Notes' : 'Add Notes'}
                    </DropdownMenuItem>
                    {lead.property && (
                      <DropdownMenuItem asChild>
                        <Link to={`/properties/${lead.property.id}`}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Property
                        </Link>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {lead.notes && (
            <div className="mt-4 p-3 rounded-xl bg-muted/30 text-sm">
              <p className="text-muted-foreground font-medium text-xs mb-1">Notes:</p>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Lead Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
            rows={4}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleSaveNotes} className="rounded-xl">
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AgentLeads() {
  const [activeTab, setActiveTab] = useState<LeadStatus | 'all'>('all');
  const { data: leads, isLoading } = useAgentLeads(activeTab);
  const { data: stats } = useLeadStats();
  const updateStatus = useUpdateLeadStatus();
  const updateNotes = useUpdateLeadNotes();

  const handleStatusChange = (leadId: string, status: LeadStatus) => {
    updateStatus.mutate({ leadId, status });
  };

  const handleNotesChange = (leadId: string, notes: string) => {
    updateNotes.mutate({ leadId, notes });
  };

  return (
    <Layout>
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div>
              <Button variant="ghost" size="icon" asChild className="rounded-xl hover:bg-primary/10 mb-4">
                <Link to="/agent">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
                <div className="relative flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                    <MessageSquare className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Lead Management</h1>
                    <p className="text-muted-foreground">
                      Track and manage inquiries from potential buyers
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards - Primary blue palette */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="rounded-2xl border-primary/10">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Leads</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats?.new || 0}</p>
                  <p className="text-sm text-muted-foreground">New</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats?.contacted || 0}</p>
                  <p className="text-sm text-muted-foreground">Contacted</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{stats?.qualified || 0}</p>
                  <p className="text-sm text-muted-foreground">Qualified</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-primary/10">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-muted-foreground">{stats?.closed || 0}</p>
                  <p className="text-sm text-muted-foreground">Closed</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs & Leads List */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeadStatus | 'all')}>
              <TabsList className="mb-4 bg-muted/50 border border-border/50 rounded-xl p-1">
                <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
                <TabsTrigger value="new" className="rounded-lg">
                  New {stats?.new ? `(${stats.new})` : ''}
                </TabsTrigger>
                <TabsTrigger value="contacted" className="rounded-lg">Contacted</TabsTrigger>
                <TabsTrigger value="qualified" className="rounded-lg">Qualified</TabsTrigger>
                <TabsTrigger value="closed" className="rounded-lg">Closed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4">
                {isLoading ? (
                  <Card className="rounded-2xl">
                    <CardContent className="p-8 text-center text-muted-foreground">
                      Loading leads...
                    </CardContent>
                  </Card>
                ) : leads?.length === 0 ? (
                  <Card className="rounded-2xl border-primary/10">
                    <CardContent className="p-8 text-center">
                      <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                      <p className="font-medium">No leads yet</p>
                      <p className="text-sm text-muted-foreground">
                        Inquiries from your property listings will appear here
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  leads?.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <LeadCard
                        lead={lead}
                        onStatusChange={handleStatusChange}
                        onNotesChange={handleNotesChange}
                      />
                    </motion.div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
