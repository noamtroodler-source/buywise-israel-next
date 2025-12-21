import { useState } from 'react';
import { Bell, X, Mail, MessageSquare, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PropertyFilters, AlertFrequency, ListingType } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  listingType: ListingType;
}

const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string; description: string }[] = [
  { value: 'instant', label: 'Instant', description: 'Get notified immediately when new listings match' },
  { value: 'daily', label: 'Daily', description: 'Receive a daily digest of new listings' },
  { value: 'weekly', label: 'Weekly', description: 'Get a weekly summary of new listings' },
];

function formatFilterValue(key: string, value: any): string {
  if (key === 'min_price' || key === 'max_price') {
    return `₪${value.toLocaleString()}`;
  }
  if (key === 'min_rooms' || key === 'max_rooms') {
    return `${value}+ rooms`;
  }
  if (key === 'min_bathrooms') {
    return `${value}+ baths`;
  }
  if (key === 'property_type') {
    return value.replace(/_/g, ' ');
  }
  if (key === 'features' && Array.isArray(value)) {
    return value.join(', ');
  }
  if (key === 'condition' && Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}

export function CreateAlertDialog({ open, onOpenChange, filters, listingType }: CreateAlertDialogProps) {
  const { user } = useAuth();
  const [alertName, setAlertName] = useState('');
  const [frequency, setFrequency] = useState<AlertFrequency>('daily');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === 'listing_status' || key === 'sort_by') return false;
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  });

  const needsPhone = notifyWhatsapp || notifySms;

  const handleCreateAlert = async () => {
    if (!user) {
      toast.error('Please sign in to create alerts');
      return;
    }

    if (needsPhone && !phone) {
      toast.error('Please enter your phone number for WhatsApp/SMS notifications');
      return;
    }

    if (!notifyEmail && !notifyWhatsapp && !notifySms) {
      toast.error('Please select at least one notification method');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('search_alerts').insert({
        user_id: user.id,
        name: alertName || null,
        filters: filters as any,
        listing_type: listingType,
        frequency,
        notify_email: notifyEmail,
        notify_whatsapp: notifyWhatsapp,
        notify_sms: notifySms,
        phone: needsPhone ? phone : null,
      });

      if (error) throw error;

      toast.success('Alert created! You\'ll be notified when new listings match your criteria.');
      onOpenChange(false);
      
      // Reset form
      setAlertName('');
      setFrequency('daily');
      setNotifyEmail(true);
      setNotifyWhatsapp(false);
      setNotifySms(false);
      setPhone('');
    } catch (error: any) {
      toast.error('Failed to create alert: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const listingTypeLabel = listingType === 'for_sale' ? 'Resell Properties' : 
                           listingType === 'for_rent' ? 'Long-term Rentals' : 'New Projects';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Create Search Alert
          </DialogTitle>
          <DialogDescription>
            Get notified when new {listingTypeLabel.toLowerCase()} match your search criteria.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alert Name */}
          <div className="space-y-2">
            <Label htmlFor="alert-name">Alert Name (optional)</Label>
            <Input
              id="alert-name"
              placeholder="e.g., Tel Aviv 3-bedroom apartments"
              value={alertName}
              onChange={(e) => setAlertName(e.target.value)}
            />
          </div>

          {/* Active Filters Display */}
          <div className="space-y-2">
            <Label>Your Filters</Label>
            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{listingTypeLabel}</Badge>
                {activeFilters.map(([key, value]) => (
                  <Badge key={key} variant="outline">
                    {formatFilterValue(key, value)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No filters applied. You'll be notified about all new {listingTypeLabel.toLowerCase()}.
              </p>
            )}
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <Label>How often?</Label>
            <RadioGroup value={frequency} onValueChange={(v) => setFrequency(v as AlertFrequency)}>
              {FREQUENCY_OPTIONS.map(option => (
                <div key={option.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Notification Methods */}
          <div className="space-y-3">
            <Label>Notify me via</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-email"
                  checked={notifyEmail}
                  onCheckedChange={(checked) => setNotifyEmail(!!checked)}
                />
                <Label htmlFor="notify-email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-whatsapp"
                  checked={notifyWhatsapp}
                  onCheckedChange={(checked) => setNotifyWhatsapp(!!checked)}
                />
                <Label htmlFor="notify-whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="notify-sms"
                  checked={notifySms}
                  onCheckedChange={(checked) => setNotifySms(!!checked)}
                />
                <Label htmlFor="notify-sms" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  SMS
                </Label>
              </div>
            </div>
          </div>

          {/* Phone Input */}
          {needsPhone && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+972 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required for WhatsApp and SMS notifications
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Alert'}
            </Button>
          </div>

          {!user && (
            <p className="text-sm text-center text-muted-foreground">
              You'll need to sign in to create alerts.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}