import { MealPlanner } from "@/components/MealPlanner";
import { Navigation } from "@/components/Navigation";

// Simple header component for pages
const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col space-y-2 mb-6">
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    {description && <p className="text-muted-foreground">{description}</p>}
  </div>
);

export default function MealPlannerPage() {
  return (
    <div className="min-h-screen font-sans flex flex-col">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl flex-1">
        <PageHeader
          title="Meal Planner"
          description="Plan your meals and get carbohydrate information"
        />
        <MealPlanner />
      </div>
    </div>
  );
}
