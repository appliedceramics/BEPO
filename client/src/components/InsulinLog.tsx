import { useState } from "react";
import { InsulinLog as InsulinLogType } from "@shared/schema";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { LogIcon } from "./AnimatedIcons";
import { Loading } from "@/components/ui/loading";
import { DataTransition } from "@/components/ui/transition";
import { TableSkeleton } from "@/components/ui/content-skeleton";

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
    <div className="bepo-card bg-gradient-to-br from-white to-accent/10">
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center">
          <LogIcon />
          <h2 className="ml-2 text-xl font-bold text-primary">Insulin Log History</h2>
        </div>
        <button
          id="toggle-log"
          className="px-5 py-2 rounded-full bg-primary/15 hover:bg-primary/25 text-primary font-bold text-sm transition-all duration-300 border border-primary/20 shadow-sm"
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
          <Loading text="Loading log history..." variant="wave" className="py-8" />
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border-2 border-accent/30 shadow-md">
            <table className="min-w-full divide-y divide-accent/20">
              <thead className="bg-accent/15">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Date & Time</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Meal Type</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Carbs (g)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">BG (mmol/L)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">BG (mg/dL)</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Meal Insulin</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Correction</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Total Insulin</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-bold text-primary/80 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody id="log-entries" className="bg-white divide-y divide-accent/15">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-accent/5 transition-colors duration-150">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary/80">
                      {format(new Date(log.timestamp), "yyyy-MM-dd HH:mm")}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-primary">
                      {formatMealType(log.mealType)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                      {log.mealType === "bedtime" ? "-" : Number(log.carbValue).toFixed(0)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                      {Number(log.bgValue).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                      {Number(log.bgMgdl).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary">
                      {Number(log.mealInsulin).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <span className={Number(log.correctionInsulin) > 0 ? "text-green-700" : Number(log.correctionInsulin) < 0 ? "text-red-600" : "text-primary"}>
                        {Number(log.correctionInsulin) > 0 ? "+" : ""}
                        {Number(log.correctionInsulin).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-red-700">
                      {Number(log.totalInsulin).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-100 hover:text-red-800 font-medium border border-red-200 rounded-md"
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
            <p className="text-primary/80 bg-accent/15 py-5 px-8 rounded-lg inline-block border-2 border-accent/30 font-medium shadow-sm">
              No insulin doses logged yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
