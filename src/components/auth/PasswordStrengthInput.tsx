import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthInputProps {
  value: string;
  onChange: (value: string) => void;
  showRequirements?: boolean;
  showStrengthMeter?: boolean;
  placeholder?: string;
  id?: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthInput({
  value,
  onChange,
  showRequirements = false,
  showStrengthMeter = true,
  placeholder = "••••••••",
  id,
}: PasswordStrengthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const requirements: Requirement[] = useMemo(() => [
    { label: 'At least 6 characters', met: value.length >= 6 },
    { label: 'Contains a number', met: /\d/.test(value) },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(value) },
  ], [value]);

  const strength = useMemo(() => {
    if (!value) return { level: 0, label: '', color: '' };
    
    let score = 0;
    if (value.length >= 6) score++;
    if (value.length >= 8) score++;
    if (/\d/.test(value)) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-muted' };
    if (score === 2) return { level: 2, label: 'Fair', color: 'bg-primary/30' };
    if (score === 3) return { level: 3, label: 'Good', color: 'bg-primary/60' };
    return { level: 4, label: 'Strong', color: 'bg-primary' };
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
          tabIndex={-1}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Strength Meter */}
      {showStrengthMeter && value && (
        <div className="space-y-1.5">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-300",
                  level <= strength.level ? strength.color : "bg-muted"
                )}
              />
            ))}
          </div>
          <p className={cn(
            "text-xs font-medium transition-colors",
            strength.level <= 1 && "text-muted-foreground",
            strength.level === 2 && "text-foreground",
            strength.level === 3 && "text-primary",
            strength.level === 4 && "text-primary"
          )}>
            {strength.label}
          </p>
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && value && (
        <div className="space-y-1 pt-1">
          {requirements.map((req, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                req.met ? "text-primary" : "text-muted-foreground"
              )}
            >
              {req.met ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span>{req.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
