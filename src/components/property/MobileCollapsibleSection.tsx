import { useState, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { safeSessionGet, safeSessionSet } from '@/utils/sessionStorage';
import { cn } from '@/lib/utils';

interface MobileCollapsibleSectionProps {
  id: string;
  title: string;
  icon?: ReactNode;
  summary?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** If true, always starts closed ignoring session storage */
  alwaysStartClosed?: boolean;
  className?: string;
}

export function MobileCollapsibleSection({
  id,
  title,
  icon,
  summary,
  children,
  defaultOpen = false,
  alwaysStartClosed = false,
  className,
}: MobileCollapsibleSectionProps) {
  const isMobile = useIsMobile();
  const storageKey = `section_expanded_${id}`;
  
  // Initialize state - if alwaysStartClosed, ignore session storage
  const [isOpen, setIsOpen] = useState(() => {
    if (alwaysStartClosed) {
      return false;
    }
    return safeSessionGet(storageKey, defaultOpen);
  });

  // Persist state changes
  useEffect(() => {
    safeSessionSet(storageKey, isOpen);
  }, [isOpen, storageKey]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Optional haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  // On desktop, always show expanded content
  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('border border-border rounded-xl overflow-hidden', className)}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-primary">{icon}</span>}
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {summary && !isOpen && (
              <p className="text-sm text-muted-foreground truncate mt-0.5">{summary}</p>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-2"
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </button>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="p-4 border-t border-border">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
