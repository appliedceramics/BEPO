import { MealType } from "@shared/schema";
import { getCorrectionInsulin, convertBgToMgdl } from "./correctionCalculator";

export interface CalculationResult {
  mealInsulin: number;
  correctionInsulin: number;
  totalInsulin: number;
  bgMgdl: number;
  correctionRange: string;
}

export interface CalculationParams {
  mealType: MealType;
  carbValue?: number;
  bgValue: number;
  correctionFactor?: number;
}

export function calculateInsulin(params: CalculationParams): CalculationResult {
  const { mealType, carbValue, bgValue, correctionFactor = 1.0 } = params;
  
  // Convert BG from mmol/L to mg/dL
  const bgMgdl = convertBgToMgdl(bgValue);

  // For long-acting insulin, we use the fixed dosage from settings
  if (mealType === "longActing") {
    // We'll get the actual value from settings in the Calculator component
    return {
      mealInsulin: 0, // This will be replaced with the longActingDosage from settings
      correctionInsulin: 0,
      totalInsulin: 0, // This will be replaced with the longActingDosage from settings
      bgMgdl,
      correctionRange: "Long-acting insulin"
    };
  }
  // For bedtime, we only use correction insulin without any meal insulin component
  else if (mealType === "bedtime") {
    // Calculate correction insulin based on BG and meal type
    const { correction: correctionInsulin, range: correctionRange } = getCorrectionInsulin(bgMgdl, mealType, correctionFactor);
    
    // For bedtime, total insulin is just the correction insulin
    return {
      mealInsulin: 0,
      correctionInsulin,
      totalInsulin: correctionInsulin,
      bgMgdl,
      correctionRange
    };
  } 
  // For regular meals
  else {
    // Calculate meal insulin based on meal type and carbs
    let mealInsulin = 0;
    if (mealType === "first" && carbValue) {
      mealInsulin = carbValue / 10;
    } else if (mealType === "other" && carbValue) {
      mealInsulin = carbValue / 15;
    }
    
    // Calculate correction insulin based on BG and meal type, applying the correction factor
    const { correction: correctionInsulin, range: correctionRange } = getCorrectionInsulin(bgMgdl, mealType, correctionFactor);
    
    // Calculate total insulin
    const totalInsulin = mealInsulin + correctionInsulin;
    
    return {
      mealInsulin,
      correctionInsulin,
      totalInsulin,
      bgMgdl,
      correctionRange
    };
  }
}
