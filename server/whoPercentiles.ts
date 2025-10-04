// WHO Growth Chart Percentile Calculations
// Using WHO Child Growth Standards LMS method

interface WHOData {
  ageMonths: number;
  L: number; // Box-Cox transformation
  M: number; // Median
  S: number; // Coefficient of variation
}

// WHO data for boys - weight (kg) by age (months) - expanded dataset
const boysWeightData: WHOData[] = [
  { ageMonths: 0, L: 0.3487, M: 3.3464, S: 0.14602 },
  { ageMonths: 3, L: 0.3487, M: 6.3846, S: 0.12385 },
  { ageMonths: 6, L: 0.3487, M: 7.9340, S: 0.11727 },
  { ageMonths: 9, L: 0.3487, M: 8.9077, S: 0.11316 },
  { ageMonths: 12, L: 0.3487, M: 9.6479, S: 0.11065 },
  { ageMonths: 18, L: 0.3487, M: 10.9476, S: 0.10507 },
  { ageMonths: 24, L: 0.3487, M: 12.2327, S: 0.10110 },
  { ageMonths: 36, L: 0.3487, M: 14.3214, S: 0.09647 },
  { ageMonths: 48, L: 0.3487, M: 16.2965, S: 0.09427 },
  { ageMonths: 60, L: 0.3487, M: 18.2677, S: 0.09385 },
];

const girlsWeightData: WHOData[] = [
  { ageMonths: 0, L: 0.3809, M: 3.2322, S: 0.14171 },
  { ageMonths: 3, L: 0.3809, M: 5.8450, S: 0.12619 },
  { ageMonths: 6, L: 0.3809, M: 7.2970, S: 0.12050 },
  { ageMonths: 9, L: 0.3809, M: 8.2250, S: 0.11687 },
  { ageMonths: 12, L: 0.3809, M: 8.9480, S: 0.11260 },
  { ageMonths: 18, L: 0.3809, M: 10.2310, S: 0.10730 },
  { ageMonths: 24, L: 0.3809, M: 11.4800, S: 0.10430 },
  { ageMonths: 36, L: 0.3809, M: 13.4550, S: 0.10070 },
  { ageMonths: 48, L: 0.3809, M: 15.4420, S: 0.09930 },
  { ageMonths: 60, L: 0.3809, M: 17.4710, S: 0.10030 },
];

// WHO data for boys - height (cm) by age (months)
const boysHeightData: WHOData[] = [
  { ageMonths: 0, L: 1, M: 49.88, S: 0.03795 },
  { ageMonths: 3, L: 1, M: 61.43, S: 0.03770 },
  { ageMonths: 6, L: 1, M: 67.62, S: 0.03513 },
  { ageMonths: 9, L: 1, M: 72.03, S: 0.03430 },
  { ageMonths: 12, L: 1, M: 75.75, S: 0.03370 },
  { ageMonths: 18, L: 1, M: 82.29, S: 0.03280 },
  { ageMonths: 24, L: 1, M: 87.08, S: 0.03265 },
  { ageMonths: 36, L: 1, M: 96.13, S: 0.03300 },
  { ageMonths: 48, L: 1, M: 103.26, S: 0.03390 },
  { ageMonths: 60, L: 1, M: 109.23, S: 0.03500 },
];

const girlsHeightData: WHOData[] = [
  { ageMonths: 0, L: 1, M: 49.15, S: 0.03790 },
  { ageMonths: 3, L: 1, M: 59.80, S: 0.03770 },
  { ageMonths: 6, L: 1, M: 65.73, S: 0.03560 },
  { ageMonths: 9, L: 1, M: 70.14, S: 0.03480 },
  { ageMonths: 12, L: 1, M: 73.95, S: 0.03420 },
  { ageMonths: 18, L: 1, M: 80.71, S: 0.03350 },
  { ageMonths: 24, L: 1, M: 85.70, S: 0.03330 },
  { ageMonths: 36, L: 1, M: 94.98, S: 0.03370 },
  { ageMonths: 48, L: 1, M: 102.39, S: 0.03470 },
  { ageMonths: 60, L: 1, M: 108.44, S: 0.03590 },
];

