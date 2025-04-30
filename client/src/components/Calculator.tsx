import { useState, useEffect } from "react";
import { MealType } from "@shared/schema";
import { MealSelector } from "./MealSelector";
import { CarbInput } from "./CarbInput";
import { BloodGlucoseInput } from "./BloodGlucoseInput";
import { ResultsDisplay } from "./ResultsDisplay";
import { Button } from "@/components/ui/button";
import { calculateInsulin, CalculationResult } from "@/lib/insulinCalculator";

interface CalculatorProps {
  onLogInsulin: (data: {
    mealType: MealType;
    carbValue?: number;
    bgValue: number;
    bgMgdl: number;
    mealInsulin: number;
    correctionInsulin: number;
    totalInsulin: number;
  }) => void;
  isLogging: boolean;
}

export function Calculator({ onLogInsulin, isLogging }: CalculatorProps) {
  const [mealType, setMealType] = useState<MealType | "">("");
  const [carbValue, setCarbValue] = useState<number | undefined>(undefined);
  const [bgValue, setBgValue] = useState<number | undefined>(undefined);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  // Recalculate when inputs change
  useEffect(() => {
    if (mealType && bgValue !== undefined) {
      // For bedtime, calculate without carbs
      if (mealType === "bedtime") {
        const result = calculateInsulin({
          mealType,
          bgValue,
        });
        setCalculationResult(result);
      }
      // For meal types that require carbs
      else if (carbValue !== undefined) {
        const result = calculateInsulin({
          mealType,
          carbValue,
          bgValue,
        });
        setCalculationResult(result);
      }
    } else {
      setCalculationResult(null);
    }
  }, [mealType, carbValue, bgValue]);

  const handleLogInsulin = () => {
    if (!mealType || !calculationResult || bgValue === undefined) return;
    
    onLogInsulin({
      mealType,
      carbValue: mealType === "bedtime" ? undefined : carbValue,
      bgValue,
      bgMgdl: calculationResult.bgMgdl,
      mealInsulin: calculationResult.mealInsulin,
      correctionInsulin: calculationResult.correctionInsulin,
      totalInsulin: calculationResult.totalInsulin,
    });
  };

  // Determine if log button should be disabled
  const logButtonDisabled = !calculationResult || !mealType || 
    (mealType !== "bedtime" && carbValue === undefined) || 
    bgValue === undefined || isLogging;

  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-6">
      <h2 className="text-xl font-semibold text-primary-700 mb-4">Insulin Calculator</h2>
      
      {/* Meal Selection and Carb Input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <MealSelector
          value={mealType}
          onChange={(value) => setMealType(value)}
        />
        <CarbInput
          value={carbValue}
          onChange={setCarbValue}
          hidden={mealType === "bedtime"}
        />
      </div>

      {/* Blood Glucose Input */}
      <BloodGlucoseInput
        value={bgValue}
        onChange={setBgValue}
      />

      {/* Results Display */}
      <ResultsDisplay
        mealInsulin={calculationResult?.mealInsulin}
        correctionInsulin={calculationResult?.correctionInsulin}
        totalInsulin={calculationResult?.totalInsulin}
        correctionRange={calculationResult?.correctionRange}
      />

      {/* Log Button */}
      <Button
        id="log-insulin-btn"
        className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-medium"
        onClick={handleLogInsulin}
        disabled={logButtonDisabled}
      >
        {isLogging ? "Logging..." : "Log Insulin Dose"}
      </Button>
    </div>
  );
}
