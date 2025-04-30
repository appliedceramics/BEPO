import { useState } from "react";
import { MealPreset } from "@shared/schema";
import { useMealPresets } from "@/hooks/useMealPresets";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, Check, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertMealPresetSchema } from "@shared/schema";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MealPresetCardProps {
  preset: MealPreset;
  onEdit: (preset: MealPreset) => void;
  onDelete: (id: number) => void;
  onSelect: (preset: MealPreset) => void;
}

function MealPresetCard({ preset, onEdit, onDelete, onSelect }: MealPresetCardProps) {
  return (
    <Card className="mb-4 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{preset.name}</CardTitle>
          <Badge variant="secondary" className="ml-2">{preset.carbValue} g</Badge>
        </div>
        {preset.description && (
          <CardDescription className="mt-1 text-sm">{preset.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-between mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center" 
            onClick={() => onSelect(preset)}
          >
            <Check className="h-4 w-4 mr-1" />
            Select
          </Button>
          <div className="space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onEdit(preset)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(preset.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Form schema with validation
const formSchema = insertMealPresetSchema.extend({
  carbValue: z.coerce.number().min(1, "Carb value must be at least 1g").max(999, "Carb value can't exceed 999g"),
});

type FormValues = z.infer<typeof formSchema>;

interface MealPresetFormProps {
  preset?: MealPreset;
  onSubmit: (values: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function MealPresetForm({ preset, onSubmit, onCancel, isLoading }: MealPresetFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: preset?.name || "",
      carbValue: preset?.carbValue || undefined,
      description: preset?.description || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Food Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Apple" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="carbValue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Carbohydrates (g)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="15"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                The carbohydrate content in grams
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Medium sized apple"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {preset ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

interface MealPresetsProps {
  onSelectPreset: (preset: MealPreset) => void;
}

export function MealPresets({ onSelectPreset }: MealPresetsProps) {
  const { mealPresets, isLoading, createMutation, updateMutation, deleteMutation } = useMealPresets();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<MealPreset | null>(null);
  
  const handleCreateSubmit = (data: FormValues) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsAddOpen(false)
    });
  };
  
  const handleEditSubmit = (data: FormValues) => {
    if (selectedPreset) {
      updateMutation.mutate(
        { id: selectedPreset.id, data },
        { onSuccess: () => setIsEditOpen(false) }
      );
    }
  };
  
  const handleEdit = (preset: MealPreset) => {
    setSelectedPreset(preset);
    setIsEditOpen(true);
  };
  
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this meal preset?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">My Meal Presets</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="flex items-center">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Preset
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meal Preset</DialogTitle>
              <DialogDescription>
                Create a new meal preset to quickly access carb counts for your common foods.
              </DialogDescription>
            </DialogHeader>
            <MealPresetForm
              onSubmit={handleCreateSubmit}
              onCancel={() => setIsAddOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Meal Preset</DialogTitle>
            <DialogDescription>
              Update the details of your meal preset.
            </DialogDescription>
          </DialogHeader>
          {selectedPreset && (
            <MealPresetForm
              preset={selectedPreset}
              onSubmit={handleEditSubmit}
              onCancel={() => setIsEditOpen(false)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : mealPresets.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-background">
          <p className="text-muted-foreground mb-4">You don't have any meal presets yet</p>
          <Button 
            variant="outline" 
            onClick={() => setIsAddOpen(true)}
            className="flex items-center mx-auto"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Create your first preset
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="pr-4">
            {mealPresets.map((preset) => (
              <MealPresetCard
                key={preset.id}
                preset={preset}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onSelect={onSelectPreset}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}