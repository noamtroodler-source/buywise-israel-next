import { useState } from 'react';
import { Bell, Mail, MessageSquare, Phone, Zap, Clock, Calendar, Sparkles, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PropertyFilters, AlertFrequency, ListingType } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { getUserFriendlyError } from '@/utils/userFriendlyErrors';

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: PropertyFilters;
  listingType: ListingType;
}

const FREQUENCY_OPTIONS: { value: AlertFrequency; label: string; icon: React.ReactNode }[] = [
  { value: 'instant', label: 'Instant', icon: <Zap className="h-5 w-5" /> },
  { value: 'daily', label: 'Daily', icon: <Clock className="h-5 w-5" /> },
  { value: 'weekly', label: 'Weekly', icon: <Calendar className="h-5 w-5" /> },
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
  if (key === 'city') {
    return value;
  }
  if (key === 'features' && Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}

export function CreateAlertDialog({ open, onOpenChange, filters, listingType }: CreateAlertDialogProps) {
  const { user } = useAuth();
  const [frequency, setFrequency] = useState<AlertFrequency>('weekly');
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [notifySms, setNotifySms] = useState(false);
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic match count query
  const { data: matchCount, isLoading: isCountLoading } = useQuery({
    queryKey: ['alertMatchCount', filters, listingType],
    queryFn: async () => {
      // Only query for for_sale or for_rent, not projects
      if (listingType === 'projects') {
        const { count, error } = await supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('is_published', true);
        if (error) throw error;
        return count ?? 0;
      }

      let query = supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true)
        .eq('listing_status', listingType as 'for_sale' | 'for_rent');

      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.property_type) {
        query = query.eq('property_type', filters.property_type as any);
      }
      if (filters.min_price) {
        query = query.gte('price', filters.min_price);
      }
      if (filters.max_price) {
        query = query.lte('price', filters.max_price);
      }
      if (filters.min_rooms) {
        query = query.gte('bedrooms', filters.min_rooms);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    enabled: open,
    staleTime: 30000, // Cache for 30 seconds
  });

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
        name: null,
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
      setFrequency('weekly');
      setNotifyEmail(true);
      setNotifyWhatsapp(false);
      setNotifySms(false);
      setPhone('');
    } catch (error: unknown) {
      toast.error(getUserFriendlyError(error, 'Failed to create alert. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const listingTypeLabel = listingType === 'for_sale' ? 'properties for sale' : 
                           listingType === 'for_rent' ? 'rentals' : 'new projects';

  const getFiltersSummary = () => {
    if (activeFilters.length === 0) return 'All listings';
    return activeFilters.map(([key, value]) => formatFilterValue(key, value)).join(', ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Create Alert</h2>
          </div>
          <p className="text-muted-foreground">
            Let the right listings come to you.
          </p>
        </div>

        <div className="px-6 space-y-6">
          {/* Your Filters */}
          <div className="space-y-2">
            <h3 className="font-semibold">Your Filters</h3>
            {activeFilters.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {activeFilters.map(([key, value]) => (
                  <Badge key={key} variant="secondary" className="rounded-full">
                    {formatFilterValue(key, value)}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No filters set - you'll get all new listings
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              {isCountLoading ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Counting matches...
                </span>
              ) : (
                <span>{matchCount} listing{matchCount !== 1 ? 's' : ''} currently match{matchCount === 1 ? 'es' : ''} your criteria</span>
              )}
            </div>
          </div>

          {/* How Often */}
          <div className="space-y-3">
            <h3 className="font-semibold">How Often?</h3>
            <div className="grid grid-cols-3 gap-3">
              {FREQUENCY_OPTIONS.map(option => (
                <button
                  key={option.value}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                    frequency === option.value 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-muted-foreground/30"
                  )}
                  onClick={() => setFrequency(option.value)}
                >
                  <div className={cn(
                    "text-muted-foreground",
                    frequency === option.value && "text-primary"
                  )}>
                    {option.icon}
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notify Me Via */}
          <div className="space-y-3">
            <h3 className="font-semibold">Notify Me Via</h3>
            <div className="flex flex-wrap gap-2">
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
                  notifyEmail 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:border-muted-foreground/30"
                )}
                onClick={() => setNotifyEmail(!notifyEmail)}
              >
                <Mail className="h-4 w-4" />
                Email
                {notifyEmail && <Check className="h-4 w-4" />}
              </button>
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
                  notifyWhatsapp 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:border-muted-foreground/30"
                )}
                onClick={() => setNotifyWhatsapp(!notifyWhatsapp)}
              >
                <MessageSquare className="h-4 w-4" />
                WhatsApp
                {notifyWhatsapp && <Check className="h-4 w-4" />}
              </button>
              <button
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all text-sm font-medium",
                  notifySms 
                    ? "border-primary bg-primary/5 text-primary" 
                    : "border-border hover:border-muted-foreground/30"
                )}
                onClick={() => setNotifySms(!notifySms)}
              >
                <Phone className="h-4 w-4" />
                SMS
                {notifySms && <Check className="h-4 w-4" />}
              </button>
            </div>

            {/* Phone Input */}
            {needsPhone && (
              <Input
                type="tel"
                placeholder="+972 50 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg"
              />
            )}
          </div>

          {/* Summary Box */}
          <div className="bg-muted/30 border border-dashed border-border rounded-xl p-4">
            <p className="text-sm font-medium mb-1">You'll get alerts for:</p>
            <p className="text-sm text-muted-foreground">{getFiltersSummary()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4">
          <Button 
            variant="outline" 
            className="flex-1 rounded-full"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 rounded-full"
            onClick={handleCreateAlert} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Alert'}
          </Button>
        </div>

        {!user && (
          <div className="px-6 pb-6">
            <p className="text-sm text-center text-muted-foreground">
              You'll need to sign in to create alerts.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}