/**
 * Highlight Calculation Logic
 * 
 * Determines when to show celebration or GP consultation highlights based on:
 * - Days remaining until current age range ends
 * - Category-specific completion thresholds
 * 
 * Thresholds based on CDC/AAP guidelines (75% threshold for concern)
 * We use slightly different thresholds per category:
 * - Developmental: <70% triggers GP consultation
 * - Others (Teeth, Vision, Hearing, Growth): <90% triggers GP consultation
 * - Celebration: ≥80% in any category
 */

export interface CategoryProgress {
  category: string;
  total: number;
  achieved: number;
  percentage: number;
}

export interface Highlight {
  type: 'celebration' | 'gp_consultation';
  category?: string;
  categories?: string[];
  percentage?: number;
  message: string;
  detail?: string;
  daysUntilRangeEnds: number;
}

export interface HighlightConfig {
  daysBeforeRangeEnd: number;  // Show highlights when within X days of range ending
  celebrationThreshold: number;  // ≥75% triggers celebration
  developmentalConsultThreshold: number;  // <70% triggers GP consult for Developmental
  otherConsultThreshold: number;  // <90% triggers GP consult for Teeth, Vision, Hearing
}

export const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  daysBeforeRangeEnd: 15,
  celebrationThreshold: 75,
  developmentalConsultThreshold: 70,
  otherConsultThreshold: 90,
};

/**
 * Calculate days until the current age range ends
 * 
 * @param adjustedAgeMonths - Child's current age in months (based on due date)
 * @param ageRangeMax - The maximum month of the current age range
 * @returns Days until the child moves to the next age range (can be negative if already past)
 */
export function calculateDaysUntilRangeEnds(
  adjustedAgeMonths: number,
  adjustedAgeDays: number,
  ageRangeMax: number
): number {
  // Current position: adjustedAgeMonths months + adjustedAgeDays days
  // Target: ageRangeMax months
  // Calculate remaining days
  
  const monthsRemaining = ageRangeMax - adjustedAgeMonths;
  
  // Approximate: each month = 30.44 days
  const daysInMonths = Math.floor(monthsRemaining * 30.44);
  const daysRemaining = daysInMonths - adjustedAgeDays;
  
  return daysRemaining;
}

/**
 * Calculate category progress percentages
 */
export function calculateCategoryPercentage(achieved: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((achieved / total) * 100);
}

/**
 * Get the GP consultation threshold for a specific category
 */
export function getConsultThreshold(category: string, config: HighlightConfig = DEFAULT_HIGHLIGHT_CONFIG): number {
  if (category === 'Developmental') {
    return config.developmentalConsultThreshold;
  }
  return config.otherConsultThreshold;
}

/**
 * Calculate all highlights for a child based on their progress
 */
export function calculateHighlights(
  categoryProgress: CategoryProgress[],
  daysUntilRangeEnds: number,
  childName: string,
  config: HighlightConfig = DEFAULT_HIGHLIGHT_CONFIG
): Highlight[] {
  const highlights: Highlight[] = [];
  
  // Only show highlights if within the configured window before range ends
  // Must be between 0 and daysBeforeRangeEnd (e.g., 0-15 days remaining)
  // Negative values mean child has already moved past the range
  if (daysUntilRangeEnds < 0 || daysUntilRangeEnds > config.daysBeforeRangeEnd) {
    return highlights;
  }
  
  // Check for celebration highlights (any category ≥80%)
  const celebrationCategories = categoryProgress.filter(
    cp => cp.percentage >= config.celebrationThreshold && cp.total > 0
  );
  
  if (celebrationCategories.length > 0) {
    const topCategory = celebrationCategories.sort((a, b) => b.percentage - a.percentage)[0];
    highlights.push({
      type: 'celebration',
      category: topCategory.category,
      percentage: topCategory.percentage,
      message: `Amazing progress in ${topCategory.category}!`,
      detail: `${childName} has completed ${topCategory.percentage}% of ${topCategory.category.toLowerCase()} milestones for this age range. Keep up the great work!`,
      daysUntilRangeEnds,
    });
  }
  
  // Check for GP consultation highlights
  const concernCategories = categoryProgress.filter(cp => {
    if (cp.total === 0) return false;
    const threshold = getConsultThreshold(cp.category, config);
    return cp.percentage < threshold;
  });
  
  if (concernCategories.length > 0) {
    // Group concerns for a single, compassionate message
    const categoryNames = concernCategories.map(c => c.category.toLowerCase());
    const categoryList = categoryNames.length === 1 
      ? categoryNames[0]
      : categoryNames.slice(0, -1).join(', ') + ' and ' + categoryNames[categoryNames.length - 1];
    
    highlights.push({
      type: 'gp_consultation',
      categories: concernCategories.map(c => c.category),
      message: `Consider chatting with your GP`,
      detail: `${childName} is approaching a new developmental stage. A quick chat with your GP about ${categoryList} milestones could be helpful to ensure everything is on track.`,
      daysUntilRangeEnds,
    });
  }
  
  return highlights;
}

/**
 * Age range mapping (mirrors client/src/lib/age-calculation.ts)
 */
export function getAgeRange(months: number): { min: number; max: number; label: string } {
  if (months <= 3) return { min: 0, max: 3, label: '0-3 months' };
  if (months <= 6) return { min: 4, max: 6, label: '4-6 months' };
  if (months <= 9) return { min: 7, max: 9, label: '7-9 months' };
  if (months <= 12) return { min: 10, max: 12, label: '10-12 months' };
  if (months <= 18) return { min: 13, max: 18, label: '13-18 months' };
  if (months <= 24) return { min: 19, max: 24, label: '19-24 months' };
  if (months <= 30) return { min: 25, max: 30, label: '25-30 months' };
  if (months <= 36) return { min: 31, max: 36, label: '31-36 months' };
  if (months <= 49) return { min: 37, max: 49, label: '37-49 months' };
  return { min: 49, max: 60, label: '49-60 months' };
}
