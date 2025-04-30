import { Calculator } from "@/components/Calculator";
import { InsulinLogDisplay } from "@/components/InsulinLog";
import { InsulinChart } from "@/components/InsulinChart";
import { useInsulinLogs } from "@/hooks/useInsulinLog";
import { MealType } from "@shared/schema";
import { BepoLogo } from "@/components/BepoLogo";
import { LogIcon } from "@/components/AnimatedIcons";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { 
  CalculationsIcon, 
  TrackingIcon, 
  NotifyIcon, 
  VoiceInputIcon,
  MealPresetsIcon 
} from "@/components/FeatureIcons";

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

  const { user } = useAuth();

  return (
    <div className="min-h-screen font-sans flex flex-col">
      <Navigation />
      <div className="container mx-auto px-4 py-3 max-w-6xl flex-1">
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
                {user?.profile ? `Hello, ${user.profile.name}! ` : ''}
                Fun and easy blood glucose tracking for the whole family
              </p>
            </div>
          </div>
        </header>

        {/* Feature Boxes */}
        <div className="mb-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Feature 1: Accurate Calculations */}
            <div className="bepo-card bg-gradient-to-br from-white to-primary/5 p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <CalculationsIcon />
              </div>
              <h3 className="font-bold text-primary mb-2">Accurate Calculations</h3>
              <p className="text-sm text-primary/80">
                Precise insulin dose calculations based on BG readings and carb intake
              </p>
            </div>
            
            {/* Feature 2: Easy Tracking */}
            <div className="bepo-card bg-gradient-to-br from-white to-accent/5 p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <TrackingIcon />
              </div>
              <h3 className="font-bold text-primary mb-2">Easy Tracking</h3>
              <p className="text-sm text-primary/80">
                Keep a comprehensive log of insulin doses and blood glucose readings
              </p>
            </div>
            
            {/* Feature 3: Share with Parents */}
            <div className="bepo-card bg-gradient-to-br from-white to-primary/5 p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <NotifyIcon />
              </div>
              <h3 className="font-bold text-primary mb-2">SMS Notifications</h3>
              <p className="text-sm text-primary/80">
                Automatically notify parents of insulin doses via SMS messages
              </p>
            </div>
            
            {/* Feature 4: Voice Input */}
            <div className="bepo-card bg-gradient-to-br from-white to-accent/5 p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <VoiceInputIcon />
              </div>
              <h3 className="font-bold text-primary mb-2">Voice Input</h3>
              <p className="text-sm text-primary/80">
                Speak your blood glucose readings and carb values for easy entry
              </p>
            </div>
            
            {/* Feature 5: Meal Presets */}
            <div className="bepo-card bg-gradient-to-br from-white to-primary/5 p-4 flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
              <div className="mb-3">
                <MealPresetsIcon />
              </div>
              <h3 className="font-bold text-primary mb-2">Meal Presets</h3>
              <p className="text-sm text-primary/80">
                Save common foods with carb values for quick and easy selection
              </p>
            </div>
          </div>
        </div>

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
