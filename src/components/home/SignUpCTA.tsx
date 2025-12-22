import { motion } from 'framer-motion';
import { Heart, Bell, TrendingUp, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const benefits = [
  { icon: Heart, label: 'Save Favorites' },
  { icon: Bell, label: 'Get Alerts' },
  { icon: TrendingUp, label: 'Track Market' },
  { icon: GitCompare, label: 'Compare Properties' },
];

export const SignUpCTA = () => {
  const { user } = useAuth();

  // Don't show if user is already logged in
  if (user) return null;

  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 md:p-12 text-center"
        >
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground">
              Join BuyWise Israel — It's Free
            </h2>
            <p className="text-lg text-primary-foreground/80">
              Create your free account and unlock powerful tools to find your perfect property
            </p>

            {/* Benefits */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 pt-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20"
                >
                  <benefit.icon className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm font-medium text-primary-foreground">{benefit.label}</span>
                </motion.div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-base font-semibold px-8"
              >
                <Link to="/auth">Create Free Account</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto text-base text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link to="/tools">Explore Tools</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
