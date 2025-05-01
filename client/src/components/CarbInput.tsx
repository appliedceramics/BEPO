import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { CarbsIcon } from "./AnimatedIcons";
import { VoiceInput } from "./VoiceInput";
import { Button } from "@/components/ui/button";
import { MealPresets } from "./MealPresets";
import { FoodSearchInput } from "./FoodSearchInput";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MealPreset } from "@shared/schema";
import { Book, Calculator, Utensils, PlusSquare } from "lucide-react";
import { FoodBasketSearch } from "./FoodBasketSearch";
import { TotalForMe } from "./TotalForMe";
import { useToast } from "@/hooks/use-toast";

interface CarbInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hidden: boolean;
}

export function CarbInput({ value, onChange, hidden }: CarbInputProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(value?.toString() || "");
  const [isPresetsOpen, setIsPresetsOpen] = useState(false);
  const [isFoodBasketOpen, setIsFoodBasketOpen] = useState(false);
  const [isTotalForMeOpen, setIsTotalForMeOpen] = useState(false);

  useEffect(() => {
    // Update input value when value prop changes
    setInputValue(value?.toString() || "");
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    if (val === "") {
      onChange(undefined);
      setError(null);
      return;
    }
    
    const numVal = parseFloat(val);
    if (isNaN(numVal) || numVal < 0) {
      setError("Please enter a valid number of carbs");
      onChange(undefined);
    } else {
      setError(null);
      onChange(numVal);
    }
  };

  // Handle voice input result
  const handleVoiceInput = (transcript: string) => {
    console.log('Voice input for carbs:', transcript);
    
    // Try to extract a number from the transcript
    // This regex will match the first number in the string (with optional decimal point)
    const match = transcript.match(/\d+(\.\d+)?/);
    
    if (match) {
      const numericValue = parseFloat(match[0]);
      if (!isNaN(numericValue) && numericValue >= 0) {
        // Update the input value
        setInputValue(numericValue.toString());
        setError(null);
        onChange(numericValue);
        
        toast({
          title: "Voice input recognized",
          description: `${numericValue}g of carbs entered`,
        });
      } else {
        setError("Invalid number detected in voice input");
      }
    } else {
      setError("Could not detect a number in your voice input");
    }
  };

  // Handle selecting a meal preset
  const handleSelectPreset = (preset: MealPreset) => {
    setInputValue(preset.carbValue.toString());
    onChange(preset.carbValue);
    setIsPresetsOpen(false);
    
    toast({
      title: "Meal preset selected",
      description: `${preset.name} (${preset.carbValue}g of carbs)`,
    });
  };
  

  
  // Handle saving a meal preset from the food basket
  const handleSaveMealPreset = (preset: { name: string, description: string, carbValue: number }) => {
    // Call API to save preset
    fetch("/api/meal-presets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preset),
    })
      .then(response => {
        if (!response.ok) throw new Error("Failed to save meal preset");
        return response.json();
      })
      .then(() => {
        // Close the dialog
        setIsFoodBasketOpen(false);
        
        // Set the carb value
        setInputValue(preset.carbValue.toString());
        onChange(preset.carbValue);
      })
      .catch(error => {
        console.error("Error saving meal preset:", error);
        toast({
          title: "Error saving preset",
          description: "There was a problem saving your meal preset",
          variant: "destructive",
        });
      });
  };

  if (hidden) {
    return null;
  }

  return (
    <div id="carb-input-container" className="bepo-card">
      <div className="flex items-center mb-2">
        <CarbsIcon />
        <Label htmlFor="carb-input" className="ml-2 text-sm font-medium text-primary">
          Total Carbohydrates (g)
        </Label>
      </div>
      <div className="flex items-center">
        <Input
          type="number"
          id="carb-input"
          placeholder="Enter carbs in grams"
          value={inputValue}
          onChange={handleInputChange}
          min="0"
          className="w-full bepo-input"
        />
        <VoiceInput 
          onResult={handleVoiceInput} 
          placeholder="carbohydrates" 
          fieldType="carbs" 
        />
        <FoodSearchInput 
          onCarbValueSelected={(value) => {
            setInputValue(value.toString());
            onChange(value);
          }} 
        />
        
        {/* Food Basket Button */}
        <Dialog open={isFoodBasketOpen} onOpenChange={setIsFoodBasketOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="ml-1" 
              size="icon"
              title="Create meal from multiple food items"
            >
              <Utensils className="h-5 w-5 text-primary" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Meal from Food Items</DialogTitle>
            </DialogHeader>
            <FoodBasketSearch 
              onSavePreset={handleSaveMealPreset}
            />
          </DialogContent>
        </Dialog>
        
        {/* Total For Me Button */}
        <Dialog open={isTotalForMeOpen} onOpenChange={setIsTotalForMeOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="ml-1" 
              size="icon"
              title="Total For Me - Voice Calculator"
            >
              <Calculator className="h-5 w-5 text-accent-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Total For Me</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Easily calculate total carbs using your voice. Simply speak food names and carb amounts.
              </p>
            </DialogHeader>
            <TotalForMe 
              onFinalTotal={(total) => {
                setInputValue(total.toString());
                onChange(total);
                setIsTotalForMeOpen(false);
              }} 
            />
          </DialogContent>
        </Dialog>
        
        {/* Meal Presets Button */}
        <Dialog open={isPresetsOpen} onOpenChange={setIsPresetsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="ml-1" 
              size="icon"
              title="Select from meal presets"
            >
              <Book className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Meal Presets</DialogTitle>
            </DialogHeader>
            <MealPresets onSelectPreset={handleSelectPreset} />
          </DialogContent>
        </Dialog>
      </div>
      {error && <p className="mt-1 text-sm text-red-600 animate-pulse">{error}</p>}
    </div>
  );
}
