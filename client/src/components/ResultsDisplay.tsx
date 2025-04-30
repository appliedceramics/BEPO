import { useEffect, useRef } from "react";

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
    <div className="bg-primary-50 rounded-md p-4 mb-6">
      <h3 className="text-lg font-medium text-primary-700 mb-2">Calculation Results</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-sm text-neutral-600">Meal Insulin</p>
          <p id="meal-insulin" className="text-xl font-semibold text-primary-800">
            {mealInsulinFormatted} units
          </p>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-sm text-neutral-600">Correction Insulin</p>
          <p id="correction-insulin" className="text-xl font-semibold text-primary-800">
            {correctionFormatted} units
          </p>
        </div>
        <div className="bg-white p-3 rounded shadow-sm">
          <p className="text-sm text-neutral-600">Total Insulin</p>
          <p
            ref={totalRef}
            id="total-insulin"
            className="text-xl font-semibold text-secondary-700"
          >
            {totalInsulinFormatted} units
          </p>
        </div>
      </div>
      {correctionRange && (
        <div id="correction-details" className="mt-3 text-sm text-neutral-700">
          <p>Correction based on BG: <span id="correction-range">{correctionRange}</span></p>
        </div>
      )}
    </div>
  );
}
