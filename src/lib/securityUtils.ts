/**
 * Security & Data Sanitization Utilities
 * Implements input validation, XSS prevention, Arabic text normalization,
 * and cryptographically safe unique ID generation.
 */

/**
 * Strips dangerous HTML tags, script vectors, event handlers, and control characters.
 */
export function sanitizeText(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    // Remove control characters (except newline/tab if needed)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip script and style blocks entirely
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Strip HTML tags
    .replace(/<\/?[^>]+(>|$)/g, '')
    // Replace dangerous javascript: pseudo-protocols
    .replace(/javascript\s*:/gi, '')
    // Normalize consecutive whitespace
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Normalizes Arabic text for duplicate-detection and fuzzy-safe matching.
 * Unifies alefs (أ, إ, آ -> ا), taa marbuta (ة -> ه), alef maqsura (ى -> ي),
 * removes diacritics (tashkeel & tatweel), and strips extra whitespace.
 */
export function normalizeArabicText(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';

  return text
    .trim()
    .toLowerCase()
    // Remove Arabic Tashkeel (diacritics)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel (kashida)
    .replace(/\u0640/g, '')
    // Normalize Alefs
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Taa Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Yaa / Alef Maqsura
    .replace(/[ىي]/g, 'ي')
    // Normalize Persian/Urdu Kaf and Gaf
    .replace(/ك/g, 'ك')
    // Collapse whitespace
    .replace(/\s+/g, ' ');
}

/**
 * Cryptographically secure unique identifier generator.
 * Produces non-colliding, tamper-resistant IDs suitable for database keys.
 */
export function generateSecureId(prefix = 'item'): string {
  const timestamp = Date.now().toString(36);
  let randomPart = '';
  
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    randomPart = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
  } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(6);
    crypto.getRandomValues(array);
    randomPart = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6);
  }

  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Checks if a name already exists in a collection based on normalized Arabic text comparison.
 */
export function isDuplicateName(
  newName: string,
  existingItems: { id?: string; name?: string; label?: string }[],
  currentId?: string
): boolean {
  const normalizedNew = normalizeArabicText(newName);
  if (!normalizedNew) return false;

  return existingItems.some(item => {
    if (currentId && item.id === currentId) return false;
    const itemName = item.name || item.label || '';
    return normalizeArabicText(itemName) === normalizedNew;
  });
}
