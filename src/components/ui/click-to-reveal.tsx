import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Phone, Mail, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface ClickToRevealProps {
  /** The actual value to reveal (phone number, email, etc.) */
  value: string;
  /** Type of data being revealed */
  type: 'phone' | 'email';
  /** Entity type for tracking */
  entityType: 'agent' | 'developer' | 'agency';
  /** Entity ID for tracking */
  entityId: string;
  /** Optional session ID (uses localStorage fallback) */
  sessionId?: string;
  /** Optional class name */
  className?: string;
  /** Callback when value is revealed */
  onReveal?: () => void;
}

/**
 * Click-to-reveal component for protecting contact information from scrapers.
 * Tracks reveals for analytics and rate limiting detection.
 */
export function ClickToReveal({
  value,
  type,
  entityType,
  entityId,
  sessionId,
  className,
  onReveal,
}: ClickToRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getSessionId = useCallback(() => {
    if (sessionId) return sessionId;
    
    // Use localStorage session ID
    let storedSessionId = localStorage.getItem('bw_session_id');
    if (!storedSessionId) {
      storedSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('bw_session_id', storedSessionId);
    }
    return storedSessionId;
  }, [sessionId]);

  const handleReveal = async () => {
    setIsLoading(true);
    
    try {
      // Track the reveal
      const sid = getSessionId();
      await supabase.from('contact_reveals').insert({
        session_id: sid,
        user_id: user?.id || null,
        entity_type: entityType,
        entity_id: entityId,
        reveal_type: type,
      });
    } catch (error) {
      // Don't block reveal if tracking fails
      console.error('Failed to track contact reveal:', error);
    }

    setIsRevealed(true);
    setIsLoading(false);
    onReveal?.();
  };

  const formatValue = (val: string) => {
    if (type === 'phone') {
      // Format phone for display
      return val;
    }
    return val;
  };

  const getMaskedValue = () => {
    if (type === 'phone') {
      // Show first 3 and last 2 digits: 054-***-**12
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 5) {
        return `${digits.slice(0, 3)}-***-**${digits.slice(-2)}`;
      }
      return '***-***-****';
    }
    if (type === 'email') {
      // Show first letter and domain: a***@example.com
      const [localPart, domain] = value.split('@');
      if (localPart && domain) {
        return `${localPart[0]}***@${domain}`;
      }
      return '***@***.com';
    }
    return '***';
  };

  const Icon = type === 'phone' ? Phone : Mail;

  if (isRevealed) {
    return (
      <span className={cn("font-medium text-foreground", className)}>
        {formatValue(value)}
      </span>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReveal}
      disabled={isLoading}
      className={cn(
        "h-auto py-1 px-2 gap-1.5 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      <span className="font-mono text-sm">{getMaskedValue()}</span>
    </Button>
  );
}

/**
 * A simpler variant that just shows "Click to reveal" text
 */
interface SimpleRevealButtonProps {
  value: string;
  type: 'phone' | 'email';
  entityType: 'agent' | 'developer' | 'agency';
  entityId: string;
  className?: string;
  onReveal?: () => void;
  /** Label to show before reveal */
  label?: string;
}

export function SimpleRevealButton({
  value,
  type,
  entityType,
  entityId,
  className,
  onReveal,
  label,
}: SimpleRevealButtonProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getSessionId = useCallback(() => {
    let storedSessionId = localStorage.getItem('bw_session_id');
    if (!storedSessionId) {
      storedSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('bw_session_id', storedSessionId);
    }
    return storedSessionId;
  }, []);

  const handleReveal = async () => {
    setIsLoading(true);
    
    try {
      const sid = getSessionId();
      await supabase.from('contact_reveals').insert({
        session_id: sid,
        user_id: user?.id || null,
        entity_type: entityType,
        entity_id: entityId,
        reveal_type: type,
      });
    } catch (error) {
      console.error('Failed to track contact reveal:', error);
    }

    setIsRevealed(true);
    setIsLoading(false);
    onReveal?.();
  };

  const Icon = type === 'phone' ? Phone : Mail;
  const defaultLabel = type === 'phone' ? 'Show phone' : 'Show email';

  if (isRevealed) {
    return (
      <span className={cn("flex items-center gap-2", className)}>
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{value}</span>
      </span>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReveal}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
      {label || defaultLabel}
    </Button>
  );
}
