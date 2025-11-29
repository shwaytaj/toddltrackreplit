interface AgeResult {
  years: number;
  months: number;
  days: number;
}

/**
 * Calculate adjusted age from due date
 * Formula: Adjusted Age = Current Date - Due Date
 */
export function calculateAdjustedAge(dueDate: Date | string): AgeResult {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  let years = today.getFullYear() - due.getFullYear();
  let months = today.getMonth() - due.getMonth();
  let days = today.getDate() - due.getDate();
  
  if (days < 0) {
    months--;
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    days += lastMonth.getDate();
  }
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Handle case where due date is in the future
  if (years < 0) {
    return { years: 0, months: 0, days: 0 };
  }
  
  return { years, months, days };
}

/**
 * Get total months from adjusted age
 */
export function getAdjustedMonths(dueDate: Date | string): number {
  const age = calculateAdjustedAge(dueDate);
  return age.years * 12 + age.months;
}

/**
 * Get age range for milestone filtering based on adjusted age in months
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
