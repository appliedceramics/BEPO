import { useState } from "react";
import { InsulinLog as InsulinLogType } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface InsulinLogProps {
  logs: InsulinLogType[];
  isLoading: boolean;
  onDelete: (id: number) => void;
}

export function InsulinLogDisplay({ logs, isLoading, onDelete }: InsulinLogProps) {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setExpanded((prev) => !prev);
  };
  
  // Format meal type for display
  const formatMealType = (mealType: string) => {
    switch (mealType) {
      case "first": return "First Meal";
      case "other": return "Other Meal";
      case "bedtime": return "Bedtime";
      default: return mealType;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary-700">Insulin Log History</h2>
        <button
          id="toggle-log"
          className="text-primary-600 hover:text-primary-800 text-sm font-medium"
          onClick={toggleExpanded}
        >
          {expanded ? "Hide Log" : "Show Log"}
        </button>
      </div>
      
      <div
        id="log-container"
        className={`overflow-hidden transition-height ${
          expanded ? "max-h-[500px]" : "max-h-0"
        }`}
      >
        {isLoading ? (
          <div className="py-4 text-center text-neutral-500">Loading log entries...</div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Meal Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Carbs (g)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">BG (mmol/L)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">BG (mg/dL)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Meal Insulin</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Correction</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Total Insulin</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody id="log-entries" className="bg-white divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500">
                      {format(new Date(log.timestamp), "yyyy-MM-dd hh:mm a")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {formatMealType(log.mealType)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {log.mealType === "bedtime" ? "-" : Number(log.carbValue).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {Number(log.bgValue).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {Number(log.bgMgdl).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {Number(log.mealInsulin).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      {Number(log.correctionInsulin) > 0 ? "+" : ""}
                      {Number(log.correctionInsulin).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-700">
                      {Number(log.totalInsulin).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => onDelete(log.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p id="no-logs-message" className="py-4 text-center text-neutral-500">
            No insulin doses logged yet
          </p>
        )}
      </div>
    </div>
  );
}
