/**
 * Centralized utility for handling QR code data in the QLK system.
 */

/**
 * Extracts a Product ID from various scanned text formats.
 * Supports:
 * 1. URL format: http://[host]:[port]/p/GUID (or /admin/products?id=GUID)
 * 2. JSON format: {"id": "GUID", "name": "..."}
 * 3. Raw GUID format
 */
export const extractProductId = (text: string): string => {
  if (!text) return '';
  
  const trimmed = text.trim();

  // Case 1: URL format (contains /p/ or ?id=)
  // This handles the new mobile-friendly QR codes
  if (trimmed.includes('/p/')) {
    const parts = trimmed.split('/p/');
    // Get the part after /p/ and remove any potential trailing query params
    return parts[parts.length - 1].split(/[?#]/)[0];
  }

  if (trimmed.includes('id=')) {
    try {
      const url = new URL(trimmed);
      const id = url.searchParams.get('id');
      if (id) return id;
    } catch {
      // Not a valid URL, continue to next checks
    }
  }

  // Case 2: JSON format
  // This handles the legacy internal QR code format
  try {
    const data = JSON.parse(trimmed);
    if (data && typeof data === 'object') {
      if (data.id) return data.id;
      if (data.ProductId) return data.ProductId;
    }
  } catch {
    // Not JSON, continue to raw check
  }

  // Case 3: Raw GUID or ID
  // Simple alphanumeric string with dashes
  return trimmed;
};

/**
 * Validates if a string looks like a UUID/GUID.
 */
export const isValidGuid = (id: string): boolean => {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return guidRegex.test(id);
};
