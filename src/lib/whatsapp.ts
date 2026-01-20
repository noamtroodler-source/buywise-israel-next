import { toast } from 'sonner';

/**
 * Normalize a phone number for WhatsApp
 * Handles various formats including Israeli numbers
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Handle Israeli numbers that start with 0 (convert to +972)
  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = '+972' + cleaned.slice(1);
  }

  // Handle numbers starting with 972 without +
  if (cleaned.startsWith('972') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }

  // Remove the + for wa.me (WhatsApp wants digits only)
  return cleaned.replace(/^\+/, '');
}

/**
 * Build a WhatsApp URL for the given phone number and message
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  if (!normalizedPhone) return '';

  const baseUrl = `https://wa.me/${normalizedPhone}`;
  if (message) {
    return `${baseUrl}?text=${encodeURIComponent(message)}`;
  }
  return baseUrl;
}

/**
 * Detect if we're running inside an iframe
 */
function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // If we can't access window.top, we're definitely in a sandboxed iframe
    return true;
  }
}

/**
 * Try to open URL via programmatic anchor click
 * This often bypasses popup blockers better than window.open
 */
function tryAnchorClick(url: string): boolean {
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    console.debug('[WhatsApp] Anchor click attempted for:', url);
    return true;
  } catch (error) {
    console.debug('[WhatsApp] Anchor click failed:', error);
    return false;
  }
}

/**
 * Show fallback UI when navigation is blocked
 */
function showFallbackUI(url: string): void {
  toast.error('WhatsApp was blocked', {
    description: 'Your browser blocked the popup. Use the buttons below.',
    duration: 10000,
    action: {
      label: 'Copy Link',
      onClick: () => {
        navigator.clipboard.writeText(url).then(() => {
          toast.success('WhatsApp link copied!', {
            description: 'Paste it in a new browser tab to open WhatsApp.',
          });
        }).catch(() => {
          // Fallback: show the URL in an alert
          toast.info('Copy this link manually:', {
            description: url,
            duration: 15000,
          });
        });
      },
    },
  });
  
  // Also try same-tab navigation as last resort after a short delay
  setTimeout(() => {
    const shouldNavigate = window.confirm(
      'WhatsApp was blocked by your browser.\n\nClick OK to open WhatsApp in this tab, or Cancel to stay here.'
    );
    if (shouldNavigate) {
      window.location.assign(url);
    }
  }, 500);
}

/**
 * Open WhatsApp reliably across normal browsers and embedded iframes.
 *
 * Strategy:
 * 1) If inside iframe: try breaking out via window.top.location.assign
 * 2) Try programmatic anchor click (often bypasses popup blockers)
 * 3) Try window.open as fallback
 * 4) If all fail: show toast with "Copy Link" option and offer same-tab navigation
 */
export function openWhatsApp(url: string): void {
  if (!url) {
    console.warn('[WhatsApp] No URL provided');
    return;
  }

  console.debug('[WhatsApp] Attempting to open:', url);
  console.debug('[WhatsApp] In iframe:', isInIframe());

  // Strategy 1: Try iframe breakout
  if (isInIframe()) {
    try {
      console.debug('[WhatsApp] Trying iframe breakout via window.top');
      // Using location.assign is more reliable than setting href directly
      window.top!.location.assign(url);
      return;
    } catch (error) {
      console.debug('[WhatsApp] Iframe breakout failed (expected in sandboxed iframe):', error);
      // Continue to other strategies
    }
  }

  // Strategy 2: Try programmatic anchor click
  // This works better than window.open in many browsers
  if (tryAnchorClick(url)) {
    // Give it a moment to see if it worked
    // We can't really know for sure, but if we're still here after 100ms,
    // the click probably triggered navigation
    return;
  }

  // Strategy 3: Try window.open
  try {
    console.debug('[WhatsApp] Trying window.open');
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) {
      console.debug('[WhatsApp] window.open succeeded');
      return;
    }
    console.debug('[WhatsApp] window.open returned null (likely blocked)');
  } catch (error) {
    console.debug('[WhatsApp] window.open threw error:', error);
  }

  // Strategy 4: If we get here, navigation was likely blocked
  console.debug('[WhatsApp] All navigation attempts may have failed, showing fallback UI');
  showFallbackUI(url);
}

/**
 * Build a WhatsApp share URL (no phone number, just text)
 */
export function buildWhatsAppShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
