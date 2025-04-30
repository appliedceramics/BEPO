import { Calculator } from "@/components/Calculator";
import { InsulinLogDisplay } from "@/components/InsulinLog";
import { useInsulinLogs } from "@/hooks/useInsulinLog";
import { MealType } from "@shared/schema";
import { BepoLogo } from "@/components/BepoLogo";
import { LogIcon } from "@/components/AnimatedIcons";

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
    <div className="min-h-screen font-sans">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <header className="mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center mb-3">
            <BepoLogo />
            <div className="ml-4">
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                BEPO Insulin Calculator
              </h1>
              <p className="text-accent text-lg md:text-xl font-medium mt-1">
                and Log
              </p>
            </div>
          </div>
          <p className="text-foreground/80 text-center mt-2 max-w-lg">
            Calculate insulin dosage based on meals and blood glucose levels with this fun and easy-to-use tool
          </p>
        </header>

        <main>
          <Calculator 
            onLogInsulin={handleLogInsulin} 
            isLogging={isPendingCreate}
          />
          
          <div className="mt-8 flex items-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent w-full max-w-4xl"></div>
            <div className="mx-4">
              <LogIcon />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent w-full max-w-4xl"></div>
          </div>
          
          <div className="mt-8">
            <InsulinLogDisplay 
              logs={logs} 
              isLoading={isLoading} 
              onDelete={deleteLog}
            />
          </div>
        </main>

        <footer className="mt-12 text-center text-sm text-foreground/70 border-t border-accent/20 pt-6">
          <p>This calculator is for informational purposes only. Always consult with your healthcare provider.</p>
          <p className="mt-1">© {new Date().getFullYear()} BEPO Insulin Calculator and Log. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
