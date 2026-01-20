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
