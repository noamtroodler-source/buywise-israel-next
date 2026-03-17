import { useState, useEffect } from 'react';
import { z } from 'zod';
import { MessageCircle, Mail, User, Sparkles, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import { useBuyerProfile, BuyerProfile } from '@/hooks/useBuyerProfile';
import { cn } from '@/lib/utils';

export type InquiryChannel = 'whatsapp' | 'email';

export interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  channel: InquiryChannel;
  agentName: string;
  propertyTitle: string;
  /** Called with form data when user submits */
  onSubmit: (data: InquiryFormData) => void;
}

export interface InquiryFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  includeBuyerProfile: boolean;
  buyerContextSnapshot: BuyerContextSnapshot | null;
}

export interface BuyerContextSnapshot {
  residency_status: string;
  is_first_property: boolean;
  purchase_purpose: string;
  budget_min: number | null;
  budget_max: number | null;
  aliyah_year: number | null;
  purchase_timeline: string | null;
  target_cities: string[] | null;
}

// Validation schemas
const guestWhatsAppSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  message: z.string().trim().max(500).optional(),
});

const guestEmailSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Valid email required').max(255),
  message: z.string().trim().max(500).optional(),
});

const loggedInSchema = z.object({
  message: z.string().trim().max(500).optional(),
});

function buildBuyerContextSnapshot(profile: BuyerProfile): BuyerContextSnapshot {
  return {
    residency_status: profile.residency_status,
    is_first_property: profile.is_first_property,
    purchase_purpose: profile.purchase_purpose,
    budget_min: profile.budget_min ?? null,
    budget_max: profile.budget_max ?? null,
    aliyah_year: profile.aliyah_year,
    purchase_timeline: profile.purchase_timeline ?? null,
    target_cities: profile.target_cities ?? null,
  };
}

function formatBuyerBadges(profile: BuyerProfile): string[] {
  const badges: string[] = [];
  if (profile.is_first_property) badges.push('First-Time Buyer');
  if (profile.residency_status === 'oleh_hadash') badges.push(`Oleh${profile.aliyah_year ? ` ${profile.aliyah_year}` : ''}`);
  if (profile.residency_status === 'non_resident') badges.push('Non-Resident');
  if (profile.budget_min || profile.budget_max) {
    const fmt = (v: number) => v >= 1000000 ? `₪${(v / 1000000).toFixed(1)}M` : `₪${Math.round(v / 1000)}K`;
    if (profile.budget_min && profile.budget_max) {
      badges.push(`Budget: ${fmt(profile.budget_min)}–${fmt(profile.budget_max)}`);
    } else if (profile.budget_max) {
      badges.push(`Budget: up to ${fmt(profile.budget_max)}`);
    }
  }
  return badges;
}

// Rate limit check for guests
function checkGuestRateLimit(): boolean {
  const key = 'inquiry_rate_limit';
  try {
    const stored = sessionStorage.getItem(key);
    const now = Date.now();
    if (stored) {
      const { count, windowStart } = JSON.parse(stored);
      const hourMs = 60 * 60 * 1000;
      if (now - windowStart < hourMs) {
        if (count >= 5) return false; // rate limited
        sessionStorage.setItem(key, JSON.stringify({ count: count + 1, windowStart }));
        return true;
      }
    }
    // New window
    sessionStorage.setItem(key, JSON.stringify({ count: 1, windowStart: now }));
    return true;
  } catch {
    return true; // fail open
  }
}

