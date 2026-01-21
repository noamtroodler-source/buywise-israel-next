import { useState } from 'react';
import { User, Mail, MessageCircle, Calendar, Edit3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { BuyerProfileCard } from './BuyerProfileCard';
import { MortgagePreferencesCard } from './MortgagePreferencesCard';

export function ProfileTabSettings() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  const handleEdit = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateProfile.mutate(formData, {
      onSuccess: () => setIsEditing(false),
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-base font-medium">Profile Information</CardTitle>
          {!isEditing && (
            <Button variant="ghost" size="sm" onClick={handleEdit} className="h-8">
              <Edit3 className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={updateProfile.isPending}>
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <User className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-medium text-sm text-foreground truncate">
                    {profile?.full_name || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium text-sm text-foreground truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <MessageCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">WhatsApp</p>
                  <p className="font-medium text-sm text-foreground truncate">
                    {profile?.phone || 'Not set'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="font-medium text-sm text-foreground">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buyer Profile */}
      <BuyerProfileCard />

      {/* Mortgage Preferences */}
      <MortgagePreferencesCard />
    </div>
  );
}
