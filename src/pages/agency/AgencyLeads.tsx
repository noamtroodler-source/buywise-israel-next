import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  ArrowLeft, Loader2, MessageSquare, User, Mail, Phone, Home, 
  Filter, Search, Check, Clock, UserCheck, X, ExternalLink
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMyAgency, useAgencyTeam } from '@/hooks/useAgencyManagement';
import { useAgencyLeads, useUpdateLeadStatus, useReassignLead } from '@/hooks/useAgencyLeads';
import { cn } from '@/lib/utils';

const statusConfig = {
  new: { label: 'New', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  contacted: { label: 'Contacted', icon: Phone, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  qualified: { label: 'Qualified', icon: UserCheck, color: 'bg-green-500/10 text-green-600 border-green-200' },
  closed: { label: 'Closed', icon: Check, color: 'bg-muted text-muted-foreground border-border' },
};

export default function AgencyLeads() {
  const { data: agency, isLoading: agencyLoading } = useMyAgency();
  const { data: team = [] } = useAgencyTeam(agency?.id);
  const { data: leads = [], isLoading: leadsLoading } = useAgencyLeads(agency?.id);
  const updateStatus = useUpdateLeadStatus();
  const reassignLead = useReassignLead();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');

  if (agencyLoading || leadsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!agency) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold mb-2">No Agency Found</h1>
          <p className="text-muted-foreground mb-6">You need to have an agency to view leads.</p>
          <Button asChild>
            <Link to="/agency/register">Register Agency</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        lead.name?.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.property?.title?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;

    // Agent filter
    if (agentFilter !== 'all' && lead.assigned_to !== agentFilter) return false;

    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleStatusChange = (leadId: string, newStatus: string) => {
    updateStatus.mutate({ leadId, status: newStatus });
  };

  const handleReassign = (leadId: string, newAgentId: string) => {
    reassignLead.mutate({ leadId, agentId: newAgentId });
  };

  // Stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
  };

  return (
    <Layout>
      <div className="container py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild className="rounded-xl">
                <Link to="/agency">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Agency Leads</h1>
                <p className="text-muted-foreground">Manage all inquiries across your team</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Leads', value: stats.total, icon: MessageSquare },
              { label: 'New', value: stats.new, icon: Clock, highlight: stats.new > 0 },
              { label: 'Contacted', value: stats.contacted, icon: Phone },
              { label: 'Qualified', value: stats.qualified, icon: UserCheck },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={cn(
                  "rounded-2xl border-primary/10",
                  stat.highlight && "bg-primary/5 border-primary/20"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl",
                        stat.highlight ? "bg-primary/20" : "bg-primary/10"
                      )}>
                        <stat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <Card className="rounded-2xl border-primary/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, phone, or property..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={agentFilter} onValueChange={setAgentFilter}>
                  <SelectTrigger className="w-[180px] rounded-xl">
                    <SelectValue placeholder="Agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {team.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Leads List */}
          <Card className="rounded-2xl border-primary/10">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent rounded-t-2xl">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Leads ({filteredLeads.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">No leads found</p>
                  <p className="text-sm">
                    {leads.length === 0 
                      ? "Leads will appear here when clients inquire about properties"
                      : "Try adjusting your filters"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredLeads.map((lead, index) => {
                    const status = statusConfig[lead.status as keyof typeof statusConfig] || statusConfig.new;
                    const assignedAgent = team.find(a => a.id === lead.assigned_to);
                    
                    return (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "p-4 hover:bg-muted/30 transition-colors",
                          lead.status === 'new' && !lead.is_read && "bg-primary/5"
                        )}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Lead Info */}
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <Avatar className="h-10 w-10 rounded-xl">
                              <AvatarFallback className="bg-primary/10 text-primary rounded-xl">
                                {getInitials(lead.name || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium">{lead.name || 'Unknown'}</p>
                                <Badge 
                                  variant="outline" 
                                  className={cn("text-xs", status.color)}
                                >
                                  <status.icon className="h-3 w-3 mr-1" />
                                  {status.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                                {lead.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {lead.email}
                                  </span>
                                )}
                                {lead.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.phone}
                                  </span>
                                )}
                              </div>
                              {lead.message && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                                  {lead.message}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Property */}
                          {lead.property && (
                            <div className="flex items-center gap-2 lg:w-48">
                              <Home className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <Link 
                                to={`/property/${lead.property_id}`}
                                className="text-sm truncate hover:text-primary transition-colors"
                              >
                                {lead.property.title}
                              </Link>
                            </div>
                          )}

                          {/* Assigned Agent */}
                          <div className="lg:w-32">
                            <Select
                              value={lead.assigned_to || ''}
                              onValueChange={(value) => handleReassign(lead.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs rounded-lg">
                                <SelectValue placeholder="Assign">
                                  {assignedAgent?.name?.split(' ')[0] || 'Unassigned'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {team.map((agent) => (
                                  <SelectItem key={agent.id} value={agent.id}>
                                    {agent.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Status Actions */}
                          <div className="flex items-center gap-2 lg:w-32">
                            <Select
                              value={lead.status || 'new'}
                              onValueChange={(value) => handleStatusChange(lead.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Date */}
                          <div className="text-xs text-muted-foreground lg:w-20 text-right">
                            {format(new Date(lead.created_at), 'MMM d')}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
