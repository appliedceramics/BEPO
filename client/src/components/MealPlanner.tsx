import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CalendarIcon, Utensils, ChevronDown, ChevronUp, Soup, Apple, GlassWater } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

// Define interfaces for the meal plan data structure
interface MealOption {
  name: string;
  description: string;
  carbValue: number;
  ingredients?: string[];
}

interface MealPlanDay {
  day: string;
  breakfast: MealOption;
  lunch: MealOption;
  dinner: MealOption;
  snacks: MealOption[];
  totalCarbs: number;
  tips: string;
}

interface MealPlan {
  overview: {
    title: string;
    description: string;
    averageDailyCarbs: number;
    dietaryFocus: string;
    targetBloodGlucose: string;
  };
  days: MealPlanDay[];
  generalTips: string[];
}

export function MealPlanner() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [activeDay, setActiveDay] = useState<string>('0'); // Index as string for Tabs
  
  // Form state
  const [dietType, setDietType] = useState<string>('balanced');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [carbMin, setCarbMin] = useState<string>('120');
  const [carbMax, setCarbMax] = useState<string>('180');
  const [duration, setDuration] = useState<string>('3');
  
  // Toggle for viewing restrictions
  const [showRestrictions, setShowRestrictions] = useState(false);
  
  // Dietary restriction options
  const restrictionOptions = [
    { id: 'gluten-free', label: 'Gluten-Free' },
    { id: 'dairy-free', label: 'Dairy-Free' },
    { id: 'nut-free', label: 'Nut-Free' },
    { id: 'vegetarian', label: 'Vegetarian' },
    { id: 'vegan', label: 'Vegan' },
    { id: 'low-sodium', label: 'Low-Sodium' },
    { id: 'low-fat', label: 'Low-Fat' },
    { id: 'keto-friendly', label: 'Keto-Friendly' },
  ];
  
  // Diet type options
  const dietTypeOptions = [
    { id: 'balanced', label: 'Balanced' },
    { id: 'low-carb', label: 'Low-Carb' },
    { id: 'mediterranean', label: 'Mediterranean' },
    { id: 'diabetes-friendly', label: 'Diabetes-Friendly' },
    { id: 'high-protein', label: 'High-Protein' },
  ];

  // Handle toggling dietary restrictions
  const toggleRestriction = (restrictionId: string) => {
    if (dietaryRestrictions.includes(restrictionId)) {
      setDietaryRestrictions(dietaryRestrictions.filter(id => id !== restrictionId));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restrictionId]);
    }
  };

  // Generate the meal plan
  const generateMealPlan = async () => {
    try {
      setIsLoading(true);
      setMealPlan(null);
      
      // Validate input
      const carbMinVal = parseInt(carbMin);
      const carbMaxVal = parseInt(carbMax);
      
      if (isNaN(carbMinVal) || isNaN(carbMaxVal) || carbMinVal > carbMaxVal) {
        toast({
          title: "Invalid carb range",
          description: "Please ensure the minimum is less than the maximum",
          variant: "destructive",
        });
        return;
      }
      
      // Build request body
      const requestBody = {
        dietType,
        dietaryRestrictions,
        carbTarget: {
          min: carbMinVal,
          max: carbMaxVal
        },
        duration: parseInt(duration)
      };
      
      const response = await apiRequest('POST', '/api/meal-plans', requestBody);
      const data = await response.json();
      
      setMealPlan(data);
      setActiveDay('0'); // Reset to first day
      
      toast({
        title: "Meal plan generated",
        description: "Your personalized meal plan is ready!"
      });
    } catch (error) {
      console.error("Error generating meal plan:", error);
      toast({
        title: "Error generating meal plan",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render the meal plan overview
  const renderOverview = () => {
    if (!mealPlan?.overview) return null;
    
    return (
      <Card className="mb-6 border-primary/20 bg-secondary/10">
        <CardHeader>
          <CardTitle className="text-xl font-semibold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
            {mealPlan.overview.title}
          </CardTitle>
          <CardDescription className="text-foreground/80">
            {mealPlan.overview.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center p-3 rounded-md bg-secondary/20">
              <span className="text-sm font-medium">Avg. Daily Carbs</span>
              <span className="text-xl font-bold text-primary">{mealPlan.overview.averageDailyCarbs}g</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-md bg-secondary/20">
              <span className="text-sm font-medium">Dietary Focus</span>
              <span className="text-lg font-semibold">{mealPlan.overview.dietaryFocus}</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-md bg-secondary/20">
              <span className="text-sm font-medium">Target BG Range</span>
              <span className="text-lg font-semibold">{mealPlan.overview.targetBloodGlucose}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render a meal option
  const renderMeal = (meal: MealOption, type: string) => {
    return (
      <Card className="mb-4 overflow-hidden border-primary/10">
        <CardHeader className="py-3 bg-secondary/10">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">{meal.name}</CardTitle>
            <Badge variant="outline" className="bg-primary/20">{meal.carbValue}g carbs</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground mb-3">{meal.description}</p>
          
          {meal.ingredients && meal.ingredients.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="ingredients">
                <AccordionTrigger className="text-sm font-medium py-2">
                  Ingredients
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {meal.ingredients.map((ingredient, idx) => (
                      <li key={idx}>{ingredient}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
      </Card>
    );
  };

  // Render a day's meal plan
  const renderDayPlan = (day: MealPlanDay) => {
    return (
      <div>
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{day.day}</h3>
            <Badge className="bg-primary text-primary-foreground">
              Total: {day.totalCarbs}g carbs
            </Badge>
          </div>
          
          <Separator className="my-2" />
          
          <p className="text-sm italic mb-4">{day.tips}</p>
          
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Breakfast</h4>
              </div>
              {renderMeal(day.breakfast, 'breakfast')}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Lunch</h4>
              </div>
              {renderMeal(day.lunch, 'lunch')}
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Soup className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Dinner</h4>
              </div>
              {renderMeal(day.dinner, 'dinner')}
            </div>
            
            {day.snacks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Apple className="h-4 w-4 text-primary" />
                  <h4 className="font-medium">Snacks</h4>
                </div>
                <div className="space-y-3">
                  {day.snacks.map((snack, idx) => (
                    <div key={idx}>
                      {renderMeal(snack, `snack-${idx}`)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render general tips
  const renderTips = () => {
    if (!mealPlan?.generalTips || mealPlan.generalTips.length === 0) return null;
    
    return (
      <Card className="mb-6 border-blue-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <GlassWater className="h-5 w-5 text-blue-500" /> 
            General Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            {mealPlan.generalTips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          AI-Powered Meal Planner
        </h2>
        <p className="text-muted-foreground">
          Generate a personalized meal plan with accurate carb counts, designed specifically for diabetes management.
        </p>
      </div>
      
      {!mealPlan && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Meal Plan</CardTitle>
            <CardDescription>
              Customize your meal plan based on your dietary needs and preferences.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="diet-type">Diet Type</Label>
                  <Select value={dietType} onValueChange={setDietType}>
                    <SelectTrigger id="diet-type">
                      <SelectValue placeholder="Select a diet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {dietTypeOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Plan Duration (Days)</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Day</SelectItem>
                      <SelectItem value="3">3 Days</SelectItem>
                      <SelectItem value="5">5 Days</SelectItem>
                      <SelectItem value="7">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Dietary Restrictions</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowRestrictions(!showRestrictions)}
                    className="h-8 px-2"
                  >
                    {showRestrictions ? (
                      <><ChevronUp className="h-4 w-4 mr-1" /> Hide</>
                    ) : (
                      <><ChevronDown className="h-4 w-4 mr-1" /> Show</>
                    )}
                  </Button>
                </div>
                
                {showRestrictions && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {restrictionOptions.map(option => (
                      <div 
                        key={option.id} 
                        className={`
                          p-2 rounded-md border cursor-pointer flex items-center
                          ${dietaryRestrictions.includes(option.id) 
                            ? 'bg-primary/20 border-primary' 
                            : 'bg-secondary/10 border-secondary/30 hover:bg-secondary/20'}
                        `}
                        onClick={() => toggleRestriction(option.id)}
                      >
                        <div className="flex-1">{option.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Daily Carbohydrate Target (grams)</Label>
                <div className="flex items-center space-x-2">
                  <div className="grid w-full grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="carb-min" className="text-xs">Minimum</Label>
                      <Input 
                        id="carb-min" 
                        type="number" 
                        min="50" 
                        max="300" 
                        value={carbMin}
                        onChange={(e) => setCarbMin(e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="carb-max" className="text-xs">Maximum</Label>
                      <Input 
                        id="carb-max" 
                        type="number" 
                        min="50" 
                        max="300" 
                        value={carbMax}
                        onChange={(e) => setCarbMax(e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={generateMealPlan} 
              disabled={isLoading} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Meal Plan"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {mealPlan && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Your Meal Plan</h3>
            <Button variant="outline" onClick={() => setMealPlan(null)}>
              Create New Plan
            </Button>
          </div>
          
          {renderOverview()}
          {renderTips()}
          
          <Tabs value={activeDay} onValueChange={setActiveDay}>
            <TabsList className="w-full grid grid-cols-7 sm:flex sm:justify-start">
              {mealPlan.days.map((day, idx) => (
                <TabsTrigger key={idx} value={idx.toString()} className="text-sm">
                  {day.day.replace('Day ', '')}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {mealPlan.days.map((day, idx) => (
              <TabsContent key={idx} value={idx.toString()}>
                {renderDayPlan(day)}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
