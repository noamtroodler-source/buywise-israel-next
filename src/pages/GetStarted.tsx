import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Briefcase, 
  Building2, 
  HardHat, 
  ArrowRight, 
  Search,
  Home,
  TrendingUp,
  Users,
  Shield,
  Star,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  features: string[];
  cta: string;
  route: string;
  gradient: string;
  badge?: string;
}

const roles: RoleOption[] = [
  {
    id: 'buyer',
    title: 'Property Buyer',
    description: 'Find your perfect property in Israel with personalized recommendations and market insights.',
    icon: Search,
    features: [
      'Browse thousands of listings',
      'Save favorites & get alerts',
      'Calculate costs & taxes',
      'Expert buying guides',
    ],
    cta: 'Start Browsing',
    route: '/listings',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'agent',
    title: 'Real Estate Agent',
    description: 'Grow your real estate business with powerful listing tools and lead management.',
    icon: Briefcase,
    features: [
      'List unlimited properties',
      'Manage leads & inquiries',
      'Performance analytics',
      'Verified agent badge',
    ],
    cta: 'Register as Agent',
    route: '/agent/register',
    gradient: 'from-primary to-blue-600',
    badge: 'Most Popular',
  },
  {
    id: 'agency',
    title: 'Real Estate Agency',
    description: 'Manage your team of agents with enterprise tools and centralized analytics.',
    icon: Building2,
    features: [
      'Team management dashboard',
      'Agent invite system',
      'Agency-wide analytics',
      'Brand page & listings',
    ],
    cta: 'Register Agency',
    route: '/agency/register',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'developer',
    title: 'Property Developer',
    description: 'Showcase your new construction projects to thousands of qualified buyers.',
    icon: HardHat,
    features: [
      'Project showcase pages',
      'Floor plans & galleries',
      'Lead capture forms',
      'Construction updates',
    ],
    cta: 'Register Developer',
    route: '/developer/register',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const stats = [
  { icon: Home, label: 'Active Listings', value: '2,500+' },
  { icon: Users, label: 'Happy Buyers', value: '10,000+' },
  { icon: Shield, label: 'Verified Agents', value: '500+' },
  { icon: Star, label: 'Average Rating', value: '4.8/5' },
];

export default function GetStarted() {
  const navigate = useNavigate();
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
          <div className="container relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <Badge variant="secondary" className="mb-4">
                <TrendingUp className="h-3 w-3 mr-1" />
                Israel's #1 Property Platform
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                How Can We Help You Today?
              </h1>
              <p className="text-lg text-muted-foreground">
                Whether you're buying your dream home or growing your real estate business, 
                we have the tools and resources you need to succeed.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="text-center p-4 rounded-xl bg-card border"
                >
                  <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Role Selection Cards */}
        <section className="py-12 md:py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {roles.map((role, index) => {
                const Icon = role.icon;
                const isHovered = hoveredRole === role.id;

                return (
                  <motion.div
                    key={role.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    onMouseEnter={() => setHoveredRole(role.id)}
                    onMouseLeave={() => setHoveredRole(null)}
                  >
                    <Card className={`h-full transition-all duration-300 cursor-pointer group ${
                      isHovered ? 'shadow-xl border-primary/50 scale-[1.02]' : 'hover:shadow-lg'
                    }`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${role.gradient} text-white`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          {role.badge && (
                            <Badge className="bg-primary/10 text-primary border-primary/20">
                              {role.badge}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mt-4">{role.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {role.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-2">
                          {role.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="w-full group/btn"
                          variant={role.id === 'agent' ? 'default' : 'outline'}
                          onClick={() => navigate(role.route)}
                        >
                          {role.cta}
                          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 bg-muted/30">
          <div className="container max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Is it free to browse properties?',
                  a: 'Yes! Browsing properties, saving favorites, and using our calculators is completely free for all users.',
                },
                {
                  q: 'How do I become a verified agent?',
                  a: 'Register as an agent, provide your license number, and our team will verify your credentials within 24-48 hours.',
                },
                {
                  q: 'Can I list properties without an agency?',
                  a: 'Yes, individual agents can register and list properties independently. You can also join an agency later.',
                },
                {
                  q: 'What\'s included in the agency plan?',
                  a: 'Agency accounts include team management, invite codes, centralized analytics, and a public agency profile page.',
                },
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 rounded-xl bg-card border"
                >
                  <h3 className="font-semibold mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
