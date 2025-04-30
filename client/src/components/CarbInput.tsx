import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

interface CarbInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  hidden: boolean;
}

export function CarbInput({ value, onChange, hidden }: CarbInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(value?.toString() || "");

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

  if (hidden) {
    return null;
  }

  return (
    <div id="carb-input-container">
      <Label htmlFor="carb-input" className="block text-sm font-medium text-neutral-700 mb-1">
        Total Carbohydrates (g)
      </Label>
      <Input
        type="number"
        id="carb-input"
        placeholder="Enter carbs in grams"
        value={inputValue}
        onChange={handleInputChange}
        min="0"
        className="w-full"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
