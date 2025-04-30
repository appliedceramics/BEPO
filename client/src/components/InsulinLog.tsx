import { useState } from "react";
import { InsulinLog as InsulinLogType } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { LogIcon } from "./AnimatedIcons";

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
    <div className="bepo-card bg-gradient-to-br from-white to-accent/5">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <LogIcon />
          <h2 className="ml-2 text-xl font-semibold text-primary">Insulin Log History</h2>
        </div>
        <button
          id="toggle-log"
          className="px-4 py-2 rounded-full bg-primary/10 hover:bg-primary/20 text-primary font-medium text-sm transition-all duration-300"
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
          <div className="py-8 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full"></div>
            <p className="mt-2 text-primary/70">Loading log entries...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-accent/20">
            <table className="min-w-full divide-y divide-accent/20">
              <thead className="bg-accent/10">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">Meal Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">Carbs (g)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">BG (mmol/L)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">BG (mg/dL)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">Meal Insulin</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">Correction</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">Total Insulin</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-primary/70 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody id="log-entries" className="bg-white divide-y divide-accent/10">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/5 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary/70">
                      {format(new Date(log.timestamp), "yyyy-MM-dd hh:mm a")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary/90">
                      {formatMealType(log.mealType)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary/90">
                      {log.mealType === "bedtime" ? "-" : Number(log.carbValue).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary/90">
                      {Number(log.bgValue).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary/90">
                      {Number(log.bgMgdl).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary/90">
                      {Number(log.mealInsulin).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-primary/90">
                      <span className={Number(log.correctionInsulin) > 0 ? "text-green-600" : Number(log.correctionInsulin) < 0 ? "text-red-500" : ""}>
                        {Number(log.correctionInsulin) > 0 ? "+" : ""}
                        {Number(log.correctionInsulin).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary">
                      {Number(log.totalInsulin).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:bg-red-50 hover:text-red-700 rounded-full"
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
          <div id="no-logs-message" className="py-8 text-center">
            <p className="text-primary/60 bg-accent/10 py-4 px-6 rounded-lg inline-block border border-accent/20">
              No insulin doses logged yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
