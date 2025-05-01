import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type CorrectionRange } from '@shared/schema';

export type CalculatorSettings = {
  id?: number;
  userId?: number;
  firstMealRatio: number;
  otherMealRatio: number;
  longActingDosage: number | string;
  mealCorrectionRanges: CorrectionRange[];
  bedtimeCorrectionRanges: CorrectionRange[];
  targetBgMin: number;
  targetBgMax: number;
};

const CALCULATOR_SETTINGS_KEY = '/api/calculator-settings';
const DEFAULT_CHARTS_KEY = '/api/default-correction-charts';

export function useCalculatorSettings() {
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Get the user's calculator settings
  const { 
    data: settings, 
    isLoading: isLoadingSettings,
    error: settingsError 
  } = useQuery<CalculatorSettings>({
    queryKey: [CALCULATOR_SETTINGS_KEY],
  });

  // Get the default correction charts
  const { 
    data: defaultCharts, 
    isLoading: isLoadingDefaults,
  } = useQuery<{ mealCorrectionRanges: CorrectionRange[], bedtimeCorrectionRanges: CorrectionRange[] }>({
    queryKey: [DEFAULT_CHARTS_KEY],
  });

  // Save calculator settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<CalculatorSettings>) => {
      const response = await fetch(CALCULATOR_SETTINGS_KEY, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save settings');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CALCULATOR_SETTINGS_KEY] });
      toast({
        title: 'Success',
        description: 'Calculator settings saved successfully!',
      });
      setIsEditMode(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Reset corrections ranges to default
  const resetToDefaultsMutation = useMutation({
    mutationFn: async (type: 'meal' | 'bedtime' | 'both') => {
      if (!defaultCharts || !settings) {
        throw new Error('Default charts or current settings not available');
      }

      const updatedSettings: Partial<CalculatorSettings> = {};
      
      if (type === 'meal' || type === 'both') {
        updatedSettings.mealCorrectionRanges = defaultCharts.mealCorrectionRanges;
      }
      
      if (type === 'bedtime' || type === 'both') {
        updatedSettings.bedtimeCorrectionRanges = defaultCharts.bedtimeCorrectionRanges;
      }

      // Use the save mutation to update
      return saveSettingsMutation.mutateAsync(updatedSettings);
    },
    onSuccess: () => {
      toast({
        title: 'Settings Reset',
        description: 'Correction ranges have been reset to defaults.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: `Failed to reset settings: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    defaultCharts,
    isLoading: isLoadingSettings || isLoadingDefaults,
    error: settingsError,
    saveSettings: saveSettingsMutation.mutate,
    isSaving: saveSettingsMutation.isPending,
    resetToDefaults: resetToDefaultsMutation.mutate,
    isResetting: resetToDefaultsMutation.isPending,
    isEditMode,
    setIsEditMode,
  };
}
