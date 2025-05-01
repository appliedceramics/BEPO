import { CalculatorSettings } from "@/components/CalculatorSettings";
import { Navigation } from "@/components/Navigation";

export default function CalculatorSettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-6">
        <CalculatorSettings />
      </div>
    </div>
  );
}
