import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Shield, Briefcase, ArrowRight, Loader2, Pencil, Check, X, Play, Building2, Hammer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ProgressRing } from '@/components/ui/progress-ring';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useUpdateProfile } from '@/hooks/useProfile';
import { useBuyerProfile } from '@/hooks/useBuyerProfile';
import { BuyerOnboarding } from '@/components/onboarding/BuyerOnboarding';

interface ProfileWelcomeHeaderProps {
  fullName: string | null;
  email: string | undefined;
  isAgent: boolean;
  isAdmin: boolean;
  isAgencyAdmin?: boolean;
  agencyName?: string;
  isDeveloper?: boolean;
  developerName?: string;
  onSignOut: () => void;
}

const PURPOSE_LABELS: Record<string, string> = {
  primary_residence: 'Primary Residence',
  investment: 'Investment Property',
  vacation: 'Vacation Home',
  rental: 'Rental Investment',
};

const RESIDENCY_BADGES: Record<string, string> = {
  oleh_hadash: 'Oleh Hadash',
  non_resident: 'Foreign Resident',
  israeli_resident: 'Israeli Resident',
};

export function ProfileWelcomeHeader({
  fullName,
  email,
  isAgent,
  isAdmin,
  isAgencyAdmin,
  agencyName,
  isDeveloper,
  developerName,
  onSignOut,
}: ProfileWelcomeHeaderProps) {
  const navigate = useNavigate();
  const { percentage, insight, isLoading } = useProfileCompletion();
  const updateProfile = useUpdateProfile();
  const { data: buyerProfile } = useBuyerProfile();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(fullName || '');
  const [showOnboarding, setShowOnboarding] = useState(false);

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
    ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : email?.[0]?.toUpperCase() || 'U';

  // Buyer-type badges
  const badges: string[] = [];
  if (buyerProfile) {
    if (buyerProfile.is_first_property) badges.push('First-Time Buyer');
    const residencyLabel = RESIDENCY_BADGES[buyerProfile.residency_status];
    if (residencyLabel && buyerProfile.residency_status !== 'israeli_resident') badges.push(residencyLabel);
    if (buyerProfile.is_upgrading) badges.push('Upgrader');
  }

  const purposeLabel = buyerProfile?.purchase_purpose ? PURPOSE_LABELS[buyerProfile.purchase_purpose] : null;

  // Role banners
  const banners = [
    isAgencyAdmin && {
      icon: <Building2 className="h-3.5 w-3.5" />,
      label: agencyName || 'Your Agency',
      action: () => navigate('/agency'),
      actionLabel: 'Agency Dashboard',
    },
    isDeveloper && {
      icon: <Hammer className="h-3.5 w-3.5" />,
      label: developerName || 'Your Company',
      action: () => navigate('/developer'),
      actionLabel: 'Developer Dashboard',
    },
    (isAgent || isAdmin) && {
      icon: isAdmin ? <Shield className="h-3.5 w-3.5" /> : <Briefcase className="h-3.5 w-3.5" />,
      label: isAdmin ? 'Admin' : 'Agent',
      action: () => navigate(isAdmin ? '/admin' : '/agent'),
      actionLabel: 'Dashboard',
    },
  ].filter(Boolean) as Array<{ icon: React.ReactNode; label: string; action: () => void; actionLabel: string }>;

  return (
    <div className="space-y-3">
      {/* Role banners */}
      {banners.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {banners.map((banner, i) => (
            <button
              key={i}
              onClick={banner.action}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/15 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              {banner.icon}
              {banner.label}
              <ArrowRight className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}

      {/* Main Header */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left: Avatar + Name + Badges */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-base">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="h-8 text-base font-semibold max-w-[180px]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveName} disabled={updateProfile.isPending}>
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCancelEdit}>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <h1 className="text-lg font-semibold text-foreground group flex items-center gap-1.5 truncate">
                  Welcome, {firstName}
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-muted rounded shrink-0"
                    aria-label="Edit name"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                </h1>
              )}
              <p className="text-xs text-muted-foreground truncate">{email}</p>

              {/* Buyer badges + search snapshot */}
              {(badges.length > 0 || purposeLabel) && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  {badges.map((b) => (
                    <Badge key={b} variant="secondary" className="text-[10px] px-2 py-0 h-5 font-medium">
                      {b}
                    </Badge>
                  ))}
                  {purposeLabel && (
                    <span className="text-[11px] text-muted-foreground">
                      · Looking for: {purposeLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Progress Ring + Sign Out */}
          <div className="flex items-center gap-4 shrink-0">
            {!isLoading ? (
              <ProgressRing value={percentage} size={48} strokeWidth={4} />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            <Button variant="ghost" size="sm" onClick={onSignOut} className="text-muted-foreground h-8 px-2.5">
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Insight pill */}
      {insight && (
        <p className="text-xs font-medium text-primary bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
          {insight}
        </p>
      )}

      {/* Resume Setup Prompt */}
      {buyerProfile && !buyerProfile.onboarding_completed && buyerProfile.onboarding_step && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Play className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Pick up where you left off</p>
            <p className="text-xs text-muted-foreground">
              Step {buyerProfile.onboarding_step} of 7 — finish for personalized insights
            </p>
          </div>
          <Button size="sm" onClick={() => setShowOnboarding(true)} className="shrink-0 h-8">
            Resume
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Onboarding Dialog */}
      <BuyerOnboarding
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        onClose={() => setShowOnboarding(false)}
        existingProfile={buyerProfile}
      />
    </div>
  );
}
