import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Mail, Phone, MessageSquare, Building2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDeveloperProfile } from '@/hooks/useDeveloperProfile';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface ProjectInquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  preferred_unit_type: string | null;
  budget_range: string | null;
  is_read: boolean | null;
  created_at: string;
  project: {
    id: string;
    name: string;
    city: string;
  };
}

export default function DeveloperLeads() {
  const queryClient = useQueryClient();
  const { data: developer } = useDeveloperProfile();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['developer-inquiries', developer?.id],
    queryFn: async () => {
      if (!developer) return [];
      
      const { data, error } = await supabase
        .from('project_inquiries')
        .select(`
          *,
          project:projects(id, name, city)
        `)
        .eq('developer_id', developer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as ProjectInquiry[];
    },
    enabled: !!developer,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (inquiryId: string) => {
      const { error } = await supabase
        .from('project_inquiries')
        .update({ is_read: true })
        .eq('id', inquiryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['developer-inquiries'] });
    },
  });

  const filteredInquiries = filter === 'unread' 
    ? inquiries.filter(i => !i.is_read)
    : inquiries;

  const unreadCount = inquiries.filter(i => !i.is_read).length;

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Button variant="ghost" asChild className="mb-2">
                <Link to="/developer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Buyer Inquiries</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({inquiries.length})
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </Button>
            </div>
          </div>

          {filteredInquiries.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  {filter === 'unread' ? 'No unread inquiries' : 'No inquiries yet'}
                </h3>
                <p className="text-muted-foreground">
                  {filter === 'unread' 
                    ? 'All inquiries have been read'
                    : 'Inquiries from interested buyers will appear here'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredInquiries.map((inquiry) => (
                <Card 
                  key={inquiry.id} 
                  className={!inquiry.is_read ? 'border-primary/50 bg-primary/5' : ''}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="font-semibold text-primary">
                            {inquiry.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {inquiry.name}
                            {!inquiry.is_read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      
                      {!inquiry.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            markAsReadMutation.mutate(inquiry.id);
                            toast.success('Marked as read');
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Project Info */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4" />
                      <span>Interested in: <strong className="text-foreground">{inquiry.project.name}</strong> ({inquiry.project.city})</span>
                    </div>

                    {/* Preferences */}
                    {(inquiry.preferred_unit_type || inquiry.budget_range) && (
                      <div className="flex flex-wrap gap-2">
                        {inquiry.preferred_unit_type && (
                          <Badge variant="secondary">{inquiry.preferred_unit_type}</Badge>
                        )}
                        {inquiry.budget_range && (
                          <Badge variant="outline">{inquiry.budget_range}</Badge>
                        )}
                      </div>
                    )}

                    {/* Message */}
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{inquiry.message}</p>

                    {/* Contact Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`mailto:${inquiry.email}`}>
                          <Mail className="h-4 w-4 mr-2" />
                          {inquiry.email}
                        </a>
                      </Button>
                      {inquiry.phone && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={`tel:${inquiry.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            {inquiry.phone}
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
