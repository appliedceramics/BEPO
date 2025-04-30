import { MealType } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MealIcon } from "./AnimatedIcons";

interface MealSelectorProps {
  value: MealType | "";
  onChange: (value: MealType) => void;
}

export function MealSelector({ value, onChange }: MealSelectorProps) {
  return (
    <div className="bepo-card">
      <div className="flex items-center mb-2">
        <MealIcon />
        <Label htmlFor="meal-type" className="ml-2 text-sm font-medium text-primary">
          Select Meal Type
        </Label>
      </div>
      <Select
        value={value}
        onValueChange={(val) => onChange(val as MealType)}
      >
        <SelectTrigger id="meal-type" className="w-full bepo-input">
          <SelectValue placeholder="Select a meal type" />
        </SelectTrigger>
        <SelectContent className="border-accent/30">
          <SelectItem value="first">First Meal (Morning)</SelectItem>
          <SelectItem value="other">Other Meal</SelectItem>
          <SelectItem value="bedtime">Bedtime (No Meal)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
