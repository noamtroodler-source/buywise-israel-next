import { useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        // Don't reveal if email exists or not for security
        if (error.message.includes('rate limit')) {
          toast.error('Too many requests. Please try again in a few minutes.');
        } else {
          // Show success even if email doesn't exist (security best practice)
          setEmailSent(true);
          setSentToEmail(data.email);
        }
      } else {
        setEmailSent(true);
        setSentToEmail(data.email);
        toast.success('Password reset email sent!');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center space-y-2 pb-2">
            {emailSent ? (
              <>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
                <CardDescription className="text-muted-foreground">
                  We've sent a password reset link to <strong>{sentToEmail}</strong>
                </CardDescription>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                <CardDescription className="text-muted-foreground">
                  No worries! Enter your email and we'll send you a reset link.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          <CardContent className="pt-4">
            {emailSent ? (
              <div className="space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong>Didn't receive the email?</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Check your spam or junk folder</li>
                    <li>Make sure you entered the correct email</li>
                    <li>Wait a few minutes for the email to arrive</li>
                  </ul>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setEmailSent(false);
                    form.reset();
                  }}
                >
                  Try another email
                </Button>
                
                <div className="text-center">
                  <Link 
                    to="/auth" 
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="email" 
                              placeholder="you@example.com" 
                              className="pr-10"
                              {...field} 
                            />
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                  
                  <div className="text-center pt-2">
                    <Link 
                      to="/auth" 
                      className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Back to sign in
                    </Link>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
