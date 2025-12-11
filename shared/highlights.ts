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
  developmentalConsultThreshold: number;  // <75% triggers GP consult for Developmental
  otherConsultThreshold: number;  // <90% triggers GP consult for Teeth, Vision, Hearing
}

export const DEFAULT_HIGHLIGHT_CONFIG: HighlightConfig = {
  daysBeforeRangeEnd: 15,
  celebrationThreshold: 75,
  developmentalConsultThreshold: 75,
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
  
  // Celebration highlights show anytime a category reaches the threshold (no timing restriction)
  const celebrationCategories = categoryProgress
    .filter(cp => cp.percentage >= config.celebrationThreshold && cp.total > 0)
    .sort((a, b) => b.percentage - a.percentage);
  
  if (celebrationCategories.length > 0) {
    // Build message for single or multiple categories
    const categoryNames = celebrationCategories.map(c => c.category);
    const categoryList = categoryNames.length === 1 
      ? categoryNames[0]
      : categoryNames.slice(0, -1).join(', ') + ' and ' + categoryNames[categoryNames.length - 1];
    
    // Build detail with percentages for each category
    const categoryDetails = celebrationCategories
      .map(c => `${c.category} (${c.percentage}%)`)
      .join(', ');
    
    highlights.push({
      type: 'celebration',
      categories: categoryNames,
      category: celebrationCategories[0].category, // Keep for backwards compatibility
      percentage: celebrationCategories[0].percentage, // Show highest percentage in badge
      message: celebrationCategories.length === 1 
        ? `Amazing progress in ${categoryList}!`
        : `Amazing progress across ${celebrationCategories.length} categories!`,
      detail: celebrationCategories.length === 1
        ? `${childName} has completed ${celebrationCategories[0].percentage}% of ${categoryList.toLowerCase()} milestones for this age range. Keep up the great work!`
        : `${childName} is doing brilliantly in ${categoryDetails}. Keep up the great work!`,
      daysUntilRangeEnds,
    });
  }
  
  // GP consultation highlights only show within the 15-day window before range ends
  // Must be between 0 and daysBeforeRangeEnd (e.g., 0-15 days remaining)
  // Negative values mean child has already moved past the range
  const withinGPWindow = daysUntilRangeEnds >= 0 && daysUntilRangeEnds <= config.daysBeforeRangeEnd;
  
  if (withinGPWindow) {
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
        message: `A few milestones still to go 😊`,
        detail: `${childName} hasn't hit all the ${categoryList} milestones yet, but that's completely normal! Try out some of the activities we've recommended. If you've already worked through them and want some extra reassurance, a quick chat with your GP could be helpful.`,
        daysUntilRangeEnds,
      });
    }
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

/**
 * Get adjusted months accounting for range boundaries.
 * When a child is at a range boundary (e.g., exactly 30 months) plus additional days,
 * they've moved into the next range.
 */
export function getAdjustedMonthsForRange(baseMonths: number, days: number): number {
  // Age range boundaries where we need to check for overflow
  const rangeBoundaries = [3, 6, 9, 12, 18, 24, 30, 36, 49, 60];
  
  // If at a range boundary with extra days, child has moved to next range
  if (rangeBoundaries.includes(baseMonths) && days > 0) {
    return baseMonths + 1;
  }
  
  return baseMonths;
}
