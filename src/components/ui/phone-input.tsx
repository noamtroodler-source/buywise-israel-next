import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  showWhatsAppIcon?: boolean;
  className?: string;
  id?: string;
}

// Normalize phone number - auto-add +972 for Israeli numbers
const normalizePhoneNumber = (input: string): string => {
  // Remove all non-digit characters except +
  let cleaned = input.replace(/[^\d+]/g, '');
  
  // Handle common Israeli patterns
  if (cleaned.startsWith('0') && cleaned.length >= 2) {
    // Local Israeli format: 052... → +97252...
    cleaned = '+972' + cleaned.substring(1);
  } else if (cleaned.startsWith('972') && !cleaned.startsWith('+')) {
    // Missing plus: 972... → +972...
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length >= 9 && !cleaned.startsWith('1')) {
    // Default to Israel if no country code and not US
    cleaned = '+972' + cleaned;
  } else if (!cleaned.startsWith('+') && cleaned.length > 0) {
    // Add + if missing
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

// Format for display
const formatPhoneDisplay = (phone: string): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Israeli format: +972 52-123-4567
  if (cleaned.startsWith('+972') && cleaned.length >= 12) {
    const rest = cleaned.substring(4);
    return `+972 ${rest.substring(0, 2)}-${rest.substring(2, 5)}-${rest.substring(5, 9)}`;
  }
  
  // US format: +1 (555) 123-4567
  if (cleaned.startsWith('+1') && cleaned.length >= 11) {
    const rest = cleaned.substring(2);
    return `+1 (${rest.substring(0, 3)}) ${rest.substring(3, 6)}-${rest.substring(6, 10)}`;
  }
  
  return cleaned;
};

// Validation
const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // Optional field - empty is valid
  const cleaned = phone.replace(/[^\d]/g, '');
  // Must have country code + 9-12 digit number
  return cleaned.length >= 10 && cleaned.length <= 15;
};

export function PhoneInput({
  value,
  onChange,
  placeholder = '+972 52-XXX-XXXX',
  required = false,
  showWhatsAppIcon = false,
  className,
  id,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [hasBlurred, setHasBlurred] = React.useState(false);
  
  // Sync display value with external value
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatPhoneDisplay(value));
    }
  }, [value, isFocused]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    // Normalize and send to parent
    const normalized = normalizePhoneNumber(inputValue);
    onChange(normalized);
  };
  
  const handleBlur = () => {
    setIsFocused(false);
    setHasBlurred(true);
    // Format on blur
    setDisplayValue(formatPhoneDisplay(value));
  };
  
  const handleFocus = () => {
    setIsFocused(true);
    // Show raw value when focused for easier editing
    setDisplayValue(value);
  };
  
  const isValid = isValidPhone(value);
  const showError = hasBlurred && !isValid && value.length > 0;
  const showSuccess = hasBlurred && isValid && value.length > 0;
  
  return (
    <div className="space-y-1.5">
      <div className="relative">
        {showWhatsAppIcon && (
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#25D366]" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        )}
        <Input
          id={id}
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          className={cn(
            'h-11 rounded-xl pr-10',
            showWhatsAppIcon && 'pl-10',
            showError && 'border-destructive focus-visible:ring-destructive',
            showSuccess && 'border-primary/50',
            className
          )}
        />
        {showSuccess && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
        )}
        {showError && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
        )}
      </div>
      <p className={cn(
        'text-xs',
        showError ? 'text-destructive' : 'text-muted-foreground'
      )}>
        {showError 
          ? 'Enter a valid phone number with country code' 
          : 'Include country code (e.g., +972 for Israel)'
        }
      </p>
    </div>
  );
}

// Export validation helper for use in forms
export const validatePhoneNumber = isValidPhone;
