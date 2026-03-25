import { useState } from 'react';
import { Settings, Pencil, Loader2, RotateCcw, Check, Globe, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useContentVisits } from '@/hooks/useContentVisits';
import { DeleteAccountDialog } from '../DeleteAccountDialog';
import { COUNTRY_OPTIONS, REFERRAL_OPTIONS } from '@/lib/constants/signupOptions';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function AccountSection() {
  const { data: profile, isLoading } = useProfile();
  const { isAgent, isDeveloper } = useUserRole();
  const updateProfile = useUpdateProfile();
  const { clearHistory, visitedPaths } = useContentVisits();
  const [isEditing, setIsEditing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  
  const hasProfessionalRole = isAgent || isDeveloper;
  
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phone: profile?.phone || '',
    country: profile?.country || '',
    referralSource: profile?.referral_source || '',
  });

  const handleClearHistory = async () => {
    setIsClearing(true);
    try {
      await clearHistory();
    } catch {
      toast.error('Failed to clear history');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate({
      full_name: formData.fullName || null,
      phone: formData.phone || null,
      country: formData.country || null,
      referral_source: formData.referralSource || null,
    });
    setIsEditing(false);
  };

  const isComplete = !!(profile?.full_name && profile?.phone);

  const getCountryLabel = (value: string | null) => {
    if (!value) return 'Not set';
    return COUNTRY_OPTIONS.find(o => o.value === value)?.label || value;
  };

  const getReferralLabel = (value: string | null) => {
    if (!value) return 'Not set';
    return REFERRAL_OPTIONS.find(o => o.value === value)?.label || value;
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] p-4">
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Account Settings</h3>
            <p className="text-xs text-muted-foreground">{profile?.full_name || 'Not set'}</p>
          </div>
        </div>
        {isComplete && (
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-primary" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Your full name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+972..." className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Country</Label>
              <Select value={formData.country} onValueChange={(val) => setFormData({ ...formData, country: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">How did you hear about us?</Label>
              <Select value={formData.referralSource} onValueChange={(val) => setFormData({ ...formData, referralSource: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Let us know" />
                </SelectTrigger>
                <SelectContent>
                  {REFERRAL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateProfile.isPending} className="flex-1">
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                <p className="text-sm font-medium">{profile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Phone</p>
                <p className="text-sm font-medium">{profile?.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Country</p>
                <p className="text-sm font-medium">{getCountryLabel(profile?.country ?? null)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Heard About Us</p>
                <p className="text-sm font-medium">{getReferralLabel(profile?.referral_source ?? null)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Member Since</p>
                <p className="text-sm font-medium">
                  {profile?.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Unknown'}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => {
              setFormData({
                fullName: profile?.full_name || '',
                phone: profile?.phone || '',
                country: profile?.country || '',
                referralSource: profile?.referral_source || '',
              });
              setIsEditing(true);
            }} className="w-full">
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit Account
            </Button>

            {visitedPaths.size > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearHistory} disabled={isClearing}
                className="w-full text-muted-foreground hover:text-foreground">
                {isClearing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                Clear Browsing History
              </Button>
            )}

            <DeleteAccountDialog hasProfessionalRole={hasProfessionalRole} />
          </div>
        )}
      </div>
    </div>
  );
}
