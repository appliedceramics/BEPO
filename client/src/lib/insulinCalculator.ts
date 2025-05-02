import { MealType } from "@shared/schema";
import { convertBgToMgdl } from "./correctionCalculator";

// Import the roundToInsulinDose function from correctionCalculator.ts
import { roundToInsulinDose } from "./correctionCalculator";

export interface CalculationResult {
  mealInsulin: number;
  correctionInsulin: number;
  totalInsulin: number;
  bgMgdl: number;
  calculationMethod: string;
}

export interface CalculationParams {
  // Meal-related parameters
  mealType: MealType;
  carbValue?: number;
  insulinToCarbohydrateRatio?: number; // Units of insulin per gram of carbs
  
  // Blood glucose related parameters
  bgValue: number; // Current blood glucose in mmol/L
  targetBgValue?: number; // Target blood glucose in mmol/L
  correctionFactor?: number; // Multiplier for correction amount
  insulinSensitivityFactor?: number; // Insulin sensitivity factor - mg/dL BG lowered by 1 unit
  
  // Fixed dosage for long-acting insulin
  longActingDosage?: number;
}

/**
 * Calculate insulin dosage based on the insulin-to-carb ratio and correction factor method
 * as outlined in diabetes management best practices.
 * 
 * This function implements the following formula:
 * 1. Food insulin = Carbs ÷ Insulin-to-Carb Ratio
 * 2. Correction insulin = (Current BG - Target BG) ÷ Correction Factor
 * 3. Total insulin = Food insulin + Correction insulin
 */
export function calculateInsulin(params: CalculationParams): CalculationResult {
  const { 
    mealType, 
    carbValue, 
    bgValue,
    insulinToCarbohydrateRatio,
    targetBgValue = 5.6, // Default target of 100 mg/dL (5.6 mmol/L)
    correctionFactor = 1.0, // Default multiplier for correction
    insulinSensitivityFactor = 35, // Default: 1 unit lowers BG by 35 mg/dL
    longActingDosage = 0
  } = params;
  
  // For long-acting insulin, we use the fixed dosage from settings and don't need BG values
  if (mealType === "longActing") {
    return {
      mealInsulin: 0,
      correctionInsulin: 0,
      totalInsulin: longActingDosage,
      bgMgdl: 0, // Not needed for long-acting insulin
      calculationMethod: "Fixed long-acting insulin dosage"
    };
  }
  
  // Convert BG values from mmol/L to mg/dL for calculations
  const bgMgdl = convertBgToMgdl(bgValue);
  const targetBgMgdl = convertBgToMgdl(targetBgValue);
  
  // Step 1: Calculate insulin for food (Meal Insulin)
  let mealInsulin = 0;
  let mealCalculationDetails = "No meal insulin";
  
  if (carbValue && carbValue > 0 && mealType !== "bedtime") {
    // Use the appropriate insulin-to-carb ratio based on meal type
    const ratio = mealType === "first" ? 
      (insulinToCarbohydrateRatio || 10) : // Default 1:10 for first meal
      (insulinToCarbohydrateRatio || 15);  // Default 1:15 for other meals
    
    const rawMealInsulin = carbValue / ratio;
    mealInsulin = roundToInsulinDose(rawMealInsulin); // Apply insulin rounding rules
    mealCalculationDetails = `${carbValue}g ÷ ${ratio} = ${rawMealInsulin.toFixed(1)} → ${mealInsulin} units`;
  }
  
  // Step 2: Calculate correction insulin
  let correctionInsulin = 0;
  let correctionCalculationDetails = "No correction needed";
  
  // Only calculate correction if we have a valid insulin sensitivity factor
  if (insulinSensitivityFactor > 0) {
    // Calculate correction insulin using the formula: (Current BG - Target BG) ÷ Insulin Sensitivity Factor
    const bgDifference = bgMgdl - targetBgMgdl;
    
    // Only apply correction if blood glucose is outside target range
    if (Math.abs(bgDifference) > 20) { // Allow small range around target
      // Base correction using Insulin Sensitivity Factor
      const baseCorrection = bgDifference / insulinSensitivityFactor;
      
      // For bedtime, we typically use a more conservative approach
      let rawCorrectionInsulin = baseCorrection;
      if (mealType === "bedtime" && baseCorrection > 0) {
        rawCorrectionInsulin = baseCorrection * 0.75; // 25% reduction for bedtime
      }
      
      // Apply insulin rounding rules
      correctionInsulin = roundToInsulinDose(rawCorrectionInsulin);
      
      // Detailed explanation of calculation for the user
      correctionCalculationDetails = 
        `(${bgMgdl.toFixed(0)} - ${targetBgMgdl.toFixed(0)}) ÷ ${insulinSensitivityFactor}`;
      
      // No longer using correction factor multiplier
      
      if (mealType === "bedtime" && bgDifference > 0) {
        correctionCalculationDetails += ` × 0.75 (bedtime)`;
      }
      
      correctionCalculationDetails += ` = ${rawCorrectionInsulin.toFixed(1)} → ${correctionInsulin} units`;
    }
  }
  
  // Step 3: Calculate total insulin using proper insulin dosing rounding rules
  const rawTotalInsulin = mealInsulin + correctionInsulin;
  // Import the roundToInsulinDose function from correctionCalculator
  const totalInsulin = roundToInsulinDose(rawTotalInsulin); // Use proper insulin rounding
  
  // Build a description of the calculation method used
  const calculationMethod = 
    `Food insulin: ${mealCalculationDetails}\n` +
    `Correction: ${correctionCalculationDetails}\n` +
    `Total: ${mealInsulin.toFixed(1)} + ${correctionInsulin.toFixed(1)} = ${rawTotalInsulin.toFixed(1)} → ${totalInsulin} units`;
  
  return {
    mealInsulin, // Already rounded using proper insulin rounding rules
    correctionInsulin, // Already rounded using proper insulin rounding rules
    totalInsulin,
    bgMgdl,
    calculationMethod
  };
}
