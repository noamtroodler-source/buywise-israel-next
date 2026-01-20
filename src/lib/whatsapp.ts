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

  // Remove the + for WhatsApp (WhatsApp wants digits only)
  return cleaned.replace(/^\+/, '');
}

/**
 * Detect if we're on a mobile device
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Build a WhatsApp URL for the given phone number and message
 * Uses web.whatsapp.com for desktop (bypasses wa.me blocking) and wa.me for mobile
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const normalizedPhone = normalizePhoneForWhatsApp(phone);
  if (!normalizedPhone) return '';

  // On mobile, use wa.me (works best with app)
  if (isMobileDevice()) {
    const baseUrl = `https://wa.me/${normalizedPhone}`;
    if (message) {
      return `${baseUrl}?text=${encodeURIComponent(message)}`;
    }
    return baseUrl;
  }

  // On desktop, use web.whatsapp.com/send (bypasses wa.me/api.whatsapp.com blocking)
  let url = `https://web.whatsapp.com/send?phone=${normalizedPhone}`;
  if (message) {
    url += `&text=${encodeURIComponent(message)}`;
  }
  return url;
}

/**
 * Build a mobile-friendly WhatsApp URL (always uses wa.me)
 * For use in QR codes where mobile scanning is expected
 */
export function buildMobileWhatsAppUrl(phone: string, message?: string): string {
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

// Store the last attempted URL and phone for the fallback modal
let lastAttemptedUrl = '';
let lastAttemptedPhone = '';
let lastAttemptedMessage = '';

export function getLastWhatsAppAttempt() {
  return {
    url: lastAttemptedUrl,
    phone: lastAttemptedPhone,
    message: lastAttemptedMessage,
  };
}

// Callback to show fallback modal - will be set by the modal component
let showFallbackModalCallback: ((url: string, phone: string, message: string) => void) | null = null;

export function setFallbackModalCallback(callback: ((url: string, phone: string, message: string) => void) | null) {
  showFallbackModalCallback = callback;
}

/**
 * Show fallback UI when navigation is blocked
 */
function showFallbackUI(url: string, phone: string = '', message: string = ''): void {
  // Store for potential modal use
  lastAttemptedUrl = url;
  lastAttemptedPhone = phone;
  lastAttemptedMessage = message;

  // If we have a modal callback registered, use it
  if (showFallbackModalCallback) {
    showFallbackModalCallback(url, phone, message);
    return;
  }

  // Fallback to toast with copy options
  toast.error('WhatsApp was blocked', {
    description: 'Your browser or an extension blocked WhatsApp. Try disabling ad blockers or use the options below.',
    duration: 15000,
    action: {
      label: 'Copy Link',
      onClick: () => {
        navigator.clipboard.writeText(url).then(() => {
          toast.success('WhatsApp link copied!', {
            description: 'Paste it in a new browser tab to open WhatsApp.',
          });
        }).catch(() => {
          toast.info('Copy this link manually:', {
            description: url,
            duration: 15000,
          });
        });
      },
    },
  });
}

/**
 * Open WhatsApp reliably across normal browsers and embedded iframes.
 *
 * Strategy:
 * 1) If inside iframe: try breaking out via window.top.location.assign
 * 2) Try programmatic anchor click (often bypasses popup blockers)
 * 3) Try window.open as fallback
 * 4) If all fail: show fallback modal with copy options and QR code
 */
export function openWhatsApp(url: string, phone: string = '', message: string = ''): void {
  if (!url) {
    console.warn('[WhatsApp] No URL provided');
    return;
  }

  console.debug('[WhatsApp] Opening URL:', url);
  console.debug('[WhatsApp] Phone:', phone);
  console.debug('[WhatsApp] Is mobile:', isMobileDevice());
  console.debug('[WhatsApp] In iframe:', isInIframe());

  // Strategy 1: Try iframe breakout
  if (isInIframe()) {
    try {
      console.debug('[WhatsApp] Trying iframe breakout via window.top');
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
  showFallbackUI(url, phone, message);
}

/**
 * Build a WhatsApp share URL (no phone number, just text)
 */
export function buildWhatsAppShareUrl(text: string): string {
  if (isMobileDevice()) {
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  // On desktop, use web.whatsapp.com
  return `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
}
