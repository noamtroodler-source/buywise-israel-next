import { useState } from 'react';
import { Settings, Pencil, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileSection } from '../ProfileSection';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useContentVisits } from '@/hooks/useContentVisits';
import { DeleteAccountDialog } from '../DeleteAccountDialog';
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
    });
    setIsEditing(false);
  };

  const isComplete = !!(profile?.full_name && profile?.phone);

  if (isLoading) {
    return (
      <ProfileSection
        title="Account Settings"
        icon={<Settings className="h-5 w-5" />}
        status="neutral"
        defaultOpen={false}
      >
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </ProfileSection>
    );
  }

  return (
    <ProfileSection
      title="Account Settings"
      icon={<Settings className="h-5 w-5" />}
      status={isComplete ? 'complete' : 'neutral'}
      statusText={profile?.full_name || 'Not set'}
      defaultOpen={false}
    >
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Full Name</Label>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Your full name"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Phone Number</Label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+972..."
              className="mt-1"
            />
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={updateProfile.isPending} 
              className="flex-1"
            >
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
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Member Since</p>
              <p className="text-sm font-medium">
                {profile?.created_at 
                  ? format(new Date(profile.created_at), 'MMMM yyyy') 
                  : 'Unknown'}
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setFormData({
                fullName: profile?.full_name || '',
                phone: profile?.phone || '',
              });
              setIsEditing(true);
            }}
            className="w-full"
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit Account
          </Button>

          {visitedPaths.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              disabled={isClearing}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              {isClearing ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Clear Browsing History
            </Button>
          )}

          <DeleteAccountDialog hasProfessionalRole={hasProfessionalRole} />
        </div>
      )}
    </ProfileSection>
  );
}
