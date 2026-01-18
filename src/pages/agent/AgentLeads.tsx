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
  ChevronLeft,
  ExternalLink,
  Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  useAgentLeads,
  useUpdateLeadStatus,
  useUpdateLeadNotes,
  useMarkLeadAsRead,
  useLeadStats,
  type LeadStatus,
  type Lead,
} from "@/hooks/useAgentLeads";

const statusConfig: Record<LeadStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-500", icon: <MessageSquare className="h-4 w-4" /> },
  contacted: { label: "Contacted", color: "bg-yellow-500", icon: <Phone className="h-4 w-4" /> },
  qualified: { label: "Qualified", color: "bg-green-500", icon: <UserCheck className="h-4 w-4" /> },
  closed: { label: "Closed", color: "bg-muted", icon: <CheckCircle className="h-4 w-4" /> },
};

const inquiryTypeIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-green-600" />,
  call: <Phone className="h-4 w-4 text-blue-600" />,
  email: <Mail className="h-4 w-4 text-orange-600" />,
  form: <Mail className="h-4 w-4 text-purple-600" />,
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
      <Card className={`transition-all ${!lead.is_read ? 'border-primary border-2' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Lead Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {inquiryTypeIcons[lead.inquiry_type] || <MessageSquare className="h-4 w-4" />}
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
                  <span className="text-green-600">
                    • Contacted {formatDistanceToNow(new Date(lead.contacted_at), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>

            {/* Property Preview */}
            {lead.property && (
              <Link 
                to={`/properties/${lead.property.id}`}
                className="hidden sm:flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors max-w-[200px]"
              >
                {lead.property.images?.[0] ? (
                  <img 
                    src={lead.property.images[0]} 
                    alt={lead.property.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
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
                variant="secondary" 
                className={`${statusConfig[lead.status as LeadStatus]?.color || 'bg-muted'} text-white`}
              >
                {statusConfig[lead.status as LeadStatus]?.label || lead.status}
              </Badge>

              <div className="flex items-center gap-1">
                {lead.phone && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={getWhatsAppLink() || '#'} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="h-4 w-4 text-green-600" />
                    </a>
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
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
            <div className="mt-3 p-2 rounded bg-muted/50 text-sm">
              <p className="text-muted-foreground font-medium text-xs mb-1">Notes:</p>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Dialog */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead Notes</DialogTitle>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotesOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotes}>
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
      <div className="container py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/agent">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Lead Management</h1>
            <p className="text-muted-foreground">
              Track and manage inquiries from potential buyers
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
              <p className="text-sm text-muted-foreground">Total Leads</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats?.new || 0}</p>
              <p className="text-sm text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{stats?.contacted || 0}</p>
              <p className="text-sm text-muted-foreground">Contacted</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats?.qualified || 0}</p>
              <p className="text-sm text-muted-foreground">Qualified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-muted-foreground">{stats?.closed || 0}</p>
              <p className="text-sm text-muted-foreground">Closed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs & Leads List */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LeadStatus | 'all')}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="new">
              New {stats?.new ? `(${stats.new})` : ''}
            </TabsTrigger>
            <TabsTrigger value="contacted">Contacted</TabsTrigger>
            <TabsTrigger value="qualified">Qualified</TabsTrigger>
            <TabsTrigger value="closed">Closed</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Loading leads...
                </CardContent>
              </Card>
            ) : leads?.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No leads yet</p>
                  <p className="text-sm">
                    Inquiries from your property listings will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              leads?.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
