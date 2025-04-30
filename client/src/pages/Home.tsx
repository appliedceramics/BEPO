import { Calculator } from "@/components/Calculator";
import { InsulinLogDisplay } from "@/components/InsulinLog";
import { InsulinChart } from "@/components/InsulinChart";
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
      <div className="container mx-auto px-4 py-3 max-w-6xl">
        <header className="mb-4 flex items-center justify-center">
          <div className="flex items-center justify-center">
            <BepoLogo />
            <div className="ml-2">
              <div className="flex items-center">
                <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  BEPO Insulin Calculator
                </h1>
                <span className="text-accent font-bold mx-2">•</span>
                <span className="text-accent text-lg md:text-xl font-medium">
                  Log
                </span>
              </div>
              <p className="text-foreground/70 text-sm md:text-base max-w-lg">
                Fun and easy blood glucose tracking for the whole family
              </p>
            </div>
          </div>
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
          
          {logs.length > 0 && (
            <div className="mt-8">
              <InsulinChart logs={logs} />
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-foreground/70 border-t border-accent/20 pt-6">
          <p>This calculator is for informational purposes only. Always consult with your healthcare provider.</p>
          <p className="mt-1">© {new Date().getFullYear()} Motava Corp. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
