/**
 * Utility functions for handling company logos
 */

/**
 * Determines if a logo string represents an image (URL, data URL, or uploaded file)
 * @param logo - The logo string to check
 * @returns true if the logo is an image, false if it's text initials
 */
export function isImageLogo(logo: string): boolean {
  if (!logo) return false;
  
  return (
    logo.startsWith('data:') ||      // Data URLs
    logo.includes('http') ||          // HTTP/HTTPS URLs
    logo.startsWith('/uploads/') ||   // Uploaded files
    logo.startsWith('/images/')       // Static images
  );
}

/**
 * Validates and fixes a logo string to ensure it's either a valid image or proper text initials
 * @param logo - The logo string to validate
 * @param tradingName - The company trading name to use for generating initials
 * @returns A valid logo string (either image URL or text initials)
 */
export function validateLogo(logo: string, tradingName: string): string {
  // If logo is empty, null, or undefined, generate from trading name
  if (!logo || logo.trim().length === 0) {
    return generateTextLogo(tradingName);
  }

  // If logo is a valid image, keep it
  if (isImageLogo(logo)) {
    return logo;
  }

  // If logo is just numbers, regenerate from trading name
  if (/^\d+$/.test(logo)) {
    return generateTextLogo(tradingName);
  }

  // If logo contains only letters and is 1-3 characters, keep it (but uppercase)
  if (/^[A-Za-z]{1,3}$/.test(logo)) {
    return logo.toUpperCase();
  }

  // For any other invalid format, regenerate from trading name
  return generateTextLogo(tradingName);
}

/**
 * Generates text initials from a company trading name
 * @param tradingName - The company trading name
 * @returns 2-letter uppercase initials
 */
export function generateTextLogo(tradingName: string): string {
  if (!tradingName || tradingName.trim().length === 0) {
    return 'CO';
  }
  
  // Take first 2 characters and uppercase them
  return tradingName.trim().substring(0, 2).toUpperCase();
}