import { useEffect, useRef } from "react";
import { InsulinIcon } from "./AnimatedIcons";

interface ResultsDisplayProps {
  mealInsulin: number | undefined;
  correctionInsulin: number | undefined;
  totalInsulin: number | undefined;
  correctionRange: string | undefined;
}

export function ResultsDisplay({
  mealInsulin,
  correctionInsulin,
  totalInsulin,
  correctionRange,
}: ResultsDisplayProps) {
  const totalRef = useRef<HTMLParagraphElement>(null);
  
  // Check if this is a bedtime calculation (meal insulin is exactly 0, not undefined)
  const isBedtime = mealInsulin === 0 && correctionInsulin !== undefined;
  
  // Format insulin values with 1 decimal place
  const mealInsulinFormatted = mealInsulin !== undefined ? mealInsulin.toFixed(1) : "--";
  const correctionFormatted = correctionInsulin !== undefined
    ? (correctionInsulin > 0 ? "+" : "") + correctionInsulin.toFixed(1)
    : "--";
  const totalInsulinFormatted = totalInsulin !== undefined ? totalInsulin.toFixed(1) : "--";

  // Add pulse animation when total insulin changes
  useEffect(() => {
    if (totalRef.current && totalInsulin !== undefined) {
      totalRef.current.classList.add("result-highlight");
      
      const timeout = setTimeout(() => {
        totalRef.current?.classList.remove("result-highlight");
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [totalInsulin]);

  return (
    <div className="bepo-card mb-6 bg-gradient-to-br from-primary/5 to-accent/10">
      <div className="flex items-center mb-3">
        <InsulinIcon />
        <h3 className="ml-2 text-lg font-medium text-primary">
          {isBedtime ? "Bedtime Correction" : "Calculation Results"}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-accent/20">
          <p className="text-sm text-primary/70">
            {isBedtime ? "Bedtime Insulin" : "Meal Insulin"}
          </p>
          <p id="meal-insulin" className="text-xl font-semibold text-primary">
            {mealInsulinFormatted} units
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-accent/20">
          <p className="text-sm text-primary/70">Correction Insulin</p>
          <p id="correction-insulin" className={`text-xl font-semibold ${
            correctionInsulin && correctionInsulin > 0 
              ? "text-green-600" 
              : correctionInsulin && correctionInsulin < 0 
                ? "text-red-500" 
                : "text-primary"
          }`}>
            {correctionFormatted} units
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary/30">
          <p className="text-sm text-secondary/70">Total Insulin</p>
          <p
            ref={totalRef}
            id="total-insulin"
            className="text-xl font-semibold text-secondary"
          >
            {totalInsulinFormatted} units
          </p>
        </div>
      </div>
      
      {correctionRange && (
        <div id="correction-details" className="mt-4 p-3 text-sm rounded-md bg-accent/10 border border-accent/20">
          <p className="font-medium text-accent-foreground">
            Correction based on BG: <span id="correction-range" className="font-semibold">{correctionRange}</span>
          </p>
        </div>
      )}
      
      {isBedtime && (
        <div className="mt-4 p-3 text-sm rounded-md bg-orange-50 border border-orange-200">
          <p className="font-medium text-orange-700">
            <span className="inline-block mr-2">⚠️</span>
            If correcting at bedtime, re-check blood glucose in 2 hours
          </p>
        </div>
      )}
    </div>
  );
}
