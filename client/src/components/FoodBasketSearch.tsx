import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Plus, Search, X, Trash2, Check, ChevronUp, ChevronDown, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "../hooks/use-debounce";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FoodItem, Portion } from "./DynamicFoodSearch";

interface BasketItem extends FoodItem {
  id: string;
  portionSize: "small" | "medium" | "large";
}

interface FoodBasketSearchProps {
  onSavePreset: (preset: {
    name: string;
    description: string;
    carbValue: number;
  }) => void;
}

export function FoodBasketSearch({ onSavePreset }: FoodBasketSearchProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [basketItems, setBasketItems] = useState<BasketItem[]>([]);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [activeTab, setActiveTab] = useState<"search" | "save">("search");
  const [mealName, setMealName] = useState("");
  const [mealDescription, setMealDescription] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const searchRequestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate total carbs whenever basket items change
  useEffect(() => {
    const total = basketItems.reduce((sum, item) => {
      return sum + item.portions[item.portionSize].carbValue;
    }, 0);
    setTotalCarbs(total);
  }, [basketItems]);

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
      const response = await fetch("/api/food-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });
      
      // If this is no longer the current request, ignore results
      if (requestId !== searchRequestRef.current) {
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // If this is no longer the current request, ignore results
      if (requestId !== searchRequestRef.current) {
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

  const handleAddToBasket = (item: FoodItem) => {
    const newItem: BasketItem = {
      ...item,
      id: `${item.name}-${Date.now()}`,
      portionSize: "medium"
    };

    setBasketItems(prev => [...prev, newItem]);
    
    toast({
      title: "Added to basket",
      description: `${item.name} added to your food basket`,
    });
    
    // Reset search but keep focus for the next search
    setSearchTerm("");
    setSearchResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemoveFromBasket = (id: string) => {
    setBasketItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePortionChange = (id: string, size: "small" | "medium" | "large") => {
    setBasketItems(prev => prev.map(item => 
      item.id === id ? { ...item, portionSize: size } : item
    ));
  };

  const handleToggleItemDetails = (id: string) => {
    setExpandedItemId(prev => prev === id ? null : id);
  };

  const handleSavePreset = () => {
    if (!mealName) {
      toast({
        title: "Name required",
        description: "Please provide a name for your meal preset",
        variant: "destructive"
      });
      return;
    }

    if (basketItems.length === 0) {
      toast({
        title: "No food items",
        description: "Please add at least one food item to your meal",
        variant: "destructive"
      });
      return;
    }

    // Create a list of items for the description if no custom description
    const generatedDescription = !mealDescription && basketItems.length > 0
      ? `Contains: ${basketItems.map(item => item.name).join(", ")}`
      : mealDescription;

    onSavePreset({
      name: mealName,
      description: generatedDescription,
      carbValue: totalCarbs
    });

    // Reset form
    setBasketItems([]);
    setMealName("");
    setMealDescription("");
    setActiveTab("search");

    toast({
      title: "Meal preset saved",
      description: `${mealName} has been saved to your meal presets`
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">AI Food Search & Meal Creator</CardTitle>
        <CardDescription>
          Search for food items, add them to your basket, then save as a meal preset
        </CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "search" | "save")}>
        <TabsList className="grid w-full grid-cols-2 mx-4">
          <TabsTrigger value="search">Search & Add</TabsTrigger>
          <TabsTrigger value="save" disabled={basketItems.length === 0}>Save Meal</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="p-4 pt-2">
          <div className="space-y-4">
            {/* Search input */}
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Search for food items (e.g., sandwich, apple juice)"
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

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}

            {/* Search results */}
            {searchTerm.length >= 2 && !isLoading && (
              <div className="border rounded-md">
                <ScrollArea className="max-h-[200px]">
                  <div className="p-2 space-y-2">
                    {searchResults.length > 0 ? (
                      searchResults.map((item, index) => (
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
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="ml-2 h-7 w-7" 
                              onClick={() => handleAddToBasket(item)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
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
              </div>
            )}

            {/* Current basket */}
            {basketItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Your Food Basket</h3>
                  <Badge variant="secondary" className="font-semibold">
                    Total: {totalCarbs}g carbs
                  </Badge>
                </div>

                <ScrollArea className="max-h-[250px] border rounded-md">
                  <div className="p-2 space-y-2">
                    {basketItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="p-3 pb-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <h4 className="font-medium text-sm">{item.name}</h4>
                                <Badge className="ml-2">
                                  {item.portions[item.portionSize].carbValue}g
                                </Badge>
                              </div>
                              
                              <div className="flex items-center mt-1">
                                <Select 
                                  value={item.portionSize} 
                                  onValueChange={(value) => handlePortionChange(
                                    item.id, 
                                    value as "small" | "medium" | "large"
                                  )}
                                >
                                  <SelectTrigger className="h-7 text-xs w-28">
                                    <SelectValue placeholder="Portion size" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="small">
                                      Small ({item.portions.small.carbValue}g)
                                    </SelectItem>
                                    <SelectItem value="medium">
                                      Medium ({item.portions.medium.carbValue}g)
                                    </SelectItem>
                                    <SelectItem value="large">
                                      Large ({item.portions.large.carbValue}g)
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                <div className="flex ml-auto gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleToggleItemDetails(item.id)}
                                  >
                                    {expandedItemId === item.id ? 
                                      <ChevronUp className="h-4 w-4" /> : 
                                      <ChevronDown className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive"
                                    onClick={() => handleRemoveFromBasket(item.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {expandedItemId === item.id && (
                            <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                              <p>{item.description}</p>
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                <div>
                                  <span className="font-medium">Small:</span> {item.portions.small.description}
                                </div>
                                <div>
                                  <span className="font-medium">Medium:</span> {item.portions.medium.description}
                                </div>
                                <div>
                                  <span className="font-medium">Large:</span> {item.portions.large.description}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => setActiveTab("save")} 
                    className="w-full sm:w-auto"
                  >
                    Continue to Save Meal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="save" className="p-4 pt-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meal-name">Meal Name</Label>
              <Input
                id="meal-name"
                placeholder="Enter a name for this meal"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meal-description">Description (Optional)</Label>
              <Textarea
                id="meal-description"
                placeholder="Enter a description or leave blank for auto-generated"
                value={mealDescription}
                onChange={(e) => setMealDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Meal Contents</Label>
              <Card className="bg-background">
                <CardContent className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Food Items</span>
                    <Badge>{basketItems.length} items</Badge>
                  </div>
                  <ScrollArea className="max-h-[150px]">
                    <div className="space-y-1">
                      {basketItems.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span>
                            {item.name} ({item.portionSize})
                          </span>
                          <Badge variant="outline">
                            {item.portions[item.portionSize].carbValue}g
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold">
                    <span>Total Carbs</span>
                    <span>{totalCarbs}g</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-between gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setActiveTab("search")}
              >
                Back to Search
              </Button>
              <Button onClick={handleSavePreset}>
                Save Meal Preset
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
