import { useState, useEffect } from "react";
import { MealType } from "@shared/schema";
import { DosagePurposeSelector } from "./DosagePurposeSelector";
import { CarbInput } from "./CarbInput";
import { BloodGlucoseInput } from "./BloodGlucoseInput";
import { ResultsDisplay } from "./ResultsDisplay";
import { Button } from "@/components/ui/button";
import { calculateInsulin, CalculationResult } from "@/lib/insulinCalculator";
import { useCalculatorSettings } from "@/hooks/use-calculator-settings.tsx";

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
  
  // Get calculator settings for long-acting insulin dosage
  const { settings, isLoading: settingsLoading } = useCalculatorSettings();

  // Recalculate when inputs change
  useEffect(() => {
    if (mealType && bgValue !== undefined) {
      // For long-acting insulin, use the fixed dosage from settings
      if (mealType === "longActing" && settings) {
        // Parse the longActingDosage from settings and ensure it's a number
        const longActingDosage = settings.longActingDosage ? parseFloat(settings.longActingDosage.toString()) : 0;
        const result = calculateInsulin({
          mealType,
          bgValue,
        });
        
        // Override the calculated values with the fixed long-acting dosage
        result.mealInsulin = longActingDosage;
        result.totalInsulin = longActingDosage;
        
        setCalculationResult(result);
      }
      // For bedtime, calculate without carbs
      else if (mealType === "bedtime") {
        const result = calculateInsulin({
          mealType,
          bgValue,
        });
        setCalculationResult(result);
      }
      // For meal types that require carbs
      else if ((mealType === "first" || mealType === "other") && carbValue !== undefined) {
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
  }, [mealType, carbValue, bgValue, settings]);

  const handleLogInsulin = () => {
    if (!mealType || !calculationResult || bgValue === undefined) return;
    
    onLogInsulin({
      mealType,
      carbValue: (mealType === "bedtime" || mealType === "longActing") ? undefined : carbValue,
      bgValue,
      bgMgdl: calculationResult.bgMgdl,
      mealInsulin: calculationResult.mealInsulin,
      correctionInsulin: calculationResult.correctionInsulin,
      totalInsulin: calculationResult.totalInsulin,
    });
  };

  // Determine if log button should be disabled
  const logButtonDisabled = !calculationResult || !mealType || 
    (mealType !== "bedtime" && mealType !== "longActing" && carbValue === undefined) || 
    bgValue === undefined || isLogging || settingsLoading;

  return (
    <div className="bepo-card mb-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-white to-accent/5 opacity-50"></div>
      
      {/* Dosage Purpose Selector */}
      <div className="mb-6">
        <DosagePurposeSelector
          value={mealType}
          onChange={setMealType}
        />
      </div>
      
      {/* Carb Input - Hide for bedtime and long-acting */}
      {mealType !== "bedtime" && mealType !== "longActing" && (
        <div className="mb-6">
          <CarbInput
            value={carbValue}
            onChange={setCarbValue}
            hidden={false}
          />
        </div>
      )}

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
        className="w-full text-white font-medium text-lg py-6 bepo-button"
        onClick={handleLogInsulin}
        disabled={logButtonDisabled}
      >
        {isLogging ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Logging...
          </span>
        ) : (
          "Log Insulin Dose"
        )}
      </Button>
    </div>
  );
}
