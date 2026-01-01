/**
 * Phone number utilities
 * Handles phone number formatting and validation
 */

/**
 * Format phone number to E.164 format (+33...)
 * Handles French phone numbers by default
 *
 * @param phone - Phone number in any format
 * @returns Phone number in E.164 format
 *
 * @example
 * formatPhoneE164("0612345678") // "+33612345678"
 * formatPhoneE164("06 12 34 56 78") // "+33612345678"
 * formatPhoneE164("+33612345678") // "+33612345678"
 */
export function formatPhoneE164(phone: string): string {
  // Supprimer tous les caractères non numériques sauf le +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Si le numéro commence par 0 (format français), le convertir en +33
  if (cleaned.startsWith("0")) {
    cleaned = "+33" + cleaned.substring(1);
  }

  // Si le numéro ne commence pas par +, ajouter +33 par défaut
  if (!cleaned.startsWith("+")) {
    cleaned = "+33" + cleaned;
  }

  return cleaned;
}

/**
 * Validate phone number format
 * Checks if phone number matches E.164 pattern
 *
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string | undefined): boolean {
  if (!phone) return false;
  const phoneRegex = /^[0-9+\-\s()]{8,}$/;
  return phoneRegex.test(phone);
}
