import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { BuyerOnboarding } from '@/components/onboarding/BuyerOnboarding';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { data: buyerProfile, isLoading: profileLoading } = useBuyerProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'signin');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  useEffect(() => {
    if (user && !loading && !profileLoading) {
      // If user just signed up and has no buyer profile, show onboarding
      if (justSignedUp && !buyerProfile) {
        setShowOnboarding(true);
      } else if (!showOnboarding) {
        // Otherwise redirect to home
        navigate('/');
      }
    }
  }, [user, loading, profileLoading, buyerProfile, justSignedUp, showOnboarding, navigate]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    toast.success('Welcome to BuyWise Israel!');
    navigate('/');
  };

  const handleSubmit = async (data: AuthFormData) => {
    setIsSubmitting(true);
    try {
      if (activeTab === 'signup') {
        const { error } = await signUp(data.email, data.password, data.fullName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please sign in instead.');
          } else {
            toast.error(error.message);
          }
        } else {
          setJustSignedUp(true);
          toast.success('Account created successfully!');
        }
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          toast.error('Invalid email or password');
        } else {
          toast.success('Welcome back!');
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Layout><div className="flex items-center justify-center min-h-[60vh]">Loading...</div></Layout>;
  }

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to BuyWise Israel</CardTitle>
            <CardDescription>Sign in or create an account to save properties</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 mt-6">
                  <TabsContent value="signup" className="mt-0">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Please wait...' : activeTab === 'signup' ? 'Create Account' : 'Sign In'}
                  </Button>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <BuyerOnboarding 
        open={showOnboarding} 
        onComplete={handleOnboardingComplete} 
      />
    </Layout>
  );
}