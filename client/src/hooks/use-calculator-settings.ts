import { useQuery, useMutation } from '@tanstack/react-query';
import type { CalculatorSettings, UpdateCalculatorSettings } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';

export interface EnhancedCalculatorSettings extends CalculatorSettings {
  longActingDosage: number;
}

export function useCalculatorSettings() {
  const { data: settings, isLoading, error } = useQuery<EnhancedCalculatorSettings>({
    queryKey: ["/api/calculator-settings"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation to save settings
  const { mutate: saveSettings, isPending: isSaving } = useMutation({
    mutationFn: async (updatedSettings: Partial<UpdateCalculatorSettings>) => {
      const response = await fetch('/api/calculator-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSettings),
      });
      if (!response.ok) {
        throw new Error('Failed to save calculator settings');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculator-settings"] });
    },
  });

  // Mutation to reset settings to defaults
  const { mutate: resetToDefaults, isPending: isResetting } = useMutation({
    mutationFn: async (chartType: 'meal' | 'bedtime' | 'both') => {
      const response = await fetch('/api/default-correction-charts', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch default settings');
      }
      const defaultCharts = await response.json();
      
      // Prepare the update
      const updateData: Partial<UpdateCalculatorSettings> = {};
      
      if (chartType === 'meal' || chartType === 'both') {
        updateData.mealCorrectionRanges = defaultCharts.mealCorrectionRanges;
      }
      
      if (chartType === 'bedtime' || chartType === 'both') {
        updateData.bedtimeCorrectionRanges = defaultCharts.bedtimeCorrectionRanges;
      }
      
      // Save the reset charts
      const saveResponse = await fetch('/api/calculator-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!saveResponse.ok) {
        throw new Error('Failed to reset correction charts');
      }
      
      return await saveResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculator-settings"] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    saveSettings,
    isSaving,
    resetToDefaults,
    isResetting,
  };
}
