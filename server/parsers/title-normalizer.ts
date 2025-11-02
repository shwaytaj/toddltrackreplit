/**
 * SHARED TITLE NORMALIZATION
 * 
 * This module provides a single, consistent way to normalize milestone titles
 * across all parsers and matching operations. Using this shared function ensures
 * that title matching behaves identically everywhere.
 * 
 * The normalization is designed to be permissive enough to match similar titles
 * while preserving enough specificity to avoid false matches.
 */

/**
 * Normalize a milestone title for matching purposes.
 * 
 * This function applies consistent transformations to make title matching
 * more reliable while preserving the meaningful content of the title.
 * 
 * Transformations applied:
 * - Convert to lowercase
 * - Trim whitespace
 * - Normalize quotes (" and ' become standard quotes)
 * - Normalize dashes (– and — become -)
 * - Remove extra whitespace (multiple spaces become single space)
 * - Preserve parentheses content (important for disamb iguating similar titles)
 * 
 * @param title - The raw milestone title
 * @returns Normalized title suitable for comparison
 */
export function normalizeTitleForMatch(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Normalize various quote styles to standard quotes
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Normalize various dash styles to standard hyphen
    .replace(/[–—]/g, '-')
    // Normalize whitespace (multiple spaces to single space)
    .replace(/\s+/g, ' ')
    // Trim again after normalization
    .trim();
}

/**
 * Check if two titles match after normalization.
 * 
 * This is a convenience function that normalizes both titles and compares them.
 * 
 * @param title1 - First title to compare
 * @param title2 - Second title to compare
 * @returns true if the normalized titles match exactly
 */
export function titlesMatch(title1: string, title2: string): boolean {
  return normalizeTitleForMatch(title1) === normalizeTitleForMatch(title2);
}

/**
 * Find the best matching title from a list of candidates.
 * 
 * This function attempts to find an exact match after normalization.
 * Returns null if no match is found.
 * 
 * @param targetTitle - The title to find a match for
 * @param candidates - Array of candidate titles
 * @returns The matching candidate title, or null if no match found
 */
export function findMatchingTitle(
  targetTitle: string,
  candidates: string[]
): string | null {
  const normalizedTarget = normalizeTitleForMatch(targetTitle);
  
  for (const candidate of candidates) {
    if (normalizeTitleForMatch(candidate) === normalizedTarget) {
      return candidate;
    }
  }
  
  return null;
}
