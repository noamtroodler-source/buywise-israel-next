import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { Building2, Send } from 'lucide-react';

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email').max(255),
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  phone: z.string().trim().max(30).optional(),
  message: z.string().trim().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EnterpriseSalesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'agency' | 'developer';
}

export function EnterpriseSalesDialog({ open, onOpenChange, entityType }: EnterpriseSalesDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
      company_name: '',
      phone: '',
      message: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('enterprise_inquiries' as any).insert({
        name: values.name,
        email: values.email,
        company_name: values.company_name,
        entity_type: entityType,
        phone: values.phone || null,
        message: values.message || null,
        user_id: user?.id || null,
      } as any);
      if (error) throw error;

      // Fire-and-forget admin notification email
      supabase.functions.invoke('enterprise-inquiry-notify', {
        body: {
          name: values.name,
          email: values.email,
          company_name: values.company_name,
          entity_type: entityType,
          phone: values.phone || null,
          message: values.message || null,
        },
      }).catch(() => {/* silent – notification failure must not block the user */});

      toast.success('Your inquiry has been submitted! Our team will reach out soon.');
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>Contact Enterprise Sales</DialogTitle>
              <DialogDescription>
                Tell us about your needs and we'll create a custom plan.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="John Doe" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="john@company.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input id="company_name" placeholder="Acme Real Estate" {...register('company_name')} />
            {errors.company_name && <p className="text-xs text-destructive">{errors.company_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity_type">Type</Label>
            <Input id="entity_type" value={entityType === 'agency' ? 'Agency' : 'Developer'} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea id="message" placeholder="Tell us about your requirements..." rows={3} {...register('message')} />
            {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
          </div>

          <Button type="submit" disabled={submitting} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
