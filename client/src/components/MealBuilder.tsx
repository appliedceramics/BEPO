import { useState } from "react";
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
          Build your meal by adding items and selecting portion sizes
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
              <DynamicFoodSearch onSelect={handleAddItem} />
              
              {mealItems.length > 0 && (
                <ScrollArea className="h-[200px] rounded-md border p-2">
                  <div className="space-y-2">
                    {mealItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(item.id)}
                              className="h-7 w-7 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="mt-2 flex items-center gap-2">
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
                            
                            <Badge>
                              {item.portions[item.portionSize || "medium"].carbValue}g
                            </Badge>
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
