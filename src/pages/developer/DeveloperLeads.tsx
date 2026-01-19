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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

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
      <div className="min-h-screen relative">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-primary/3 rounded-full blur-3xl -z-10" />

        <div className="container py-8 max-w-4xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* Back Button */}
            <motion.div variants={itemVariants}>
              <Button variant="ghost" asChild className="rounded-xl hover:bg-primary/5 -ml-2">
                <Link to="/developer">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
            </motion.div>

            {/* Premium Header */}
            <motion.div variants={itemVariants}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_50%)]" />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                      <MessageSquare className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">Buyer Inquiries</h1>
                      <p className="text-muted-foreground">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                      className="rounded-xl"
                    >
                      All ({inquiries.length})
                    </Button>
                    <Button
                      variant={filter === 'unread' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('unread')}
                      className="rounded-xl"
                    >
                      Unread ({unreadCount})
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>

            {filteredInquiries.length === 0 ? (
              <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-primary/10">
                  <CardContent className="py-12 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                    </div>
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
              </motion.div>
            ) : (
              <div className="space-y-4">
                {filteredInquiries.map((inquiry, index) => (
                  <motion.div
                    key={inquiry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`rounded-2xl transition-all ${
                        !inquiry.is_read 
                          ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-transparent' 
                          : 'border-primary/10 hover:border-primary/20'
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              <span className="font-semibold text-primary text-lg">
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
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-primary/20 hover:bg-primary/5"
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
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-xl bg-muted/30">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span>Interested in: <strong className="text-foreground">{inquiry.project.name}</strong> ({inquiry.project.city})</span>
                        </div>

                        {/* Preferences */}
                        {(inquiry.preferred_unit_type || inquiry.budget_range) && (
                          <div className="flex flex-wrap gap-2">
                            {inquiry.preferred_unit_type && (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-lg">
                                {inquiry.preferred_unit_type}
                              </Badge>
                            )}
                            {inquiry.budget_range && (
                              <Badge variant="outline" className="rounded-lg">
                                {inquiry.budget_range}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Message */}
                        <p className="text-sm bg-muted/30 p-4 rounded-xl">{inquiry.message}</p>

                        {/* Contact Actions */}
                        <div className="flex flex-wrap gap-2 pt-2">
                          <Button variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                            <a href={`mailto:${inquiry.email}`}>
                              <Mail className="h-4 w-4 mr-2 text-primary" />
                              {inquiry.email}
                            </a>
                          </Button>
                          {inquiry.phone && (
                            <Button variant="outline" size="sm" asChild className="rounded-xl border-primary/20 hover:bg-primary/5">
                              <a href={`tel:${inquiry.phone}`}>
                                <Phone className="h-4 w-4 mr-2 text-primary" />
                                {inquiry.phone}
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </Layout>
  );
}
