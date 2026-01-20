import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface EmailVerificationStepProps {
  email: string;
  onEmailChange: (email: string) => void;
  onVerified: () => void;
  isVerified: boolean;
  type: 'agent' | 'developer' | 'agency';
  name: string;
  disabled?: boolean;
}

// TEMPORARY: Skip email verification until domain is configured
// To re-enable: set SKIP_VERIFICATION = false
const SKIP_VERIFICATION = true;

export function EmailVerificationStep({
  email,
  onEmailChange,
  onVerified,
  isVerified,
  type,
  name,
  disabled = false,
}: EmailVerificationStepProps) {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const isValidEmail = (emailToCheck: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToCheck);
  };

  // Auto-verify when email is valid (temporary bypass)
  useEffect(() => {
    if (SKIP_VERIFICATION && email && isValidEmail(email) && !isVerified) {
      onVerified();
    }
  }, [email, isVerified, onVerified]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !isVerified) {
      handleVerify();
    }
  }, [code]);

  const handleSendCode = async () => {
    if (!email || !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!name) {
      setError('Please enter your name first');
      return;
    }

    setError('');
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-verification-email', {
        body: { email, type, name },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      setCodeSent(true);
      setCountdown(60);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      console.error('Error sending code:', err);
      setError(err.message || 'Failed to send verification code');
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) return;

    setError('');
    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { email, code, type },
      });

      if (error) throw error;

      if (data?.valid) {
        onVerified();
        toast.success('Email verified successfully!');
      } else {
        setError(data?.error || 'Invalid or expired code');
        setCode('');
      }
    } catch (err: any) {
      console.error('Error verifying code:', err);
      setError(err.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    setCode('');
    setError('');
    handleSendCode();
  };

  if (isVerified) {
    return (
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="pl-10 pr-10 bg-muted"
          />
          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
        </div>
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Email verified
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                onEmailChange(e.target.value);
                setError('');
                if (codeSent) {
                  setCodeSent(false);
                  setCode('');
                }
              }}
              placeholder="your@email.com"
              className={cn('pl-10', error && !codeSent && 'border-destructive')}
              disabled={disabled || codeSent}
            />
          </div>
          <Button
            type="button"
            variant={codeSent ? 'outline' : 'default'}
            onClick={codeSent ? handleResend : handleSendCode}
            disabled={disabled || isSending || !email || (codeSent && countdown > 0)}
            className="whitespace-nowrap"
          >
            {isSending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : codeSent ? (
              countdown > 0 ? (
                `Resend (${countdown}s)`
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend
                </>
              )
            ) : (
              'Send Code'
            )}
          </Button>
        </div>
      </div>

      {codeSent && (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Code expires in 10 minutes. Check your spam folder if you don't see it.
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
