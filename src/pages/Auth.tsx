import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
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
import { PostSignupSuggestions } from '@/components/onboarding/PostSignupSuggestions';
import { PasswordStrengthInput } from '@/components/auth/PasswordStrengthInput';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield, Loader2, Mail, User, Building2, Landmark, Bell, Calculator, Heart, Scale, type LucideIcon } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

// Intent-based messaging configuration for context-aware auth
const intentConfig: Record<string, { signupDesc: string; signinDesc: string; icon: LucideIcon }> = {
  create_alert: {
    signupDesc: "Create an account to set up search alerts and get notified when new listings match your criteria",
    signinDesc: "Sign in to create search alerts",
    icon: Bell,
  },
  save_calculation: {
    signupDesc: "Create an account to save your calculations and access them on any device",
    signinDesc: "Sign in to access your saved calculations",
    icon: Calculator,
  },
  enable_price_alerts: {
    signupDesc: "Create an account to enable price alerts and get notified when prices drop",
    signinDesc: "Sign in to manage your price alerts",
    icon: Bell,
  },
  save_favorite: {
    signupDesc: "Create an account to save your favorites and sync them across devices",
    signinDesc: "Sign in to access your saved properties",
    icon: Heart,
  },
  view_profile: {
    signupDesc: "Create your account to set up your buyer profile and get personalized estimates",
    signinDesc: "Sign in to access your profile",
    icon: User,
  },
  compare_properties: {
    signupDesc: "Create an account to save and compare properties side by side",
    signinDesc: "Sign in to compare your saved properties",
    icon: Scale,
  },
  set_profile: {
    signupDesc: "Create an account to personalize your cost estimates based on your buyer status",
    signinDesc: "Sign in to update your profile",
    icon: User,
  },
};

type ProfessionalRole = 'agent' | 'agency' | 'developer' | null;

const roleConfig = {
  agent: {
    icon: User,
    title: "Join as a Real Estate Agent",
    description: "Create your account to start listing properties and connecting with buyers",
    redirectTo: "/agent/register",
    buttonText: "Create Agent Account",
  },
  agency: {
    icon: Building2,
    title: "Register Your Agency",
    description: "Create your admin account to set up your real estate agency",
    redirectTo: "/agency/register",
    buttonText: "Create Agency Account",
  },
  developer: {
    icon: Landmark,
    title: "Join as a Property Developer",
    description: "Create your account to showcase your development projects",
    redirectTo: "/developer/register",
    buttonText: "Create Developer Account",
  },
  default: {
    icon: Shield,
    title: "Welcome to BuyWise Israel",
    description: "Create your account to start your property journey",
    redirectTo: "/",
    buttonText: "Create Account",
  },
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, loading } = useAuth();
  const { data: buyerProfile, isLoading: profileLoading } = useBuyerProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'signup' ? 'signup' : 'signin');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sync activeTab with URL parameter changes (for header button clicks)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const newTab = tabParam === 'signup' ? 'signup' : 'signin';
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [searchParams]);
  const [showPostSignupSuggestions, setShowPostSignupSuggestions] = useState(false);
  const [justSignedUp, setJustSignedUp] = useState(false);
  
  // Get professional role, invite code, and intent from URL params
  const roleParam = searchParams.get('role') as ProfessionalRole;
  const inviteCode = searchParams.get('code');
  const intentParam = searchParams.get('intent');
  const isProfessionalSignup = roleParam && ['agent', 'agency', 'developer'].includes(roleParam);
  const config = isProfessionalSignup ? roleConfig[roleParam] : roleConfig.default;
  
  // Get intent-specific info for context-aware messaging
  const intentInfo = intentParam ? intentConfig[intentParam] : null;
  
  // Use intent icon if available and not a professional signup, otherwise use config icon
  const IconComponent = (!isProfessionalSignup && intentInfo?.icon) ? intentInfo.icon : config.icon;

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  // Handle already logged-in users with professional role
  useEffect(() => {
    if (user && !loading && isProfessionalSignup) {
      // Already logged in and trying to register as professional - go directly to registration
      const redirectUrl = inviteCode 
        ? `${config.redirectTo}?code=${encodeURIComponent(inviteCode)}`
        : config.redirectTo;
      navigate(redirectUrl);
      return;
    }
  }, [user, loading, isProfessionalSignup, config.redirectTo, navigate, inviteCode]);

  // Track if we've already sent welcome email to prevent duplicates
  const welcomeEmailSentRef = useRef(false);

  useEffect(() => {
    if (user && !loading && !profileLoading) {
      // If professional signup, redirect to registration page
      if (isProfessionalSignup) {
        const redirectUrl = inviteCode 
          ? `${config.redirectTo}?code=${encodeURIComponent(inviteCode)}`
          : config.redirectTo;
        navigate(redirectUrl);
        return;
      }
      
      // Regular buyer flow - detect new users (no buyer profile) regardless of signup method
      // This works for both email signup AND Google OAuth
      if (!buyerProfile && !isProfessionalSignup) {
        // Send welcome email for new buyer signups (only once)
        if (!welcomeEmailSentRef.current) {
          welcomeEmailSentRef.current = true;
          const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';
          supabase.functions.invoke('send-welcome-email', {
            body: { email: user.email, name: userName, userType: 'buyer' }
          }).catch((err) => console.error('Failed to send welcome email:', err));
        }
        setShowOnboarding(true);
      } else if (!showOnboarding && !showPostSignupSuggestions) {
        navigate('/');
      }
    }
  }, [user, loading, profileLoading, buyerProfile, showOnboarding, showPostSignupSuggestions, navigate, isProfessionalSignup, config.redirectTo, inviteCode]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    toast.success('Welcome to BuyWise Israel!');
    // Show post-signup suggestions after onboarding
    setShowPostSignupSuggestions(true);
  };

  const handlePostSignupClose = () => {
    setShowPostSignupSuggestions(false);
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
          if (isProfessionalSignup) {
            toast.success('Account created! Redirecting to complete your registration...');
          } else {
            toast.success('Account created successfully!');
          }
        }
      } else {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          toast.error('Invalid email or password');
        } else {
          toast.success('Welcome back!');
          // If signing in with professional role, redirect to registration
          if (isProfessionalSignup) {
            navigate(config.redirectTo);
          } else {
            navigate('/');
          }
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
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {activeTab === 'signup' 
                ? (intentInfo?.signupDesc || config.description)
                : isProfessionalSignup 
                  ? 'Sign in to continue your registration'
                  : (intentInfo?.signinDesc || 'Sign in to access your saved properties')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {/* Google Sign-In Button */}
            <div className="mb-6">
              <GoogleSignInButton roleParam={roleParam} inviteCode={inviteCode} />
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or continue with email</span>
                </div>
              </div>
            </div>

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
                      config.buttonText
                    ) : (
                      'Sign In'
                    )}
                    </Button>

                    {activeTab === 'signin' && (
                      <div className="text-center pt-2">
                        <Link 
                          to="/forgot-password" 
                          className="text-sm text-primary hover:underline"
                        >
                          Forgot your password?
                        </Link>
                      </div>
                    )}

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
      
      {/* Only show buyer onboarding for non-professional signups */}
      {!isProfessionalSignup && (
        <>
          <BuyerOnboarding 
            open={showOnboarding} 
            onComplete={handleOnboardingComplete} 
          />
          
          <PostSignupSuggestions
            open={showPostSignupSuggestions}
            onClose={handlePostSignupClose}
          />
        </>
      )}
    </Layout>
  );
}
