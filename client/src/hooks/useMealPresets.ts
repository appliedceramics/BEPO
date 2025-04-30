import { useMutation, useQuery } from "@tanstack/react-query";
import { InsertMealPreset, MealPreset } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";

export function useMealPresets() {
  const { toast } = useToast();
  
  const {
    data: mealPresets = [],
    isLoading,
    error,
  } = useQuery<MealPreset[]>({
    queryKey: ["/api/meal-presets"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: async (presetData: InsertMealPreset) => {
      const res = await apiRequest("POST", "/api/meal-presets", presetData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-presets"] });
      toast({
        title: "Success",
        description: "Meal preset created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create meal preset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InsertMealPreset> }) => {
      const res = await apiRequest("PUT", `/api/meal-presets/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-presets"] });
      toast({
        title: "Success",
        description: "Meal preset updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update meal preset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/meal-presets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-presets"] });
      toast({
        title: "Success",
        description: "Meal preset deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete meal preset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  return {
    mealPresets,
    isLoading,
    error,
    createMutation,
    updateMutation,
    deleteMutation,
  };
}