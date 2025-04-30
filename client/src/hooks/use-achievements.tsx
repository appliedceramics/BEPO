import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Milestone {
  id: number;
  type: string;
  name: string;
  description: string;
  requiredCount: number;
  emoji: string;
  createdAt: Date;
}

interface Achievement {
  id: number;
  userId: number;
  milestoneId: number;
  progress: number;
  isComplete: boolean;
  earnedAt: Date;
  data: Record<string, any>;
  milestone: Milestone;
}

export function useAchievements() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch all milestones
  const milestonesQuery = useQuery<Milestone[]>({
    queryKey: ['/api/milestones'],
    // Only fetch if user is authenticated
    enabled: !!user,
  });
  
  // Fetch user achievements
  const achievementsQuery = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
    // Only fetch if user is authenticated
    enabled: !!user,
  });
  
  // Track achievement progress
  const trackAchievementMutation = useMutation({
    mutationFn: async ({ type, increment }: { type: string, increment?: number }) => {
      const response = await fetch(`/api/track-achievement/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ increment }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to track achievement');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate achievements cache to refresh
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Achievement Tracking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Track an achievement
  const trackAchievement = (type: string, increment?: number) => {
    if (!user) return;
    trackAchievementMutation.mutate({ type, increment });
  };
  
  // Get completed achievements
  const getCompletedAchievements = () => {
    return achievementsQuery.data?.filter(a => a.isComplete) || [];
  };
  
  // Get in-progress achievements
  const getInProgressAchievements = () => {
    return achievementsQuery.data?.filter(a => !a.isComplete) || [];
  };
  
  // Get achievement by type
  const getAchievementByType = (type: string) => {
    return achievementsQuery.data?.find(a => a.milestone.type === type);
  };
  
  return {
    milestones: milestonesQuery.data || [],
    achievements: achievementsQuery.data || [],
    completedAchievements: getCompletedAchievements(),
    inProgressAchievements: getInProgressAchievements(),
    isLoading: milestonesQuery.isLoading || achievementsQuery.isLoading,
    isTracking: trackAchievementMutation.isPending,
    trackAchievement,
    getAchievementByType,
  };
}