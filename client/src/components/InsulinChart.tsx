import { useMemo } from "react";
import { InsulinLog } from "@shared/schema";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface InsulinChartProps {
  logs: InsulinLog[];
}

export function InsulinChart({ logs }: InsulinChartProps) {
  // Prepare data for the chart - most recent 7 days
  const chartData = useMemo(() => {
    // Sort logs by date (newest first)
    const sortedLogs = [...logs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Take only the most recent 7 days of logs
    const recentLogs = sortedLogs.slice(0, Math.min(sortedLogs.length, 7));

    // Create chart data points
    return recentLogs.map(log => ({
      timestamp: format(new Date(log.timestamp), "MM/dd h:mm a"),
      mealInsulin: Number(log.mealInsulin),
      correctionInsulin: Number(log.correctionInsulin),
      totalInsulin: Number(log.totalInsulin),
      bgValue: Number(log.bgValue),
      mealType: log.mealType,
    })).reverse(); // Reverse to show oldest to newest
  }, [logs]);

  // If no logs, show a message
  if (logs.length === 0) {
    return null;
  }

  return (
    <div className="bepo-card">
      <h3 className="text-xl font-semibold text-primary mb-4">Insulin Usage Chart</h3>
      
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 70 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eaeaea" />
            <XAxis 
              dataKey="timestamp" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{ fontSize: 12 }} 
            />
            <YAxis yAxisId="left" orientation="left" label={{ value: 'Insulin Units', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Blood Glucose (mmol/L)', angle: 90, position: 'insideRight' }} />
            <Tooltip 
              formatter={(value, name) => {
                if (name === "bgValue") return [value + " mmol/L", "Blood Glucose"];
                return [value + " units", name === "mealInsulin" ? "Meal Insulin" : name === "correctionInsulin" ? "Correction" : "Total"];
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="mealInsulin" stackId="a" fill="#4C92D3" name="Meal Insulin" />
            <Bar yAxisId="left" dataKey="correctionInsulin" stackId="a" fill="#44BD7B" name="Correction" />
            <Bar yAxisId="right" dataKey="bgValue" fill="#f59e0b" name="Blood Glucose" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-3 text-sm rounded bg-blue-50 border border-blue-100">
        <p className="text-blue-700">
          Chart shows your most recent insulin doses and blood glucose readings.
        </p>
      </div>
    </div>
  );
}