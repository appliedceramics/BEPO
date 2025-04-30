import { Achievements } from "@/components/Achievements";
import { Navigation } from "@/components/Navigation";
import { PageHeader } from "@/components/ui/page-header";

export default function AchievementsPage() {
  return (
    <div className="container max-w-md mx-auto p-4">
      <PageHeader
        title="Achievements"
        description="Track your progress and earn rewards!"
      />
      <div className="mb-6">
        <Achievements />
      </div>
      <Navigation />
    </div>
  );
}