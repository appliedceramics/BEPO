import { MealType } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface MealSelectorProps {
  value: MealType | "";
  onChange: (value: MealType) => void;
}

export function MealSelector({ value, onChange }: MealSelectorProps) {
  return (
    <div>
      <Label htmlFor="meal-type" className="block text-sm font-medium text-neutral-700 mb-1">
        Select Meal Type
      </Label>
      <Select
        value={value}
        onValueChange={(val) => onChange(val as MealType)}
      >
        <SelectTrigger id="meal-type" className="w-full">
          <SelectValue placeholder="Select a meal type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="first">First Meal (Morning)</SelectItem>
          <SelectItem value="other">Other Meal</SelectItem>
          <SelectItem value="bedtime">Bedtime (No Meal)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
