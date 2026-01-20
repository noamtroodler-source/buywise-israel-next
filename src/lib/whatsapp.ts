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
 * Open WhatsApp reliably across normal browsers and embedded iframes.
 *
 * In some embedded preview iframes, both window.open() and <a target="_blank">
 * can be blocked. This helper attempts:
 * 1) Navigate the top-level window when inside an iframe
 * 2) window.open() in a normal browsing context
 * 3) Fallback to same-tab navigation
 */
export function openWhatsApp(url: string): void {
  if (!url) return;

  const inIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  if (inIframe) {
    try {
      // Break out of iframe restrictions by navigating the top window.
      window.top!.location.href = url;
      return;
    } catch {
      // fall through
    }
  }

  try {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) return;
  } catch {
    // fall through
  }

  window.location.href = url;
}

