import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { HelpCircle, Save, RefreshCw, Calculator, ChevronRight, Edit, CheckCircle2 } from "lucide-react";
import { useCalculatorSettings, type CalculatorSettings } from "@/hooks/use-calculator-settings";
import { CorrectionRange } from "@shared/schema";
import { calculateAdjustedCorrection } from "@/lib/correctionCalculator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function CalculatorSettings() {
  const {
    settings,
    defaultCharts,
    isLoading,
    saveSettings,
    isSaving,
    resetToDefaults,
    isResetting,
    isEditMode,
    setIsEditMode
  } = useCalculatorSettings();

  // Create local state for editing
  const [editableSettings, setEditableSettings] = useState<Partial<CalculatorSettings>>({});
  
  // Initialize editable settings when original settings are loaded
  useEffect(() => {
    if (settings && Object.keys(editableSettings).length === 0) {
      setEditableSettings({
        // Insulin-to-carb ratios
        firstMealRatio: settings.firstMealRatio,
        otherMealRatio: settings.otherMealRatio,
        
        // New insulin sensitivity factor
        // @ts-ignore - New field that might not be in some CalculatorSettings types
        insulinSensitivityFactor: settings.insulinSensitivityFactor || 35,
        
        // New target blood glucose value
        // @ts-ignore - New field that might not be in some CalculatorSettings types
        targetBgValue: settings.targetBgValue || 5.6,
        
        // Long-acting insulin dosage
        longActingDosage: settings.longActingDosage || '0',
        
        // Legacy correction values
        correctionFactor: settings.correctionFactor || '1.0',
        mealCorrectionRanges: settings.mealCorrectionRanges,
        bedtimeCorrectionRanges: settings.bedtimeCorrectionRanges,
        targetBgMin: settings.targetBgMin,
        targetBgMax: settings.targetBgMax,
      });
    }
  }, [settings, editableSettings]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading settings...</div>;
  }

  if (!settings) {
    return <div className="flex justify-center p-8">Could not load settings</div>;
  }

  const handleSave = () => {
    saveSettings(editableSettings);
  };

  const handleReset = (type: 'meal' | 'bedtime' | 'both') => {
    resetToDefaults(type);
  };

  const updateRatioSetting = (field: 'firstMealRatio' | 'otherMealRatio' | 'longActingDosage' | 'correctionFactor' | 'insulinSensitivityFactor' | 'targetBgValue', value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue) && numValue >= 0) { // Changed from > 0 to >= 0 to allow zero for longActingDosage
      // Round differently based on the field
      let roundedValue;
      if (field === 'longActingDosage') {
        // Round to whole numbers for long acting insulin
        roundedValue = Math.round(numValue);
      } else {
        // Round to one decimal place for other values
        roundedValue = Math.round(numValue * 10) / 10;
      }
      setEditableSettings(prev => ({ ...prev, [field]: roundedValue }));
    }
  };
  
  // Function to increment or decrement ratio by a fixed amount
  const adjustRatio = (field: 'firstMealRatio' | 'otherMealRatio' | 'longActingDosage' | 'correctionFactor' | 'insulinSensitivityFactor' | 'targetBgValue', increment: boolean) => {
    // Make sure we're working with a number by explicitly parsing
    const currentValue = parseFloat((editableSettings[field] ?? settings[field]).toString());
    
    // Different step values based on the field
    let step;
    if (field === 'correctionFactor') {
      step = 0.1; // Small step for correction factor
    } else if (field === 'longActingDosage') {
      step = 1.0; // Whole units for long acting insulin
    } else if (field === 'insulinSensitivityFactor') {
      step = 1.0; // 1 unit for sensitivity factor (mg/dL)
    } else if (field === 'targetBgValue') {
      step = 0.1; // Small step for target BG value (mmol/L)
    } else {
      step = 0.5; // Default step for meal ratios
    }
    
    const newValue = increment ? currentValue + step : currentValue - step;
    
    // Don't allow values below minimum (different for correction factor)
    const minValue = field === 'correctionFactor' ? 0.5 : 0.0;
    if (newValue >= minValue) {
      updateRatioSetting(field, newValue);
    }
  };

  const updateTargetRange = (field: 'targetBgMin' | 'targetBgMax', value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (!isNaN(numValue) && numValue > 0) {
      // Round to one decimal place for consistency
      const roundedValue = Math.round(numValue * 10) / 10;
      setEditableSettings(prev => ({ ...prev, [field]: roundedValue }));
    }
  };
  
  // Function to increment or decrement blood glucose target by a fixed amount
  const adjustTargetBg = (field: 'targetBgMin' | 'targetBgMax', increment: boolean) => {
    // Make sure we're working with numbers by explicitly parsing
    const currentValue = parseFloat((editableSettings[field] ?? settings[field]).toString());
    const minValue = parseFloat((editableSettings.targetBgMin ?? settings.targetBgMin).toString());
    const maxValue = parseFloat((editableSettings.targetBgMax ?? settings.targetBgMax).toString());
    const step = 0.1; // Use a fixed step of 0.1 for BG values
    const newValue = increment ? currentValue + step : currentValue - step;
    
    // Don't allow values below minimum or above maximum
    if (field === 'targetBgMin' && newValue >= 3 && newValue < maxValue) {
      updateTargetRange(field, newValue);
    } else if (field === 'targetBgMax' && newValue > minValue && newValue <= 12) {
      updateTargetRange(field, newValue);
    }
  };

  const updateCorrectionValue = (type: 'meal' | 'bedtime', index: number, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    const rangeKey = type === 'meal' ? 'mealCorrectionRanges' : 'bedtimeCorrectionRanges';
    const ranges = [...(editableSettings[rangeKey] || settings[rangeKey])];
    ranges[index] = { ...ranges[index], correction: numValue };
    
    setEditableSettings(prev => ({ ...prev, [rangeKey]: ranges }));
  };

  const getActiveSettings = () => {
    if (isEditMode) {
      return {
        // Insulin-to-carb ratios
        firstMealRatio: editableSettings.firstMealRatio ?? settings.firstMealRatio,
        otherMealRatio: editableSettings.otherMealRatio ?? settings.otherMealRatio,
        
        // New insulin sensitivity and target fields 
        // @ts-ignore - New fields that might not be in some CalculatorSettings types
        insulinSensitivityFactor: editableSettings.insulinSensitivityFactor ?? (
          // @ts-ignore
          settings.insulinSensitivityFactor || 35
        ),
        // @ts-ignore
        targetBgValue: editableSettings.targetBgValue ?? (
          // @ts-ignore
          settings.targetBgValue || 5.6
        ),
        
        // Long acting insulin dosage
        longActingDosage: editableSettings.longActingDosage ?? (settings.longActingDosage || '0'),
        
        // Legacy correction values
        correctionFactor: editableSettings.correctionFactor ?? (settings.correctionFactor || '1.0'),
        mealCorrectionRanges: editableSettings.mealCorrectionRanges ?? settings.mealCorrectionRanges,
        bedtimeCorrectionRanges: editableSettings.bedtimeCorrectionRanges ?? settings.bedtimeCorrectionRanges,
        targetBgMin: editableSettings.targetBgMin ?? settings.targetBgMin,
        targetBgMax: editableSettings.targetBgMax ?? settings.targetBgMax,
      };
    }
    return {
      ...settings,
      // Default values for fields that might not exist in current settings
      // @ts-ignore - New fields that might not be in some CalculatorSettings types
      insulinSensitivityFactor: settings.insulinSensitivityFactor || 35,
      // @ts-ignore
      targetBgValue: settings.targetBgValue || 5.6,
      longActingDosage: settings.longActingDosage || '0',
      correctionFactor: settings.correctionFactor || '1.0'
    };
  };

  const activeSettings = getActiveSettings();