// WHO data for boys - head circumference (cm) by age (months)
const boysHeadData: WHOData[] = [
  { ageMonths: 0, L: 1, M: 34.46, S: 0.03686 },
  { ageMonths: 3, L: 1, M: 40.51, S: 0.02968 },
  { ageMonths: 6, L: 1, M: 43.30, S: 0.02871 },
  { ageMonths: 9, L: 1, M: 45.00, S: 0.02802 },
  { ageMonths: 12, L: 1, M: 46.09, S: 0.02780 },
  { ageMonths: 18, L: 1, M: 47.47, S: 0.02809 },
  { ageMonths: 24, L: 1, M: 48.32, S: 0.02862 },
  { ageMonths: 36, L: 1, M: 49.56, S: 0.02947 },
  { ageMonths: 48, L: 1, M: 50.35, S: 0.03007 },
  { ageMonths: 60, L: 1, M: 50.92, S: 0.03057 },
];

const girlsHeadData: WHOData[] = [
  { ageMonths: 0, L: 1, M: 33.87, S: 0.03496 },
  { ageMonths: 3, L: 1, M: 39.53, S: 0.02900 },
  { ageMonths: 6, L: 1, M: 42.20, S: 0.02821 },
  { ageMonths: 9, L: 1, M: 43.98, S: 0.02757 },
  { ageMonths: 12, L: 1, M: 45.15, S: 0.02731 },
  { ageMonths: 18, L: 1, M: 46.58, S: 0.02764 },
  { ageMonths: 24, L: 1, M: 47.49, S: 0.02815 },
  { ageMonths: 36, L: 1, M: 48.79, S: 0.02905 },
  { ageMonths: 48, L: 1, M: 49.62, S: 0.02970 },
  { ageMonths: 60, L: 1, M: 50.24, S: 0.03024 },
];

function interpolate(x: number, x1: number, x2: number, y1: WHOData, y2: WHOData): WHOData {
  const ratio = (x - x1) / (x2 - x1);
  return {
    ageMonths: x,
    L: y1.L + ratio * (y2.L - y1.L),
    M: y1.M + ratio * (y2.M - y1.M),
    S: y1.S + ratio * (y2.S - y1.S),
  };
}

function getWHOData(ageMonths: number, gender: string, type: string): WHOData | null {
  // Validate gender
  if (gender !== 'male' && gender !== 'female') {
    return null;
  }

  // Validate age range - WHO data is for 0-60 months
  if (ageMonths < 0 || ageMonths > 60) {
    return null;
  }

  let data: WHOData[];
  
  if (type === 'weight') {
    data = gender === 'male' ? boysWeightData : girlsWeightData;
  } else if (type === 'height') {
    data = gender === 'male' ? boysHeightData : girlsHeightData;
  } else if (type === 'head') {
    data = gender === 'male' ? boysHeadData : girlsHeadData;
  } else {
    return null;
  }

  // Find interpolation points
  for (let i = 0; i < data.length - 1; i++) {
    if (ageMonths >= data[i].ageMonths && ageMonths <= data[i + 1].ageMonths) {
      return interpolate(ageMonths, data[i].ageMonths, data[i + 1].ageMonths, data[i], data[i + 1]);
    }
  }

  // Exact match at boundary
  if (ageMonths === data[0].ageMonths) return data[0];
  if (ageMonths === data[data.length - 1].ageMonths) return data[data.length - 1];

  return null;
}

function normalCDF(z: number): number {
  // Approximation of the cumulative distribution function for the standard normal distribution
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - p : p;
}

export function calculatePercentile(
  value: number,
  ageMonths: number,
  gender: string,
  type: 'weight' | 'height' | 'head'
): number | null {
  const whoData = getWHOData(ageMonths, gender, type);
  
  if (!whoData) return null;

  const { L, M, S } = whoData;

  // Calculate Z-score using the LMS method
  const Z = (Math.pow(value / M, L) - 1) / (L * S);

  // Convert Z-score to percentile
  const percentile = normalCDF(Z) * 100;

  // Round to 1 decimal place and clamp to valid range
  return Math.max(0.1, Math.min(99.9, Math.round(percentile * 10) / 10));
}
