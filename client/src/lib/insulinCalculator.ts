import { MealType } from "@shared/schema";
import { convertBgToMgdl } from "./correctionCalculator";

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
  correctionFactor?: number; // Insulin sensitivity factor - mg/dL BG lowered by 1 unit
  
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
    correctionFactor = 35, // Default: 1 unit lowers BG by 35 mg/dL
    longActingDosage = 0
  } = params;
  
  // Convert BG values from mmol/L to mg/dL for calculations
  const bgMgdl = convertBgToMgdl(bgValue);
  const targetBgMgdl = convertBgToMgdl(targetBgValue);

  // For long-acting insulin, we use the fixed dosage from settings
  if (mealType === "longActing") {
    return {
      mealInsulin: 0,
      correctionInsulin: 0,
      totalInsulin: longActingDosage,
      bgMgdl,
      calculationMethod: "Fixed long-acting insulin dosage"
    };
  }
  
  // Step 1: Calculate insulin for food (Meal Insulin)
  let mealInsulin = 0;
  let mealCalculationDetails = "No meal insulin";
  
  if (carbValue && carbValue > 0 && mealType !== "bedtime") {
    // Use the appropriate insulin-to-carb ratio based on meal type
    const ratio = mealType === "first" ? 
      (insulinToCarbohydrateRatio || 10) : // Default 1:10 for first meal
      (insulinToCarbohydrateRatio || 15);  // Default 1:15 for other meals
    
    mealInsulin = carbValue / ratio;
    mealCalculationDetails = `${carbValue}g ÷ ${ratio} = ${mealInsulin.toFixed(1)} units`;
  }
  
  // Step 2: Calculate correction insulin
  let correctionInsulin = 0;
  let correctionCalculationDetails = "No correction needed";
  
  // Only calculate correction if we have a non-zero correction factor
  if (correctionFactor > 0) {
    // Calculate correction insulin using the formula: (Current BG - Target BG) ÷ Correction Factor
    const bgDifference = bgMgdl - targetBgMgdl;
    
    // Only apply correction if blood glucose is outside target range
    if (Math.abs(bgDifference) > 20) { // Allow small range around target
      correctionInsulin = bgDifference / correctionFactor;
      
      // For bedtime, we typically use a more conservative approach
      if (mealType === "bedtime" && correctionInsulin > 0) {
        correctionInsulin = correctionInsulin * 0.75; // 25% reduction for bedtime
      }
      
      correctionCalculationDetails = 
        `(${bgMgdl.toFixed(0)} - ${targetBgMgdl.toFixed(0)}) ÷ ${correctionFactor} = ${correctionInsulin.toFixed(1)} units`;
    }
  }
  
  // Step 3: Calculate total insulin (round to nearest 0.5 units for practical administration)
  const rawTotalInsulin = mealInsulin + correctionInsulin;
  const totalInsulin = Math.round(rawTotalInsulin * 2) / 2; // Round to nearest 0.5
  
  // Build a description of the calculation method used
  const calculationMethod = 
    `Food insulin: ${mealCalculationDetails}\n` +
    `Correction: ${correctionCalculationDetails}\n` +
    `Total: ${mealInsulin.toFixed(1)} + ${correctionInsulin.toFixed(1)} = ${rawTotalInsulin.toFixed(1)} → ${totalInsulin} units`;
  
  return {
    mealInsulin: Math.round(mealInsulin * 10) / 10, // Round to 1 decimal place
    correctionInsulin: Math.round(correctionInsulin * 10) / 10, // Round to 1 decimal place
    totalInsulin,
    bgMgdl,
    calculationMethod
  };
}
