import { useState } from 'react';
import { Loader2, Eye, EyeOff, Copy, ShieldCheck, KeyRound, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useReauthAdmin, useRevealCredentials } from '@/hooks/useAgencyProvisioning';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass userId of the provisioned account whose password we want to view. */
  userId: string | null;
  /** Optional label for the credential context (e.g. agent name or "Owner"). */
  subjectLabel?: string;
}

/**
 * Phase 9 — defense-in-depth modal. The admin must re-enter their own password
 * before the provisioned credential is decrypted and shown. The reveal itself
 * is logged in agency_provisioning_audit by the edge function.
 */
export function RevealCredentialsModal({ open, onOpenChange, userId, subjectLabel }: Props) {
  const [step, setStep] = useState<'reauth' | 'shown'>('reauth');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [credential, setCredential] = useState<{ email: string | null; password: string | null; unavailableReason?: string } | null>(null);

  const reauth = useReauthAdmin();
  const reveal = useRevealCredentials();

  function reset() {
    setStep('reauth');
    setPassword('');
    setCredential(null);
    setShowPwd(false);
  }

  function handleClose(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    try {
      await reauth.mutateAsync(password);
      const cred = await reveal.mutateAsync({ userId });
      setCredential({ email: cred.email, password: cred.password, unavailableReason: cred.unavailableReason });
      setStep('shown');
    } catch (err: any) {
      toast.error(err?.message || 'Re-authentication failed');
    }
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {step === 'reauth' ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Confirm your password
              </DialogTitle>
              <DialogDescription>
                Re-enter your admin password to reveal the provisional credential
                {subjectLabel ? ` for ${subjectLabel}` : ''}. This action will be recorded in
                the audit log.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reauth-pwd">Your password</Label>
              <Input
                id="reauth-pwd"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={reauth.isPending || reveal.isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!password || reauth.isPending || reveal.isPending}>
                {(reauth.isPending || reveal.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Reveal
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary" />
                Provisional credential
              </DialogTitle>
              <DialogDescription>
                {credential?.unavailableReason
                  ? 'This account already existed, so there is no provisional password to reveal.'
                  : 'Share this with the account holder via a secure channel. The reveal is now in the audit log.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {credential?.email && (
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={credential.email} className="font-mono text-sm" />
                    <Button type="button" size="icon" variant="outline" onClick={() => copy(credential.email!, 'Email')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {credential?.password ? (
                <div>
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      type={showPwd ? 'text' : 'password'}
                      value={credential.password}
                      className="font-mono text-sm"
                    />
                    <Button type="button" size="icon" variant="outline" onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => copy(credential.password!, 'Password')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <Mail className="mt-0.5 h-4 w-4 text-primary" />
                    <p>Use “Resend setup link” instead. The user can set or reset their own password from that link.</p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
