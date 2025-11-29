/**
 * Calculate adjusted age based on due date
 * Backend utility matching frontend logic
 * Formula: Adjusted Age = Current Date - Due Date
 */

interface AgeResult {
  years: number;
  months: number;
  days: number;
}

/**
 * Calculate adjusted age from due date
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
 * Get adjusted age in months for AI prompts and calculations
 */
export function getAgeInMonthsForAI(dueDate: Date | string): number {
  const age = calculateAdjustedAge(dueDate);
  return age.years * 12 + age.months;
}
