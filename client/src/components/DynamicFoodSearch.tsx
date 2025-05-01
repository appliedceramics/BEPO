import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "../hooks/use-debounce";
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
  clearOnSelect?: boolean;
}

export function DynamicFoodSearch({ 
  onSelect, 
  placeholderText = "Search for food (e.g., Big Mac, fries)",
  showAddButton = true,
  clearOnSelect = false
}: DynamicFoodSearchProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const debouncedSearch = useDebounce(searchTerm, 300); // Reduced debounce time for faster feedback
  const searchRequestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Perform search when debounced search term changes
  useEffect(() => {
    if (debouncedSearch && debouncedSearch.length >= 2) {
      searchFood(debouncedSearch);
    } else if (debouncedSearch === "") {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const searchFood = async (query: string) => {
    if (!query.trim()) return;
    
    const requestId = ++searchRequestRef.current;
    setIsLoading(true);
    
    try {
      console.log(`Searching for: ${query} (request ID: ${requestId})`);
      const response = await fetch("/api/food-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      
      // If this is no longer the current request, ignore results
      if (requestId !== searchRequestRef.current) {
        console.log(`Ignoring outdated request ${requestId}, current is ${searchRequestRef.current}`);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Results for request ${requestId}:`, data);
      
      // If this is no longer the current request, ignore results
      if (requestId !== searchRequestRef.current) {
        console.log(`Ignoring outdated response for ${requestId}, current is ${searchRequestRef.current}`);
        return;
      }
      
      // For single result, wrap in array
      const results = Array.isArray(data) ? data : (data ? [data] : []);
      setSearchResults(results);
    } catch (error: any) {
      // Only display error if this is still the current request
      if (requestId === searchRequestRef.current) {
        console.error("Error searching for food:", error);
        toast({
          title: "Search Error",
          description: "Could not complete the food search. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      // Only update loading state if this is still the current request
      if (requestId === searchRequestRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // Clear results immediately when search is cleared
    if (newValue === "") {
      setSearchResults([]);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchResults([]);
    // Focus the input after clearing it
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSelectFood = (item: FoodItem) => {
    // Default to medium portion size if not specified
    onSelect({
      ...item,
      portionSize: "medium"
    });
    
    // Clear only if clearOnSelect is true
    if (clearOnSelect) {
      setSearchTerm("");
      setSearchResults([]);
    } else {
      // If not clearing, focus back on the input to continue searching
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            placeholder={placeholderText}
            value={searchTerm}
            onChange={handleSearchChange}
            className="pr-8"
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={handleClearSearch}
              type="button"
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
      {searchTerm.length >= 2 && !isLoading && (
        <ScrollArea className="mt-2 max-h-[200px] overflow-y-auto rounded-md border">
          <div className="p-2 space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((item, index) => (
                <Card 
                  key={`${item.name}-${index}`} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelectFood(item)}
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
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleSelectFood(item);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No results found for "{searchTerm}"
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
