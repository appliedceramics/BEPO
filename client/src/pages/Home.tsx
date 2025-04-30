import { Calculator } from "@/components/Calculator";
import { InsulinLogDisplay } from "@/components/InsulinLog";
import { useInsulinLogs } from "@/hooks/useInsulinLog";
import { MealType } from "@shared/schema";

export default function Home() {
  const { 
    logs, 
    isLoading, 
    createLog, 
    isPendingCreate, 
    deleteLog
  } = useInsulinLogs();

  const handleLogInsulin = (data: {
    mealType: MealType;
    carbValue?: number;
    bgValue: number;
    bgMgdl: number;
    mealInsulin: number;
    correctionInsulin: number;
    totalInsulin: number;
  }) => {
    createLog({
      mealType: data.mealType,
      carbValue: data.carbValue?.toString(),
      bgValue: data.bgValue.toString(),
      bgMgdl: data.bgMgdl.toString(),
      mealInsulin: data.mealInsulin.toString(),
      correctionInsulin: data.correctionInsulin.toString(),
      totalInsulin: data.totalInsulin.toString(),
    });
  };

  return (
    <div className="bg-neutral-50 font-sans text-neutral-900 min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-700 text-center">
            Insulin Calculator
          </h1>
          <p className="text-neutral-600 text-center mt-2">
            Calculate insulin dosage based on meals and blood glucose levels
          </p>
        </header>

        <main>
          <Calculator 
            onLogInsulin={handleLogInsulin} 
            isLogging={isPendingCreate}
          />
          <InsulinLogDisplay 
            logs={logs} 
            isLoading={isLoading} 
            onDelete={deleteLog}
          />
        </main>

        <footer className="mt-8 text-center text-sm text-neutral-500">
          <p>This calculator is for informational purposes only. Always consult with your healthcare provider.</p>
          <p className="mt-1">© {new Date().getFullYear()} Insulin Calculator. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
