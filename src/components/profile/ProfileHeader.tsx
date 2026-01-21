import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Shield, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProfileHeaderProps {
  fullName: string | null;
  email: string | undefined;
  isAgent: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
  onTabChange?: (tab: string) => void;
}

export function ProfileHeader({ 
  fullName, 
  email, 
  isAgent, 
  isAdmin, 
  onSignOut,
}: ProfileHeaderProps) {
  const navigate = useNavigate();

  const firstName = fullName?.split(' ')[0] || 'there';
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Agent/Admin Banner */}
      {(isAgent || isAdmin) && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <Shield className="h-4 w-4 text-primary" />
            ) : (
              <Briefcase className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-medium text-foreground">
              {isAdmin ? 'Admin Account' : 'Agent Account'}
            </span>
          </div>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => navigate(isAdmin ? '/admin' : '/agent')}
            className="h-7 text-xs"
          >
            Dashboard
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}

      {/* User Info Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Welcome back, {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4 mr-1.5" />
          Sign Out
        </Button>
      </div>
    </motion.div>
  );
}
