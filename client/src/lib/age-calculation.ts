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

/**
 * Calculate chronological age from birth date
 */
export function calculateAge(birthDate: Date | string): AgeResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const birth = new Date(birthDate);
  birth.setHours(0, 0, 0, 0);
  
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  let days = today.getDate() - birth.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return { years, months, days };
}

/**
 * Calculate corrected age based on due date and birth date
 * Corrected age is used for premature/post-mature babies until age 3
 */
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
 * Get age range for milestone filtering based on corrected age
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
 * Format age for display
 */
export function formatAge(age: AgeResult): string {
  if (age.years > 0) {
    const yearText = age.years === 1 ? 'year' : 'years';
    const monthText = age.months === 1 ? 'month' : 'months';
    return `${age.years} ${yearText}, ${age.months} ${monthText}`;
  }
  
  const monthText = age.months === 1 ? 'month' : 'months';
  const dayText = age.days === 1 ? 'day' : 'days';
  return `${age.months} ${monthText}, ${age.days} ${dayText}`;
}

/**
 * Format adjustment text for display
 */
export function formatAdjustment(
  adjustmentWeeks: number,
  isPremature: boolean,
  isPostMature: boolean
): string {
  if (adjustmentWeeks === 0) return '';
  
  const weekText = adjustmentWeeks === 1 ? 'week' : 'weeks';
  
  if (isPremature) {
    return `${adjustmentWeeks} ${weekText} premature`;
  }
  
  if (isPostMature) {
    return `${adjustmentWeeks} ${weekText} post-mature`;
  }
  
  return '';
}
