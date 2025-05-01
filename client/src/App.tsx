import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { PageTransition } from "@/components/page-transition";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile-page";
import ProfileEditPage from "@/pages/profile-edit-page";
import AchievementsPage from "@/pages/achievements-page";
import CalculatorSettingsPage from "@/pages/calculator-settings-page";
import MealPlannerPage from "@/pages/meal-planner-page";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} requiresProfile={true} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/edit" component={ProfileEditPage} />
      <ProtectedRoute path="/achievements" component={AchievementsPage} />
      <ProtectedRoute path="/calculator-settings" component={CalculatorSettingsPage} />
      <ProtectedRoute path="/meal-planner" component={MealPlannerPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <PageTransition>
            <Router />
          </PageTransition>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
