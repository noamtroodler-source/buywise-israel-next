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
import { PasswordStrengthInput } from '@/components/auth/PasswordStrengthInput';
import { toast } from 'sonner';
import { Shield, Loader2, Mail } from 'lucide-react';

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
      if (justSignedUp && !buyerProfile) {
        setShowOnboarding(true);
      } else if (!showOnboarding) {
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
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-md py-16">
        <Card className="shadow-lg border-border/50">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Welcome to BuyWise Israel</CardTitle>
            <CardDescription className="text-muted-foreground">
              {activeTab === 'signup' 
                ? 'Create your account to start your property journey' 
                : 'Sign in to access your saved properties'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <TabsContent value="signup" className="mt-0 space-y-4">
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
                        <p className="text-xs text-muted-foreground">We'll never share your email with anyone.</p>
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
                          <PasswordStrengthInput
                            value={field.value}
                            onChange={field.onChange}
                            showRequirements={activeTab === 'signup'}
                            showStrengthMeter={activeTab === 'signup'}
                            id="password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={isSubmitting}
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Please wait...
                      </>
                    ) : activeTab === 'signup' ? (
                      'Create Account'
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  {activeTab === 'signup' && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      <Shield className="inline h-3 w-3 mr-1" />
                      Your data is encrypted and securely stored
                    </p>
                  )}
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