function InquiryForm({
  channel,
  agentName,
  propertyTitle,
  onSubmit,
  onClose,
}: Omit<InquiryModalProps, 'isOpen'>) {
  const { user } = useAuth();
  const { data: buyerProfile } = useBuyerProfile();

  const isLoggedIn = !!user;
  const hasBuyerProfile = !!buyerProfile;

  const agentFirstName = agentName.split(' ')[0];
  const userName = user?.user_metadata?.full_name || '';

  const buildDefaultMessage = (ch: InquiryChannel, uName: string) => {
    if (ch === 'email') {
      return `Dear ${agentFirstName},\n\nI'm interested in the ${propertyTitle}. I'd love to learn more about this property.\n\nBest,\n${uName || '[Your Name]'}`;
    }
    return `Hi${agentFirstName ? ` ${agentFirstName}` : ''}, I'm interested in the ${propertyTitle}. I'd love to learn more.`;
  };

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState(`Inquiry about the ${propertyTitle}`);
  const [message, setMessage] = useState(buildDefaultMessage(channel, userName));
  const [includeBuyerProfile, setIncludeBuyerProfile] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill from user metadata and rebuild message with name
  useEffect(() => {
    if (user) {
      const uName = user.user_metadata?.full_name || '';
      setName(uName);
      setEmail(user.email || '');
      setMessage(buildDefaultMessage(channel, uName));
    }
  }, [user]);

  const handleSubmit = () => {
    setErrors({});

    // Rate limit check for guests
    if (!isLoggedIn && !checkGuestRateLimit()) {
      setErrors({ _form: 'Too many inquiries. Please try again later.' });
      return;
    }

    // Validate
    try {
      if (!isLoggedIn) {
        if (channel === 'email') {
          guestEmailSchema.parse({ name, email, message });
        } else {
          guestWhatsAppSchema.parse({ name, message });
        }
      } else {
        loggedInSchema.parse({ message });
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) fieldErrors[String(e.path[0])] = e.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    const snapshot = hasBuyerProfile && includeBuyerProfile
      ? buildBuyerContextSnapshot(buyerProfile!)
      : null;

    const fullMessage = channel === 'email'
      ? `Subject: ${subject.trim()}\n\n${message.trim()}`
      : message.trim();

    onSubmit({
      name: isLoggedIn ? (user?.user_metadata?.full_name || name) : name,
      email: isLoggedIn ? (user?.email || email) : email,
      phone,
      message: fullMessage,
      includeBuyerProfile,
      buyerContextSnapshot: snapshot,
    });
  };

  const buyerBadges = hasBuyerProfile ? formatBuyerBadges(buyerProfile!) : [];

  return (
    <div className="space-y-4">
      {/* Property context line */}
      <div className="rounded-lg bg-muted/50 px-3 py-2">
        <p className="text-sm text-muted-foreground">
          About: <span className="font-medium text-foreground">{propertyTitle}</span>
        </p>
      </div>

      {/* Guest fields */}
      {!isLoggedIn && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="inquiry-name">Name *</Label>
            <Input
              id="inquiry-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              maxLength={100}
              className={cn(errors.name && 'border-destructive')}
            />
            {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
          </div>

          {channel === 'email' && (
            <div>
              <Label htmlFor="inquiry-email">Email *</Label>
              <Input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                maxLength={255}
                className={cn(errors.email && 'border-destructive')}
              />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
          )}
        </div>
      )}

      {/* Subject (email only) */}
      {channel === 'email' && (
        <div>
          <Label htmlFor="inquiry-subject">Subject</Label>
          <Input
            id="inquiry-subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject line"
            maxLength={150}
          />
        </div>
      )}

      {/* Body / Message */}
      <div>
        <Label htmlFor="inquiry-message">{channel === 'email' ? 'Body' : 'Message'}</Label>
        <Textarea
          id="inquiry-message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={channel === 'email' ? 'Write your email body...' : 'Write a message...'}
          maxLength={500}
          rows={channel === 'email' ? 5 : 3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{message.length}/500</p>
      </div>

      {/* Buyer profile context */}
      {isLoggedIn && hasBuyerProfile && buyerBadges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-profile"
              checked={includeBuyerProfile}
              onCheckedChange={(checked) => setIncludeBuyerProfile(!!checked)}
            />
            <Label htmlFor="include-profile" className="text-sm font-normal cursor-pointer">
              Include my buyer profile
            </Label>
          </div>
          {includeBuyerProfile && (
            <div className="flex flex-wrap gap-1.5 pl-6">
              {buyerBadges.map(badge => (
                <Badge key={badge} variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {isLoggedIn && !hasBuyerProfile && (
        <Link 
          to="/profile?tab=settings"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
          onClick={onClose}
        >
          <User className="h-4 w-4" />
          Complete your buyer profile for personalized service
        </Link>
      )}

      {/* Form error */}
      {errors._form && (
        <p className="text-sm text-destructive text-center">{errors._form}</p>
      )}

      {/* Submit */}
      <Button className="w-full gap-2" size="lg" onClick={handleSubmit}>
        {channel === 'whatsapp' ? (
          <>
            <MessageCircle className="h-5 w-5" />
            Send via WhatsApp
          </>
        ) : (
          <>
            <Mail className="h-5 w-5" />
            Send via Email
          </>
        )}
      </Button>

      {/* Guest signup nudge */}
      {!isLoggedIn && (
        <p className="text-xs text-muted-foreground text-center">
          <Link to="/auth" className="text-primary hover:underline" onClick={onClose}>
            Sign up
          </Link>
          {' '}for personalized results & saved searches
        </p>
      )}
    </div>
  );
}

export function InquiryModal(props: InquiryModalProps) {
  const { isOpen, onClose, agentName } = props;
  const isMobile = useIsMobile();

  const title = `Send a message to ${agentName}`;
  const description = 'Your message will be sent and the inquiry logged so the agent can follow up.';

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-4 pb-6">
          <DrawerHeader className="text-left px-0">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <InquiryForm {...props} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <InquiryForm {...props} />
      </DialogContent>
    </Dialog>
  );
}
