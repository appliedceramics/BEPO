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
  
  // Check if this is a bedtime calculation (meal insulin is exactly 0, not undefined and correction insulin is not 0)
  const isBedtime = mealInsulin === 0 && correctionInsulin !== undefined && correctionInsulin !== 0;
  
  // Check if this is a long-acting insulin calculation (meal insulin equals total insulin and correction is 0)
  const isLongActing = mealInsulin !== undefined && totalInsulin !== undefined && 
                       mealInsulin === totalInsulin && 
                       (correctionInsulin === 0 || correctionInsulin === undefined);
  
  // Format insulin values - decimals for normal insulin, whole numbers for long acting
  const mealInsulinFormatted = mealInsulin !== undefined 
    ? isLongActing ? Math.round(mealInsulin).toString() : mealInsulin.toFixed(1) 
    : "--";
  const correctionFormatted = correctionInsulin !== undefined
    ? (correctionInsulin > 0 ? "+" : "") + correctionInsulin.toFixed(1)
    : "--";
  const totalInsulinFormatted = totalInsulin !== undefined 
    ? isLongActing ? Math.round(totalInsulin).toString() : totalInsulin.toFixed(1) 
    : "--";

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
    <div className="bepo-card mb-6 bg-gradient-to-br from-primary/10 to-accent/15">
      <div className="flex items-center mb-4">
        <InsulinIcon />
        <h3 className="ml-2 text-xl font-bold text-primary">
          {isBedtime ? "Bedtime Correction" : 
           isLongActing ? "Long Acting Dosage" : 
           "Calculation Results"}
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md border-2 border-accent/30">
          <p className="text-sm font-bold text-primary/80">
            {isBedtime ? "Bedtime Insulin" : 
             isLongActing ? "Long Acting Insulin" : 
             "Meal Insulin"}
          </p>
          <p id="meal-insulin" className="text-2xl font-bold text-primary">
            {mealInsulinFormatted} <span className="text-lg">units</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-2 border-accent/30">
          <p className="text-sm font-bold text-primary/80">Correction Insulin</p>
          <p id="correction-insulin" className={`text-2xl font-bold ${
            correctionInsulin && correctionInsulin > 0 
              ? "text-green-700" 
              : correctionInsulin && correctionInsulin < 0 
                ? "text-red-600" 
                : "text-primary"
          }`}>
            {correctionFormatted} <span className="text-lg">units</span>
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md border-2 border-red-400">
          <p className="text-sm font-bold text-red-600">Total Insulin</p>
          <p
            ref={totalRef}
            id="total-insulin"
            className="text-2xl font-bold text-red-700"
          >
            {totalInsulinFormatted} <span className="text-lg">units</span>
          </p>
        </div>
      </div>
      
      {correctionRange && !isLongActing && (
        <div id="correction-details" className="mt-5 p-4 text-sm rounded-md bg-blue-50 border-2 border-blue-200 shadow-sm">
          <p className="font-bold text-blue-700">
            Correction based on BG: <span id="correction-range" className="font-bold underline">{correctionRange}</span>
          </p>
        </div>
      )}
      
      {isBedtime && (
        <div className="mt-5 p-4 text-sm rounded-md bg-orange-100 border-2 border-orange-300 shadow-sm">
          <p className="font-bold text-orange-800">
            <span className="inline-block mr-2">⚠️</span>
            If correcting at bedtime, re-check blood glucose in 2 hours
          </p>
        </div>
      )}
      
      {isLongActing && (
        <div className="mt-5 p-4 text-sm rounded-md bg-blue-100 border-2 border-blue-300 shadow-sm">
          <p className="font-bold text-blue-800">
            <span className="inline-block mr-2">💊</span>
            Using your daily long-acting insulin dosage from settings
          </p>
        </div>
      )}
    </div>
  );
}
