import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Utensils, Pizza } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

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

interface FoodSearchInputProps {
  onCarbValueSelected: (value: number) => void;
  id?: string;
}

export function FoodSearchInput({ onCarbValueSelected, id }: FoodSearchInputProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [food, setFood] = useState<FoodSuggestion | null>(null);
  const [selectedPortionSize, setSelectedPortionSize] = useState<"small" | "medium" | "large">("medium");

  const searchFood = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Please enter a food item",
        description: "Enter a food name to search for carb information",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/food-suggestions", { query: searchTerm });
      let data = await response.json();
      
      // If we got an array (from the improved endpoint), take the first item
      if (Array.isArray(data)) {
        if (data.length === 0) {
          toast({
            title: "Food not found",
            description: "Could not find nutritional information for this food",
            variant: "destructive",
          });
          return;
        }
        data = data[0];
      }
      
      // Check if the response has an error flag or is missing required data
      if (data.error || !data.portions) {
        toast({
          title: "Food not found",
          description: "Could not find nutritional information for this food",
          variant: "destructive",
        });
        return;
      }
      
      // Ensure all portion sizes exist with default values if missing
      const defaultPortion = { description: "Standard portion", carbValue: 0 };
      data.portions.small = data.portions.small || defaultPortion;
      data.portions.medium = data.portions.medium || defaultPortion;
      data.portions.large = data.portions.large || defaultPortion;
      
      setFood(data);
    } catch (error) {
      console.error("Error searching for food:", error);
      toast({
        title: "Error searching for food",
        description: "Unable to get carb information at this time",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchFood();
  };

  const handleSelectPortion = (size: "small" | "medium" | "large") => {
    setSelectedPortionSize(size);
  };

  const handleUseValue = () => {
    if (food) {
      onCarbValueSelected(food.portions[selectedPortionSize].carbValue);
      setIsOpen(false);
      setFood(null);
      setSearchTerm("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          id={id}
          variant="ghost"
          size="icon"
          className="ml-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-200"
          title="Search food carbs"
        >
          <Pizza className="h-5 w-5 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" /> 
            <span>AI Food Carb Search</span>
          </DialogTitle>
          <DialogDescription>
            Search for carbohydrate values for different foods and portion sizes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Search for a food (e.g., apple, pizza)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </form>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {food && !isLoading && (
          <div className="mt-4 space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-bold mb-1">{food.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{food.description}</p>
                
                <Tabs defaultValue={selectedPortionSize} onValueChange={(v) => handleSelectPortion(v as any)}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="small">Small</TabsTrigger>
                    <TabsTrigger value="medium">Medium</TabsTrigger>
                    <TabsTrigger value="large">Large</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="small" className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{food.portions.small.description}</p>
                      <Badge className="mt-2 text-lg">{food.portions.small.carbValue}g carbs</Badge>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="medium" className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{food.portions.medium.description}</p>
                      <Badge className="mt-2 text-lg">{food.portions.medium.carbValue}g carbs</Badge>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="large" className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{food.portions.large.description}</p>
                      <Badge className="mt-2 text-lg">{food.portions.large.carbValue}g carbs</Badge>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <Button onClick={handleUseValue} className="w-full mt-4">
                  Use this value ({food.portions[selectedPortionSize].carbValue}g)
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
