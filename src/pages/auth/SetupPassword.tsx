import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type ValidationState =
  | { status: "loading" }
  | { status: "valid"; purpose: "owner_setup" | "agent_setup"; agencyId: string | null }
  | { status: "used" }
  | { status: "invalid" };

export default function SetupPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") ?? "";

  const [validation, setValidation] = useState<ValidationState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ email: string | null; redirect: string } | null>(null);

  const passwordChecks = getPasswordChecks(password);
  const passwordIsStrong = passwordChecks.every((check) => check.valid);
  const passwordsMatch = password.length > 0 && confirm.length > 0 && password === confirm;

  useEffect(() => {
    if (!token) {
      setValidation({ status: "invalid" });
      return;
    }

    (async () => {
      const { data, error } = await supabase.rpc("validate_password_setup_token", {
        p_token: token,
      });

      if (error) {
        console.error(error);
        setValidation({ status: "invalid" });
        return;
      }

      const row = Array.isArray(data) ? data[0] : data;
      if (!row || (!row.is_valid && !row.was_already_used && !row.user_id)) {
        setValidation({ status: "invalid" });
        return;
      }
      if (row.was_already_used) {
        setValidation({ status: "used" });
        return;
      }
      if (row.is_valid) {
        setValidation({
          status: "valid",
          purpose: row.purpose,
          agencyId: row.agency_id,
        });
        return;
      }
      setValidation({ status: "invalid" });
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordIsStrong) {
      toast.error("Use a stronger password with uppercase, lowercase, number, and symbol.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("complete-password-setup", {
        body: { token, password },
      });

      if (error || !data?.success) {
        const msg = (data as any)?.error || error?.message || "Could not set password.";
        toast.error(msg);
        if (msg.toLowerCase().includes("already been used")) {
          setValidation({ status: "used" });
        }
        return;
      }

      const purpose = (data as any).purpose as string;
      const redirect = purpose === "owner_setup" ? "/agency" : "/agent";
      setSuccess({ email: (data as any).email ?? null, redirect });

      // Auto sign-in if we have an email
      if ((data as any).email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: (data as any).email,
          password,
        });
        if (signInError) {
          toast.message("Password set! Please log in.");
          setTimeout(() => navigate("/auth"), 1200);
          return;
        }
      }

      toast.success("Password set. Welcome aboard!");
      setTimeout(() => navigate(redirect), 800);
    } finally {
      setSubmitting(false);
    }
  };

  if (validation.status === "loading") {
    return (
      <Shell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (validation.status === "invalid") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <CardTitle>Invalid setup link</CardTitle>
            </div>
            <CardDescription>
              This password setup link isn't recognized. It may have been mistyped or revoked.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you're an agency owner or agent expecting access, please reach out to the BuyWiseIsrael team and we'll resend a fresh link.
            </p>
            <Link to="/" className="text-sm text-primary underline">
              Return home
            </Link>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (validation.status === "used") {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              <CardTitle>This link has already been used</CardTitle>
            </div>
            <CardDescription>
              You've already completed your password setup. Please log in instead.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/auth">Go to log in</Link>
            </Button>
          </CardContent>
        </Card>
      </Shell>
    );
  }

  if (success) {
    return (
      <Shell>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <CardTitle>You're in</CardTitle>
            </div>
            <CardDescription>
              Taking you to your dashboard…
            </CardDescription>
          </CardHeader>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle>
              {validation.purpose === "owner_setup" ? "Set up your agency account" : "Set up your agent account"}
            </CardTitle>
          </div>
          <CardDescription>
            Choose a strong password to activate your BuyWiseIsrael account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 10 characters"
                  minLength={10}
                  className="pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  minLength={10}
                  className="pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm((value) => !value)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertDescription className="text-xs">
                <div className="space-y-1">
                  {passwordChecks.map((check) => (
                    <div key={check.label} className={check.valid ? "text-success" : "text-muted-foreground"}>
                      {check.valid ? "✓" : "•"} {check.label}
                    </div>
                  ))}
                  <div className={passwordsMatch ? "text-success" : "text-muted-foreground"}>
                    {passwordsMatch ? "✓" : "•"} Passwords match
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" disabled={submitting || !passwordIsStrong || !passwordsMatch}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting password…
                </>
              ) : (
                "Set password & continue"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Shell>
  );
}

function getPasswordChecks(password: string) {
  return [
    { label: "At least 12 characters", valid: password.length >= 12 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(password) },
    { label: "One number", valid: /\d/.test(password) },
    { label: "One symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            BuyWiseIsrael
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
