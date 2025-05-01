import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Utensils, Pizza, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Portion {
  description: string;
  carbValue: number;
}

interface FoodSuggestion {
  name: string;
  description: string;
  portions: {
    small: Portion;
    medium: Portion;
    large: Portion;
  };
}

interface MealSuggestionsProps {
  onSelectMeal: (name: string, description: string, carbValue: number) => void;
}

export function MealSuggestions({ onSelectMeal }: MealSuggestionsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<FoodSuggestion | null>(null);
  const [selectedPortionSize, setSelectedPortionSize] = useState<"small" | "medium" | "large">("medium");

  const searchMeals = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Please enter a meal type",
        description: "Enter a meal or food category for suggestions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/meal-suggestions", { query: searchTerm });
      const data = await response.json();
      
      // Check if we got a valid array result
      if (!Array.isArray(data) || data.length === 0) {
        toast({
          title: "No meal suggestions found",
          description: "Try another search term or food category",
          variant: "destructive",
        });
        setSuggestions([]);
        return;
      }
      
      setSuggestions(data);
      setSelectedMeal(null); // Reset selection
    } catch (error) {
      console.error("Error getting meal suggestions:", error);
      toast({
        title: "Error getting suggestions",
        description: "Unable to get meal suggestions at this time",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMeals();
  };

  const handleSelectMeal = (meal: FoodSuggestion) => {
    setSelectedMeal(meal);
  };

  const handleSelectPortion = (size: "small" | "medium" | "large") => {
    setSelectedPortionSize(size);
  };

  const handleConfirmSelection = () => {
    if (selectedMeal) {
      const portion = selectedMeal.portions[selectedPortionSize];
      const description = `${selectedMeal.description} - ${portion.description}`;
      onSelectMeal(selectedMeal.name, description, portion.carbValue);
      setIsOpen(false);
      // Reset
      setSelectedMeal(null);
      setSuggestions([]);
      setSearchTerm("");
    }
  };

  // Quick button suggestions
  const commonMealTypes = [
    "Breakfast",
    "Lunch",
    "Dinner",
    "Snacks",
    "Kid Meals",
    "Fast Food",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-2 items-center w-full bg-primary-50 border-primary-200 hover:bg-primary-100 transition-all duration-300"
        >
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Meal Suggestions</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" /> 
            <span>AI Meal Suggestions</span>
          </DialogTitle>
          <DialogDescription>
            Get AI-powered meal suggestions with carb counts for different portion sizes
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {commonMealTypes.map((type) => (
            <Button 
              key={type} 
              variant="outline" 
              size="sm" 
              className="text-xs h-9"
              onClick={() => {
                setSearchTerm(type);
                setTimeout(() => searchMeals(), 100);
              }}
            >
              {type}
            </Button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Enter meal type or food category"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {selectedMeal ? (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              className="mb-2"
              onClick={() => setSelectedMeal(null)}
            >
              ← Back to suggestions
            </Button>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-1">{selectedMeal.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{selectedMeal.description}</p>
                
                <Tabs defaultValue={selectedPortionSize} onValueChange={(v) => handleSelectPortion(v as any)}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="small">Small</TabsTrigger>
                    <TabsTrigger value="medium">Medium</TabsTrigger>
                    <TabsTrigger value="large">Large</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="small" className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{selectedMeal.portions.small.description}</p>
                      <Badge className="mt-2 text-lg">{selectedMeal.portions.small.carbValue}g carbs</Badge>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="medium" className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{selectedMeal.portions.medium.description}</p>
                      <Badge className="mt-2 text-lg">{selectedMeal.portions.medium.carbValue}g carbs</Badge>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="large" className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{selectedMeal.portions.large.description}</p>
                      <Badge className="mt-2 text-lg">{selectedMeal.portions.large.carbValue}g carbs</Badge>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Button onClick={handleConfirmSelection} className="w-full mt-4">
                  Use this meal ({selectedMeal.portions[selectedPortionSize].carbValue}g)
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          suggestions.length > 0 && !isLoading && (
            <ScrollArea className="h-[350px] mt-4">
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="cursor-pointer hover:border-primary transition-all duration-200" onClick={() => handleSelectMeal(suggestion)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{suggestion.name}</h3>
                        <Badge variant="outline">{suggestion.portions.medium.carbValue}g</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{suggestion.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
