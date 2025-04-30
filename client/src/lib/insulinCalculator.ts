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
}

export function calculateInsulin(params: CalculationParams): CalculationResult {
  const { mealType, carbValue, bgValue } = params;
  
  // Convert BG from mmol/L to mg/dL
  const bgMgdl = convertBgToMgdl(bgValue);

  // Calculate meal insulin based on meal type and carbs
  let mealInsulin = 0;
  if (mealType === "first" && carbValue) {
    mealInsulin = carbValue / 10;
  } else if (mealType === "other" && carbValue) {
    mealInsulin = carbValue / 15;
  }
  
  // Calculate correction insulin based on BG
  const { correction: correctionInsulin, range: correctionRange } = getCorrectionInsulin(bgMgdl);
  
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
