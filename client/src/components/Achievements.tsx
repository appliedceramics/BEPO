import { useState, useEffect } from "react";
import { useAchievements } from "@/hooks/use-achievements";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Award, Medal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Animation for new achievements
const NewAchievementBadge = ({ emoji, name }: { emoji: string; name: string }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full px-4 py-2 shadow-lg"
    >
      <span className="text-xl">{emoji}</span>
      <div>
        <div className="font-bold">New Achievement!</div>
        <div className="text-sm">{name}</div>
      </div>
    </motion.div>
  );
};

export function AchievementCard({ achievement }: { achievement: any }) {
  const { milestone, progress, isComplete } = achievement;
  const { emoji, name, description, requiredCount } = milestone;
  
  return (
    <Card className={`overflow-hidden transition-all duration-200 ${isComplete ? 'border-green-500 bg-green-50/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emoji}</span>
            <CardTitle className="text-base">{name}</CardTitle>
          </div>
          {isComplete && (
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-500">
              <Award className="h-3 w-3 mr-1" /> Completed
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-medium">{progress} / {requiredCount}</span>
        </div>
        <Progress 
          value={(progress / requiredCount) * 100} 
          className={`h-2 ${isComplete ? 'bg-green-200' : ''}`}
          indicatorClassName={isComplete ? 'bg-gradient-to-r from-green-500 to-emerald-500' : ''}
        />
      </CardContent>
      {isComplete && (
        <CardFooter className="pt-0 text-xs text-muted-foreground">
          Completed on {new Date(achievement.earnedAt).toLocaleDateString()}
        </CardFooter>
      )}
    </Card>
  );
}

export function Achievements() {
  const { user } = useAuth();
  const { 
    achievements, 
    completedAchievements, 
    inProgressAchievements, 
    isLoading 
  } = useAchievements();
  
  const [newAchievement, setNewAchievement] = useState<any | null>(null);
  const [previouslyCompleted, setPreviouslyCompleted] = useState<number[]>([]);
  
  // Check for newly completed achievements
  useEffect(() => {
    if (!achievements?.length) return;
    
    const completedIds = completedAchievements.map(a => a.id);
    
    // Find new completed achievements that weren't in the previous list
    const newlyCompleted = completedAchievements.find(
      a => !previouslyCompleted.includes(a.id) && previouslyCompleted.length > 0
    );
    
    if (newlyCompleted) {
      setNewAchievement(newlyCompleted);
      // Hide the notification after 5 seconds
      setTimeout(() => setNewAchievement(null), 5000);
    }
    
    setPreviouslyCompleted(completedIds);
  }, [achievements, completedAchievements, previouslyCompleted]);
  
  if (!user) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!achievements?.length) {
    return (
      <div className="text-center p-8">
        <Medal className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
        <p className="text-muted-foreground mb-4">
          Start using the app to earn emoji rewards for your health milestones!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {newAchievement && (
          <NewAchievementBadge 
            emoji={newAchievement.milestone.emoji} 
            name={newAchievement.milestone.name} 
          />
        )}
      </AnimatePresence>
      
      <Tabs defaultValue="all">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            All ({achievements.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completed ({completedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="inprogress" className="flex-1">
            In Progress ({inProgressAchievements.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {achievements.map(achievement => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4 mt-4">
          {completedAchievements.length ? (
            completedAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))
          ) : (
            <p className="text-center text-muted-foreground p-4">
              No completed achievements yet. Keep going!
            </p>
          )}
        </TabsContent>
        
        <TabsContent value="inprogress" className="space-y-4 mt-4">
          {inProgressAchievements.length ? (
            inProgressAchievements.map(achievement => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))
          ) : (
            <p className="text-center text-muted-foreground p-4">
              All achievements completed! Great job!
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}