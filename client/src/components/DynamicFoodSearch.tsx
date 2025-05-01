import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useDebounce } from "@/hooks/use-debounce";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Portion {
  description: string;
  carbValue: number;
}

export interface FoodItem {
  name: string;
  description: string;
  portions: {
    small: Portion;
    medium: Portion;
    large: Portion;
  };
  portionSize?: "small" | "medium" | "large";
}

interface DynamicFoodSearchProps {
  onSelect: (item: FoodItem) => void;
  placeholderText?: string;
  showAddButton?: boolean;
}

export function DynamicFoodSearch({ 
  onSelect, 
  placeholderText = "Search for food (e.g., Big Mac, fries)",
  showAddButton = true 
}: DynamicFoodSearchProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Perform search when debounced search term changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      searchFood(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const searchFood = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/food-suggestions", { query });
      const data = await response.json();
      
      // Check if the response has an error flag
      if (data.error) {
        setSearchResults([]);
        return;
      }
      
      // For single result, wrap in array
      const results = Array.isArray(data) ? data : [data];
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching for food:", error);
      toast({
        title: "Search Error",
        description: "Could not complete the food search. Please try again.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
  };

  const handleSelectFood = (item: FoodItem) => {
    // Default to medium portion size if not specified
    onSelect({
      ...item,
      portionSize: "medium"
    });
    
    // Clear after selection
    setSearchTerm("");
    setSearchResults([]);
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            placeholder={placeholderText}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Search results */}
      {searchResults.length > 0 && !isLoading && (
        <ScrollArea className="mt-2 max-h-[200px] overflow-y-auto rounded-md border">
          <div className="p-2 space-y-2">
            {searchResults.map((item, index) => (
              <Card 
                key={`${item.name}-${index}`} 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <CardContent className="p-3 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-sm">{item.name}</h4>
                      <Badge variant="outline" className="ml-2">
                        {item.portions.medium.carbValue}g
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                  {showAddButton && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-2 h-7 w-7" 
                      onClick={() => handleSelectFood(item)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
