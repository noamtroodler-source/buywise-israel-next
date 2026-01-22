import { cn } from '@/lib/utils';

interface ProfileCompletionRingProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProfileCompletionRing({ 
  percentage, 
  size = 'md',
  className 
}: ProfileCompletionRingProps) {
  const sizes = {
    sm: { ring: 48, stroke: 4, text: 'text-sm' },
    md: { ring: 64, stroke: 5, text: 'text-lg' },
    lg: { ring: 80, stroke: 6, text: 'text-xl' },
  };

  const { ring, stroke, text } = sizes[size];
  const radius = (ring - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={ring} height={ring} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={ring / 2}
          cy={ring / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          className="text-primary transition-all duration-500 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      <span className={cn("absolute font-semibold text-foreground", text)}>
        {percentage}%
      </span>
    </div>
  );
}
