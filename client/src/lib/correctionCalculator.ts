import { CorrectionRange } from "@shared/schema";

// Define the correction chart as an array of ranges and corrections
export const correctionChart: CorrectionRange[] = [
  { min: 0, max: 70, correction: -0.5 },
  { min: 70, max: 100, correction: -0.5 },
  { min: 101, max: 120, correction: 0 },
  { min: 121, max: 138, correction: 0.5 },
  { min: 139, max: 155, correction: 1 },
  { min: 156, max: 173, correction: 1.5 },
  { min: 174, max: 190, correction: 2 },
  { min: 191, max: 208, correction: 2.5 },
  { min: 209, max: 225, correction: 3 },
  { min: 226, max: 243, correction: 3.5 },
  { min: 244, max: 260, correction: 4 },
  { min: 261, max: 278, correction: 4.5 },
  { min: 279, max: 295, correction: 5 },
  { min: 296, max: 313, correction: 5.5 },
  { min: 314, max: 330, correction: 6 },
  { min: 331, max: 348, correction: 6.5 },
  { min: 349, max: 365, correction: 7 },
  { min: 366, max: 383, correction: 7.5 },
  { min: 384, max: 400, correction: 8 },
  { min: 401, max: 999, correction: 8.5 } // Upper bound for extreme high values
];

// Get correction insulin based on blood glucose in mg/dL
export function getCorrectionInsulin(bgMgdl: number): {
  correction: number;
  range: string;
} {
  // Find the appropriate range in the correction chart
  const range = correctionChart.find(range => 
    bgMgdl >= range.min && bgMgdl <= range.max
  );
  
  if (range) {
    return {
      correction: range.correction,
      range: `${range.min} to ${range.max} mg/dL = ${range.correction > 0 ? '+' : ''}${range.correction} units`
    };
  }
  
  // Default if no range found (should not happen with our ranges)
  return {
    correction: 0,
    range: 'No correction needed'
  };
}

// Convert blood glucose from mmol/L to mg/dL
export function convertBgToMgdl(bgMmolL: number): number {
  return bgMmolL * 18;
}
