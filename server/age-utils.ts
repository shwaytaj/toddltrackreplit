/**
 * Calculate corrected age for premature/post-mature babies
 * Backend utility matching frontend logic
 */

interface AgeResult {
  years: number;
  months: number;
  days: number;
}

interface CorrectedAgeResult {
  chronological: AgeResult;
  corrected: AgeResult;
  adjustmentWeeks: number;
  isPremature: boolean;
  isPostMature: boolean;
  shouldUseCorrectedAge: boolean;
}

function calculateAge(birthDate: Date | string): AgeResult {
  const birth = new Date(birthDate);
  birth.setHours(0, 0, 0, 0);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();
  
  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
  };
}

export function calculateCorrectedAge(
  birthDate: Date | string,
  dueDate?: Date | string | null
): CorrectedAgeResult {
  const chronological = calculateAge(birthDate);
  
  // If no due date provided, use chronological age only
  if (!dueDate) {
    return {
      chronological,
      corrected: chronological,
      adjustmentWeeks: 0,
      isPremature: false,
      isPostMature: false,
      shouldUseCorrectedAge: false,
    };
  }
  
  const birth = new Date(birthDate);
  birth.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  // Calculate adjustment in weeks
  const diffTime = due.getTime() - birth.getTime();
  const adjustmentWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
  
  const isPremature = adjustmentWeeks > 0; // born before due date
  const isPostMature = adjustmentWeeks < 0; // born after due date
  
  // Stop using corrected age after 3 years (36 months)
  const totalChronologicalMonths = chronological.years * 12 + chronological.months;
  const shouldUseCorrectedAge = totalChronologicalMonths < 36;
  
  // Calculate corrected age if applicable
  let corrected = chronological;
  
  if (shouldUseCorrectedAge && adjustmentWeeks !== 0) {
    // Convert adjustment weeks to months (using 4.345 weeks per month)
    const adjustmentMonths = adjustmentWeeks / 4.345;
    
    // Calculate total corrected months
    const totalCorrectedMonths = totalChronologicalMonths - adjustmentMonths;
    
    // Convert back to years, months, days
    const correctedYears = Math.floor(totalCorrectedMonths / 12);
    const correctedMonths = Math.floor(totalCorrectedMonths % 12);
    
    // Keep days the same as chronological
    corrected = {
      years: Math.max(0, correctedYears),
      months: Math.max(0, correctedMonths),
      days: chronological.days,
    };
  }
  
  return {
    chronological,
    corrected,
    adjustmentWeeks: Math.abs(adjustmentWeeks),
    isPremature,
    isPostMature,
    shouldUseCorrectedAge,
  };
}

/**
 * Get age in months for AI prompts (uses corrected age if applicable)
 */
export function getAgeInMonthsForAI(birthDate: Date | string, dueDate?: Date | string | null): number {
  const ageInfo = calculateCorrectedAge(birthDate, dueDate);
  const age = ageInfo.shouldUseCorrectedAge ? ageInfo.corrected : ageInfo.chronological;
  return age.years * 12 + age.months;
}
