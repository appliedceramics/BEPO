import { Achievements } from "@/components/Achievements";
import { Navigation } from "@/components/Navigation";

// Simple header component for pages
const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="flex flex-col space-y-2 mb-6">
    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
    {description && <p className="text-muted-foreground">{description}</p>}
  </div>
);

export default function AchievementsPage() {
  return (
    <div className="min-h-screen font-sans flex flex-col">
      <Navigation />
      <div className="container max-w-md mx-auto px-4 py-8 flex-1">
        <PageHeader
          title="Achievements"
          description="Track your progress and earn rewards!"
        />
        <div className="mb-6">
          <Achievements />
        </div>
      </div>
    </div>
  );
}