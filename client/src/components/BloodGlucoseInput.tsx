import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertBgToMgdl } from "@/lib/correctionCalculator";

interface BloodGlucoseInputProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function BloodGlucoseInput({ value, onChange }: BloodGlucoseInputProps) {
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>(value?.toString() || "");
  const [mgdlValue, setMgdlValue] = useState<string>("-- mg/dL");

  useEffect(() => {
    // Update input value when value prop changes
    setInputValue(value?.toString() || "");
    
    // Update mg/dL conversion
    if (value !== undefined && !isNaN(value)) {
      const mgdl = convertBgToMgdl(value).toFixed(1);
      setMgdlValue(`${mgdl} mg/dL`);
    } else {
      setMgdlValue("-- mg/dL");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    
    if (val === "") {
      onChange(undefined);
      setError(null);
      setMgdlValue("-- mg/dL");
      return;
    }
    
    const numVal = parseFloat(val);
    if (isNaN(numVal) || numVal < 0) {
      setError("Please enter a valid blood glucose level");
      onChange(undefined);
      setMgdlValue("-- mg/dL");
    } else {
      setError(null);
      onChange(numVal);
      const mgdl = convertBgToMgdl(numVal).toFixed(1);
      setMgdlValue(`${mgdl} mg/dL`);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-primary-700 mb-3">Blood Glucose</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bg-input" className="block text-sm font-medium text-neutral-700 mb-1">
            Current BG (mmol/L)
          </Label>
          <Input
            type="number"
            id="bg-input"
            placeholder="Enter BG in mmol/L"
            value={inputValue}
            onChange={handleInputChange}
            min="0"
            step="0.1"
            className="w-full"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-1">
            BG in mg/dL
          </Label>
          <div id="bg-mgdl" className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-neutral-700">
            {mgdlValue}
          </div>
        </div>
      </div>
    </div>
  );
}
