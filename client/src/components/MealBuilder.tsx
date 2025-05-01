import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DynamicFoodSearch, FoodItem } from "./DynamicFoodSearch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Trash2, Plus, Save, ArrowRight, Pizza } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

// Function to assign colors based on food categories
function getCategoryColor(foodName: string): string {
  const name = foodName.toLowerCase();
  
  // Main categories with their colors
  if (name.includes('burger') || name.includes('sandwich') || name.includes('meat') || name.includes('chicken') || name.includes('beef') || name.includes('pork')) {
    return '#ef4444'; // Red for proteins/meats
  }
  
  if (name.includes('fries') || name.includes('potato') || name.includes('bread') || name.includes('rice') || name.includes('pasta')) {
    return '#f59e0b'; // Amber for starches
  }
  
  if (name.includes('salad') || name.includes('vegetable') || name.includes('broccoli') || name.includes('spinach')) {
    return '#10b981'; // Green for vegetables
  }
  
  if (name.includes('fruit') || name.includes('apple') || name.includes('banana') || name.includes('berry')) {
    return '#8b5cf6'; // Purple for fruits
  }
  
  if (name.includes('cake') || name.includes('ice cream') || name.includes('cookie') || name.includes('dessert') || name.includes('sweet')) {
    return '#ec4899'; // Pink for desserts
  }
  
  if (name.includes('soda') || name.includes('drink') || name.includes('juice') || name.includes('coffee') || name.includes('tea')) {
    return '#0ea5e9'; // Blue for drinks
  }
  
  // Default color for uncategorized items
  return '#6b7280'; // Gray
}

interface MealBuilderProps {
  onComplete: (totalCarbs: number) => void;
  onSavePreset?: (preset: {
    name: string;
    description: string;
    carbValue: number;
  }) => void;
}

export function MealBuilder({ onComplete, onSavePreset }: MealBuilderProps) {
  const { toast } = useToast();
  const [mealItems, setMealItems] = useState<Array<FoodItem & { id: string }>>([]);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [mealName, setMealName] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [mode, setMode] = useState<"build" | "save">("build");

  // Add item to the meal
  const handleAddItem = (item: FoodItem) => {
    const newItem = {
      ...item,
      id: `${item.name}-${Date.now()}`, // Create unique ID
      portionSize: item.portionSize || "medium", // Default to medium
    };

    setMealItems((prev) => [...prev, newItem]);
    updateTotalCarbs([...mealItems, newItem]);
    
    toast({
      title: "Item added",
      description: `${item.name} added to your meal`,
    });
  };

  // Remove item from the meal
  const handleRemoveItem = (id: string) => {
    const updatedItems = mealItems.filter(item => item.id !== id);
    setMealItems(updatedItems);
    updateTotalCarbs(updatedItems);
  };

  // Change portion size for an item
  const handleChangePortion = (id: string, size: "small" | "medium" | "large") => {
    const updatedItems = mealItems.map(item => {
      if (item.id === id) {
        return { ...item, portionSize: size };
      }
      return item;
    });
    
    setMealItems(updatedItems);
    updateTotalCarbs(updatedItems);
  };

  // Calculate total carbs from all items
  const updateTotalCarbs = (items: Array<FoodItem & { id: string }>) => {
    const total = items.reduce((sum, item) => {
      const portionSize = item.portionSize || "medium";
      return sum + item.portions[portionSize].carbValue;
    }, 0);
    
    setTotalCarbs(total);
  };

  // Complete the meal and return total carbs
  const handleCompleteMeal = () => {
    if (mealItems.length === 0) {
      toast({
        title: "No items in meal",
        description: "Please add at least one item to your meal",
        variant: "destructive"
      });
      return;
    }
    
    onComplete(totalCarbs);
  };

  // Save the meal as a preset
  const handleSavePreset = () => {
    if (!mealName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for your meal preset",
        variant: "destructive"
      });
      return;
    }

    if (mealItems.length === 0) {
      toast({
        title: "No items in meal",
        description: "Please add at least one item to your meal",
        variant: "destructive"
      });
      return;
    }

    const description = mealDescription || 
      mealItems.map(item => `${item.name} (${item.portions[item.portionSize || "medium"].carbValue}g)`).join(", ");

    onSavePreset?.({ 
      name: mealName, 
      description, 
      carbValue: totalCarbs 
    });
    
    // Reset after saving
    setMealName("");
    setMealDescription("");
    setMode("build");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Utensils className="h-5 w-5" />
          <span>Meal Builder</span>
        </CardTitle>
        <CardDescription>
          Build your complete meal by searching and adding multiple food items
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="build" value={mode} onValueChange={(v) => setMode(v as "build" | "save")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build">Build Meal</TabsTrigger>
            <TabsTrigger value="save">Save Preset</TabsTrigger>
          </TabsList>
          
          <TabsContent value="build" className="space-y-4">
            <div className="space-y-4">
              <div>
                <DynamicFoodSearch 
                  onSelect={handleAddItem} 
                  clearOnSelect={false} 
                  placeholderText="Search for foods to add to your meal..."
                />
                {mealItems.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Plus className="h-3 w-3" />
                    Continue searching to add more items to your meal
                  </p>
                )}
              </div>
              
              {mealItems.length > 0 && (
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-2">
                    {mealItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden border-l-4" style={{ borderLeftColor: getCategoryColor(item.name) }}>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <Badge className="ml-2">
                                  {item.portions[item.portionSize || "medium"].carbValue}g
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-7 w-7 text-destructive ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Portion size:</div>
                            <TabsList className="grid grid-cols-3 h-7">
                              <TabsTrigger 
                                value="small" 
                                className={`text-xs px-1 ${item.portionSize === 'small' ? 'active' : ''}`}
                                onClick={() => handleChangePortion(item.id, "small")}
                              >
                                Small
                              </TabsTrigger>
                              <TabsTrigger 
                                value="medium" 
                                className={`text-xs px-1 ${item.portionSize === 'medium' ? 'active' : ''}`}
                                onClick={() => handleChangePortion(item.id, "medium")}
                              >
                                Medium
                              </TabsTrigger>
                              <TabsTrigger 
                                value="large" 
                                className={`text-xs px-1 ${item.portionSize === 'large' ? 'active' : ''}`}
                                onClick={() => handleChangePortion(item.id, "large")}
                              >
                                Large
                              </TabsTrigger>
                            </TabsList>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="save" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="meal-name">Meal Name</Label>
                <Input 
                  id="meal-name" 
                  value={mealName} 
                  onChange={(e) => setMealName(e.target.value)} 
                  placeholder="e.g., McDonald's Breakfast" 
                />
              </div>
              
              <div>
                <Label htmlFor="meal-description">Description (optional)</Label>
                <Input 
                  id="meal-description" 
                  value={mealDescription} 
                  onChange={(e) => setMealDescription(e.target.value)} 
                  placeholder="Brief description of the meal" 
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Total carbs display */}
        <div className="mt-4 p-3 bg-primary/10 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Carbs:</span>
            <Badge className="text-lg">{totalCarbs}g</Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {mode === "build" ? (
          <Button 
            onClick={handleCompleteMeal} 
            className="w-full flex items-center gap-2"
            disabled={mealItems.length === 0}
          >
            <span>Use This Meal</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleSavePreset} 
            className="w-full flex items-center gap-2"
            disabled={mealItems.length === 0 || !mealName}
          >
            <span>Save as Preset</span>
            <Save className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
