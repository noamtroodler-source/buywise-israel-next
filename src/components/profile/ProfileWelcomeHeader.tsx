import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Briefcase, ArrowRight, Loader2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProfileCompletionRing } from './ProfileCompletionRing';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useUpdateProfile } from '@/hooks/useProfile';

interface ProfileWelcomeHeaderProps {
  fullName: string | null;
  email: string | undefined;
  isAgent: boolean;
  isAdmin: boolean;
  onSignOut: () => void;
}

export function ProfileWelcomeHeader({ 
  fullName, 
  email, 
  isAgent, 
  isAdmin, 
  onSignOut,
}: ProfileWelcomeHeaderProps) {
  const navigate = useNavigate();
  const { percentage, nextIncomplete, insight, isLoading } = useProfileCompletion();
  const updateProfile = useUpdateProfile();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(fullName || '');

  const firstName = fullName?.split(' ')[0] || 'there';
  
  const handleSaveName = () => {
    if (editedName.trim()) {
      updateProfile.mutate({ full_name: editedName.trim() });
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(fullName || '');
    setIsEditingName(false);
  };
  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="space-y-4">
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

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-9 text-lg font-semibold max-w-[200px]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7" 
                  onClick={handleSaveName}
                  disabled={updateProfile.isPending}
                >
                  <Check className="h-4 w-4 text-primary" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7" 
                  onClick={handleCancelEdit}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ) : (
              <h1 className="text-2xl font-semibold text-foreground group flex items-center gap-1.5">
                Welcome back, {firstName}
                <button
                  onClick={() => setIsEditingName(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                  aria-label="Edit name"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </h1>
            )}
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground self-start sm:self-center">
          <LogOut className="h-4 w-4 mr-1.5" />
          Sign Out
        </Button>
      </div>

      {/* Progress Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-muted/40 border border-border">
        {isLoading ? (
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Loading profile...</span>
          </div>
        ) : (
          <>
            <ProfileCompletionRing percentage={percentage} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">Profile Setup</p>
              {percentage < 100 && nextIncomplete ? (
                <p className="text-sm text-muted-foreground">
                  Next step: {nextIncomplete.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All set! Your profile is complete.
                </p>
              )}
              {insight && (
                <p className="text-sm text-primary mt-1 font-medium">
                  {insight}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
