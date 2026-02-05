import * as React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HoverOnlyTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  /** Whether the tooltip is "armed" - i.e., pointer has moved since popover opened */
  armed: boolean;
  /** Delay in ms before opening (default 400) */
  delayMs?: number;
  /** Grace period in ms before closing (default 100) */
  closeGraceMs?: number;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

/**
 * A controlled, hover-only tooltip that:
 * - Only opens on mouse pointer enter (not touch/pen)
 * - Only opens if "armed" (pointer has moved since parent opened)
 * - Does NOT open on focus
 * - Has configurable delay and close grace period
 * - Larger hit area for stability
 */
export function HoverOnlyTooltip({
  children,
  content,
  armed,
  delayMs = 400,
  closeGraceMs = 100,
  side = 'top',
  className,
}: HoverOnlyTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const openTimeoutRef = React.useRef<number | null>(null);
  const closeTimeoutRef = React.useRef<number | null>(null);
  const isHoveringContentRef = React.useRef(false);

  const clearTimeouts = () => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => clearTimeouts();
  }, []);

  // Close immediately if armed becomes false (popover closed)
  React.useEffect(() => {
    if (!armed && open) {
      clearTimeouts();
      setOpen(false);
    }
  }, [armed, open]);

  const handlePointerEnter = (e: React.PointerEvent) => {
    // Only open for mouse, not touch/pen
    if (e.pointerType !== 'mouse') return;
    // Only open if armed
    if (!armed) return;

    clearTimeouts();
    openTimeoutRef.current = window.setTimeout(() => {
      setOpen(true);
    }, delayMs);
  };

  const handlePointerLeave = () => {
    clearTimeouts();
    // Grace period before closing - allows moving to tooltip content
    closeTimeoutRef.current = window.setTimeout(() => {
      if (!isHoveringContentRef.current) {
        setOpen(false);
      }
    }, closeGraceMs);
  };

  const handleContentPointerEnter = () => {
    isHoveringContentRef.current = true;
    clearTimeouts();
  };

  const handleContentPointerLeave = () => {
    isHoveringContentRef.current = false;
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false);
    }, closeGraceMs);
  };

  // Explicitly do nothing on focus to prevent focus-triggered open
  const handleFocus = (e: React.FocusEvent) => {
    // Prevent default tooltip behavior on focus
    e.stopPropagation();
  };

  return (
    <Tooltip open={open}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="p-1 -m-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onFocus={handleFocus}
          // Prevent Radix from handling these
          onMouseDown={(e) => e.preventDefault()}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={className}
        onPointerEnter={handleContentPointerEnter}
        onPointerLeave={handleContentPointerLeave}
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
