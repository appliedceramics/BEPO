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
        firstMealRatio: settings.firstMealRatio,
        otherMealRatio: settings.otherMealRatio,
        longActingDosage: settings.longActingDosage || '0',
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

  const updateRatioSetting = (field: 'firstMealRatio' | 'otherMealRatio' | 'longActingDosage' | 'correctionFactor', value: string | number) => {
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
  const adjustRatio = (field: 'firstMealRatio' | 'otherMealRatio' | 'longActingDosage' | 'correctionFactor', increment: boolean) => {
    // Make sure we're working with a number by explicitly parsing
    const currentValue = parseFloat((editableSettings[field] ?? settings[field]).toString());
    
    // Different step values based on the field
    let step;
    if (field === 'correctionFactor') {
      step = 0.1; // Small step for correction factor
    } else if (field === 'longActingDosage') {
      step = 1.0; // Whole units for long acting insulin
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
        firstMealRatio: editableSettings.firstMealRatio ?? settings.firstMealRatio,
        otherMealRatio: editableSettings.otherMealRatio ?? settings.otherMealRatio,
        longActingDosage: editableSettings.longActingDosage ?? (settings.longActingDosage || '0'),
        correctionFactor: editableSettings.correctionFactor ?? (settings.correctionFactor || '1.0'),
        mealCorrectionRanges: editableSettings.mealCorrectionRanges ?? settings.mealCorrectionRanges,
        bedtimeCorrectionRanges: editableSettings.bedtimeCorrectionRanges ?? settings.bedtimeCorrectionRanges,
        targetBgMin: editableSettings.targetBgMin ?? settings.targetBgMin,
        targetBgMax: editableSettings.targetBgMax ?? settings.targetBgMax,
      };
    }
    return {
      ...settings,
      longActingDosage: settings.longActingDosage || '0',
      correctionFactor: settings.correctionFactor || '1.0'
    };
  };

  const activeSettings = getActiveSettings();

  return (
    <div className="container mx-auto my-8 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 bg-primary/25">
            <AvatarImage src="/calculator-icon.png" alt="Calculator" />
            <AvatarFallback>
              <Calculator className="h-6 w-6 text-primary" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-foreground text-transparent bg-clip-text">My Calculator Settings</h1>
            <p className="text-muted-foreground">Personalize how your insulin calculator works</p>
          </div>
        </div>
        
        <div className="flex space-x-2 w-full md:w-auto">
          {isEditMode ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsEditMode(false)}
                disabled={isSaving || isResetting}
                size="lg"
                className="flex-1 md:flex-initial"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving || isResetting}
                size="lg"
                className="flex-1 md:flex-initial"
              >
                {isSaving ? "Saving..." : "Save Changes"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              onClick={() => setIsEditMode(true)}
              variant="default"
              size="lg"
              className="w-full md:w-auto"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Settings
            </Button>
          )}
        </div>
      </div>

      {/* Long Acting Insulin Dosage Card */}
      <Card className="mb-8 border-2 border-blue-200 shadow-lg bg-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-100">
          <CardTitle className="flex items-center text-blue-800">
            <span className="text-2xl mr-2">💉</span> 
            Long Acting Insulin Dosage
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-white p-4 border-2 border-blue-200 rounded-lg shadow-lg">
                  <p className="font-bold text-blue-800">What is Long Acting Insulin?</p>
                  <p className="mt-2">Long acting insulin is usually taken once daily to provide a constant, steady level of insulin for 24 hours.</p>
                  <p className="mt-2">It helps control your blood glucose between meals and overnight.</p>
                  <p className="mt-2">This dosage is typically set by your healthcare provider and remains the same each day.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Set your fixed daily long acting insulin dose
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow">
            <div className="flex items-center mb-2">
              <h3 className="font-bold text-blue-800">Daily Dosage</h3>
              <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 border-blue-300">
                24-hour insulin
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-blue-600">{parseFloat((isEditMode ? editableSettings.longActingDosage ?? activeSettings.longActingDosage : activeSettings.longActingDosage).toString()).toFixed(0)} units</span>
              {isEditMode && (
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="h-14 w-14 rounded-full border-2 border-blue-300 text-2xl font-bold"
                      onClick={() => adjustRatio('longActingDosage', false)}
                    >
                      -
                    </Button>
                    <div className="w-20 text-center">
                      <span className="text-2xl font-bold">
                        {parseFloat((editableSettings.longActingDosage ?? activeSettings.longActingDosage).toString()).toFixed(0)}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      variant="outline"
                      className="h-14 w-14 rounded-full border-2 border-blue-300 text-2xl font-bold"
                      onClick={() => adjustRatio('longActingDosage', true)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              )}
              <div className="text-blue-700 text-sm">
                <p>Fixed dosage with no carb or correction calculation</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div>
                <h4 className="font-semibold text-blue-800">Important Note</h4>
                <p className="mt-1 text-blue-700">
                  Long acting insulin is usually taken at the same time each day. This setting creates a simple option to log your fixed daily dose.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insulin to Carb Ratios Card */}
      <Card className="mb-8 border-2 border-amber-200 shadow-lg bg-amber-50">
        <CardHeader className="bg-gradient-to-r from-amber-200 to-amber-100">
          <CardTitle className="flex items-center text-amber-800">
            <span className="text-2xl mr-2">🍎</span> 
            Insulin-to-Carb Ratios
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <HelpCircle className="h-4 w-4 text-amber-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-white p-4 border-2 border-amber-200 rounded-lg shadow-lg">
                  <p className="font-bold text-amber-800">What is an Insulin-to-Carb Ratio?</p>
                  <p className="mt-2">This is how many grams of carbohydrates are covered by 1 unit of insulin.</p>
                  <p className="mt-2">For example, if your ratio is 1:10 (written as 10), it means you need 1 unit of insulin for every 10 grams of carbs you eat.</p>
                  <p className="mt-2">Most people have different ratios for different times of day!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-amber-700">
            Set how much insulin you need for the carbs you eat
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow">
              <div className="flex items-center mb-2">
                <h3 className="font-bold text-amber-800">First Meal Ratio</h3>
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                  Breakfast/Morning
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-amber-600">1:{isEditMode ? editableSettings.firstMealRatio ?? activeSettings.firstMealRatio : activeSettings.firstMealRatio}</span>
                {isEditMode && (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="h-14 w-14 rounded-full border-2 border-amber-300 text-2xl font-bold"
                        onClick={() => adjustRatio('firstMealRatio', false)}
                      >
                        -
                      </Button>
                      <div className="w-20 text-center">
                        <span className="text-2xl font-bold">
                          {parseFloat((editableSettings.firstMealRatio ?? activeSettings.firstMealRatio).toString()).toFixed(1)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="h-14 w-14 rounded-full border-2 border-amber-300 text-2xl font-bold"
                        onClick={() => adjustRatio('firstMealRatio', true)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}
                <div className="text-amber-700 text-sm">
                  <p>{isEditMode ? editableSettings.firstMealRatio ?? activeSettings.firstMealRatio : activeSettings.firstMealRatio} grams of carbs per 1 unit of insulin</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-amber-200 shadow">
              <div className="flex items-center mb-2">
                <h3 className="font-bold text-amber-800">Other Meals Ratio</h3>
                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-300">
                  Lunch/Dinner/Snacks
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-amber-600">1:{isEditMode ? editableSettings.otherMealRatio ?? activeSettings.otherMealRatio : activeSettings.otherMealRatio}</span>
                {isEditMode && (
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="h-14 w-14 rounded-full border-2 border-amber-300 text-2xl font-bold"
                        onClick={() => adjustRatio('otherMealRatio', false)}
                      >
                        -
                      </Button>
                      <div className="w-20 text-center">
                        <span className="text-2xl font-bold">
                          {parseFloat((editableSettings.otherMealRatio ?? activeSettings.otherMealRatio).toString()).toFixed(1)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="h-14 w-14 rounded-full border-2 border-amber-300 text-2xl font-bold"
                        onClick={() => adjustRatio('otherMealRatio', true)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}
                <div className="text-amber-700 text-sm">
                  <p>{isEditMode ? editableSettings.otherMealRatio ?? activeSettings.otherMealRatio : activeSettings.otherMealRatio} grams of carbs per 1 unit of insulin</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-100 rounded-lg border border-amber-300">
            <div className="flex items-start">
              <CheckCircle2 className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
              <div>
                <h4 className="font-semibold text-amber-800">Example calculation</h4>
                <p className="mt-1 text-amber-700">
                  If you eat <span className="font-bold">30 grams</span> of carbs at breakfast with a ratio of <span className="font-bold">1:{activeSettings.firstMealRatio}</span>, 
                  you would need <span className="font-bold">{(30 / activeSettings.firstMealRatio).toFixed(1)} units</span> of insulin.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Blood Glucose Range Card */}
      <Card className="mb-8 border-2 border-green-200 shadow-lg bg-green-50">
        <CardHeader className="bg-gradient-to-r from-green-200 to-green-100">
          <CardTitle className="flex items-center text-green-800">
            <span className="text-2xl mr-2">🎯</span> 
            Target Blood Glucose Range
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <HelpCircle className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-white p-4 border-2 border-green-200 rounded-lg shadow-lg">
                  <p className="font-bold text-green-800">What is a Target Range?</p>
                  <p className="mt-2">This is the range where your blood glucose is considered "in target".</p>
                  <p className="mt-2">When your blood glucose is in this range, you typically don't need any correction insulin.</p>
                  <p className="mt-2">Your healthcare provider helps decide what your target range should be.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-green-700">
            Set your ideal blood glucose range (mmol/L)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-white p-6 rounded-lg border border-green-200 shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xl font-semibold text-green-700">Minimum:</span>
                <div className="flex items-center">
                  {isEditMode ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 rounded-full border-2 border-green-300 text-xl font-bold"
                        onClick={() => adjustTargetBg('targetBgMin', false)}
                      >
                        -
                      </Button>
                      <div className="w-20 text-center">
                        <span className="text-2xl font-bold">
                          {parseFloat((editableSettings.targetBgMin ?? activeSettings.targetBgMin).toString()).toFixed(1)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 rounded-full border-2 border-green-300 text-xl font-bold"
                        onClick={() => adjustTargetBg('targetBgMin', true)}
                      >
                        +
                      </Button>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-green-600 mr-2">{activeSettings.targetBgMin}</span>
                  )}
                  <span className="text-green-700">mmol/L</span>
                </div>
              </div>
              
              <div className="text-center text-green-600 px-4">
                <span className="text-5xl font-bold">→</span>
              </div>

              <div className="text-right">
                <span className="text-xl font-semibold text-green-700">Maximum:</span>
                <div className="flex items-center justify-end">
                  {isEditMode ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 rounded-full border-2 border-green-300 text-xl font-bold"
                        onClick={() => adjustTargetBg('targetBgMax', false)}
                      >
                        -
                      </Button>
                      <div className="w-20 text-center">
                        <span className="text-2xl font-bold">
                          {parseFloat((editableSettings.targetBgMax ?? activeSettings.targetBgMax).toString()).toFixed(1)}
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-10 w-10 rounded-full border-2 border-green-300 text-xl font-bold"
                        onClick={() => adjustTargetBg('targetBgMax', true)}
                      >
                        +
                      </Button>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-green-600 mr-2">{activeSettings.targetBgMax}</span>
                  )}
                  <span className="text-green-700">mmol/L</span>
                </div>
              </div>
            </div>

            <div className="relative mt-10 mb-2">
              <div className="absolute h-5 w-full bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 rounded-full"></div>
              <div className="absolute h-5" 
                style={{
                  left: `${(activeSettings.targetBgMin / 14) * 100}%`,
                  width: `${((activeSettings.targetBgMax - activeSettings.targetBgMin) / 14) * 100}%`,
                  background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
                  borderRadius: '9999px'
                }}
              ></div>
              <div className="relative h-5 w-full">
                {/* Scale markers */}
                {[...Array(15)].map((_, i) => (
                  <div key={i} className="absolute bottom-5 transform translate-x-[-50%]" style={{ left: `${(i / 14) * 100}%` }}>
                    <div className="h-3 w-1 bg-gray-300"></div>
                    <div className="text-xs text-gray-500 mt-1">{i}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-300">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-semibold text-green-800">What this means</h4>
                  <p className="mt-1 text-green-700">
                    When your blood glucose is between <span className="font-bold">{activeSettings.targetBgMin}</span> and <span className="font-bold">{activeSettings.targetBgMax} mmol/L</span>, 
                    you typically won't need any correction insulin.
                  </p>
                  <p className="mt-1 text-green-700">
                    Above or below this range, the correction tables will help adjust your dose.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correction Charts Card */}
      <Card className="mb-8 border-2 border-blue-200 shadow-lg bg-blue-50">
        <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-100">
          <CardTitle className="flex items-center text-blue-800">
            <span className="text-2xl mr-2">📊</span> 
            Correction Charts
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-2">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-white p-4 border-2 border-blue-200 rounded-lg shadow-lg">
                  <p className="font-bold text-blue-800">What are Correction Charts?</p>
                  <p className="mt-2">These charts tell you how much extra insulin to add or subtract based on your current blood glucose level.</p>
                  <p className="mt-2">For example, if your blood glucose is higher than your target range, you may need to add correction insulin to bring it down.</p>
                  <p className="mt-2">These are personalized for each person and should be set by your healthcare provider.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Set how much insulin to add or subtract when your blood glucose is out of range
          </CardDescription>
          <div className="mt-4 bg-white p-3 rounded-lg border border-blue-300 shadow">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-blue-800">Sensitivity Factor: </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                Currently {parseFloat(activeSettings.correctionFactor.toString()).toFixed(1)}x
              </Badge>
              <div className="text-blue-700 text-sm ml-2">
                Multiply all correction values by this factor to adjust sensitivity
              </div>
            </div>
            {isEditMode && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 rounded-full border-2 border-blue-300 text-lg font-bold"
                  onClick={() => adjustRatio('correctionFactor', false)}
                >
                  -
                </Button>
                <div className="w-16 text-center">
                  <span className="text-lg font-bold">
                    {parseFloat((editableSettings.correctionFactor ?? activeSettings.correctionFactor).toString()).toFixed(1)}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 rounded-full border-2 border-blue-300 text-lg font-bold"
                  onClick={() => adjustRatio('correctionFactor', true)}
                >
                  +
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="meal">
            <TabsList className="w-full bg-blue-100 p-1">
              <TabsTrigger value="meal" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 flex-1 py-3">
                <span className="text-xl mr-2">🍽️</span> Mealtime Corrections
              </TabsTrigger>
              <TabsTrigger value="bedtime" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 flex-1 py-3">
                <span className="text-xl mr-2">😴</span> Bedtime Corrections
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="meal" className="pt-6">
              <div className="flex justify-end mb-4">
                {isEditMode && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleReset('meal')}
                    disabled={isResetting}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                )}
              </div>
              
              <div className="bg-white rounded-lg border border-blue-200 shadow overflow-hidden">
                <Table>
                  <TableCaption>Correction insulin based on blood glucose in mg/dL</TableCaption>
                  <TableHeader className="bg-blue-100">
                    <TableRow>
                      <TableHead className="font-bold text-blue-800">Blood Glucose Range (mg/dL)</TableHead>
                      <TableHead className="font-bold text-blue-800 text-right">Correction Insulin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSettings.mealCorrectionRanges.map((range: CorrectionRange, index: number) => (
                      <TableRow key={index} className={range.correction === 0 ? 'bg-blue-50' : ''}>
                        <TableCell className="font-medium">
                          {range.min} - {range.max} mg/dL
                          <div className="text-xs text-gray-500">
                            {(range.min / 18).toFixed(1)} - {(range.max / 18).toFixed(1)} mmol/L
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditMode ? (
                            <Input 
                              type="number" 
                              step="0.5"
                              min="-2"
                              max="10"
                              value={editableSettings.mealCorrectionRanges?.[index]?.correction ?? range.correction} 
                              onChange={(e) => updateCorrectionValue('meal', index, e.target.value)}
                              className="w-24 ml-auto border-blue-300 focus-visible:ring-blue-500"
                            />
                          ) : (
                            <span className={`font-bold ${range.correction > 0 ? 'text-blue-600' : range.correction < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                              {range.correction > 0 ? '+' : ''}{range.correction} units
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Example calculation</h4>
                    <p className="mt-1 text-blue-700">
                      If your blood glucose is <span className="font-bold">180 mg/dL (10.0 mmol/L)</span> at breakfast, 
                      you would add <span className="font-bold">+2.0 units</span> of correction insulin to your meal insulin.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="bedtime" className="pt-6">
              <div className="flex justify-end mb-4">
                {isEditMode && (
                  <Button 
                    variant="outline" 
                    onClick={() => handleReset('bedtime')}
                    disabled={isResetting}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Default
                  </Button>
                )}
              </div>
              
              <div className="bg-white rounded-lg border border-blue-200 shadow overflow-hidden">
                <Table>
                  <TableCaption>Bedtime correction insulin based on blood glucose in mg/dL</TableCaption>
                  <TableHeader className="bg-blue-100">
                    <TableRow>
                      <TableHead className="font-bold text-blue-800">Blood Glucose Range (mg/dL)</TableHead>
                      <TableHead className="font-bold text-blue-800 text-right">Correction Insulin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSettings.bedtimeCorrectionRanges.map((range: CorrectionRange, index: number) => (
                      <TableRow key={index} className={range.correction === 0 ? 'bg-blue-50' : ''}>
                        <TableCell className="font-medium">
                          {range.min} - {range.max} mg/dL
                          <div className="text-xs text-gray-500">
                            {(range.min / 18).toFixed(1)} - {(range.max / 18).toFixed(1)} mmol/L
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditMode ? (
                            <Input 
                              type="number" 
                              step="0.5"
                              min="-2"
                              max="10"
                              value={editableSettings.bedtimeCorrectionRanges?.[index]?.correction ?? range.correction} 
                              onChange={(e) => updateCorrectionValue('bedtime', index, e.target.value)}
                              className="w-24 ml-auto border-blue-300 focus-visible:ring-blue-500"
                            />
                          ) : (
                            <span className={`font-bold ${range.correction > 0 ? 'text-blue-600' : range.correction < 0 ? 'text-red-500' : 'text-gray-500'}`}>
                              {range.correction > 0 ? '+' : ''}{range.correction} units
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-100 rounded-lg border border-blue-300">
                <div className="flex items-start">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                  <div>
                    <h4 className="font-semibold text-blue-800">Important bedtime note</h4>
                    <p className="mt-1 text-blue-700">
                      The bedtime correction chart is usually more conservative (has a wider range with no correction) 
                      to prevent overnight low blood glucose.
                    </p>
                    <p className="mt-1 text-blue-700">
                      Always check your blood glucose 2 hours after a bedtime correction.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="mb-8 border-2 border-purple-200 shadow-lg bg-purple-50">
        <CardHeader className="bg-gradient-to-r from-purple-200 to-purple-100">
          <CardTitle className="flex items-center text-purple-800">
            <span className="text-2xl mr-2">🤔</span> 
            Frequently Asked Questions
          </CardTitle>
          <CardDescription className="text-purple-700">
            Common questions about calculator settings
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-purple-200">
              <AccordionTrigger className="text-purple-800 hover:text-purple-900 py-4">
                Why are my insulin ratios different for first meal vs. other meals?
              </AccordionTrigger>
              <AccordionContent className="text-purple-700 bg-white p-4 rounded-lg border border-purple-100">
                <p>Many people have higher insulin needs in the morning due to what's called the "dawn phenomenon." This is when your body naturally releases hormones that increase insulin resistance in the early morning hours.</p>
                <p className="mt-2">That's why your first meal (usually breakfast) often needs a stronger insulin-to-carb ratio (like 1:10) compared to other meals (like 1:15).</p>
                <p className="mt-2">Your healthcare provider will help determine the right ratios for you based on your specific needs.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2" className="border-purple-200">
              <AccordionTrigger className="text-purple-800 hover:text-purple-900 py-4">
                What is a negative correction value and when would I use it?
              </AccordionTrigger>
              <AccordionContent className="text-purple-700 bg-white p-4 rounded-lg border border-purple-100">
                <p>A negative correction value (like -0.5 units) is used when your blood glucose is below your target range.</p>
                <p className="mt-2">This means you should subtract that amount from your meal insulin to prevent your blood glucose from dropping too low after eating.</p>
                <p className="mt-2">For example, if your meal needs 4 units of insulin but your blood glucose is low with a -0.5 correction, you would take 3.5 units total.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3" className="border-purple-200">
              <AccordionTrigger className="text-purple-800 hover:text-purple-900 py-4">
                How often should I update my calculator settings?
              </AccordionTrigger>
              <AccordionContent className="text-purple-700 bg-white p-4 rounded-lg border border-purple-100">
                <p>You should only change your calculator settings after discussing with your healthcare provider.</p>
                <p className="mt-2">Generally, settings may need adjusting:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Every few months for growing children</li>
                  <li>During significant weight changes</li>
                  <li>During illness or stress periods</li>
                  <li>When changing insulin types</li>
                  <li>If you consistently see patterns of high or low blood glucose</li>
                </ul>
                <p className="mt-2">Always consult your healthcare team before making changes to these settings.</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4" className="border-purple-200">
              <AccordionTrigger className="text-purple-800 hover:text-purple-900 py-4">
                Why is the bedtime correction chart different from the mealtime one?
              </AccordionTrigger>
              <AccordionContent className="text-purple-700 bg-white p-4 rounded-lg border border-purple-100">
                <p>The bedtime correction chart is usually more conservative to reduce the risk of nighttime low blood glucose (hypoglycemia).</p>
                <p className="mt-2">This means it typically:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Has a wider range where no correction is needed</li>
                  <li>Suggests smaller insulin doses for high readings</li>
                  <li>May recommend larger negative corrections for low readings</li>
                </ul>
                <p className="mt-2">Safety during sleep is the priority with bedtime insulin dosing!</p>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5" className="border-purple-200">
              <AccordionTrigger className="text-purple-800 hover:text-purple-900 py-4">
                What should I do if I think my settings need to be changed?
              </AccordionTrigger>
              <AccordionContent className="text-purple-700 bg-white p-4 rounded-lg border border-purple-100">
                <p>If you think your settings need adjustment, follow these steps:</p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Track your patterns for at least 3-7 days (blood glucose before and after meals/insulin)</li>
                  <li>Note any consistent patterns (always high after breakfast, always low before lunch, etc.)</li>
                  <li>Contact your healthcare provider with this information</li>
                  <li>Never change settings without professional guidance</li>
                  <li>Remember that temporary factors (illness, stress, exercise) might affect your readings without needing permanent setting changes</li>
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
