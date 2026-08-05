/**
 * Clean and normalize phone numbers for consistent comparison.
 * Strip non-digit characters and handle country codes / prefixes.
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // Remove leading country code if Yemeni number (e.g., +967 or 00967)
  if (digits.startsWith('967') && digits.length > 9) {
    digits = digits.slice(-9);
  } else if (digits.startsWith('0') && digits.length === 10) {
    digits = digits.slice(1);
  }

  return digits;
}

export interface MinimalPhoneItem {
  id?: string;
  name: string;
  phone?: string;
}

/**
 * Checks if a store phone number is already registered to another store.
 */
export function checkDuplicateStorePhone<T extends MinimalPhoneItem>(
  phone: string,
  stores: T[],
  currentStoreId?: string
): { isDuplicate: boolean; existingName?: string } {
  const targetNorm = normalizePhoneNumber(phone);
  if (!targetNorm) return { isDuplicate: false };

  const match = stores.find(s => {
    if (currentStoreId && s.id === currentStoreId) return false;
    const sNorm = normalizePhoneNumber(s.phone);
    return sNorm && sNorm === targetNorm;
  });

  if (match) {
    return { isDuplicate: true, existingName: match.name };
  }

  return { isDuplicate: false };
}

/**
 * Checks if a user phone number is already registered to another user.
 */
export function checkDuplicateUserPhone<T extends MinimalPhoneItem>(
  phone: string,
  users: T[],
  currentUserId?: string
): { isDuplicate: boolean; existingName?: string } {
  const targetNorm = normalizePhoneNumber(phone);
  if (!targetNorm) return { isDuplicate: false };

  const match = users.find(u => {
    if (currentUserId && u.id === currentUserId) return false;
    const uNorm = normalizePhoneNumber(u.phone);
    return uNorm && uNorm === targetNorm;
  });

  if (match) {
    return { isDuplicate: true, existingName: match.name };
  }

  return { isDuplicate: false };
}
