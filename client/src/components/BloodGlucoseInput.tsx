import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertBgToMgdl } from "@/lib/correctionCalculator";
import { BloodGlucoseIcon } from "./AnimatedIcons";
import { VoiceInput } from "./VoiceInput";

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

  // Handle voice input result
  const handleVoiceInput = (transcript: string) => {
    console.log('Voice input for BG:', transcript);
    
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
        
        // Update mg/dL conversion
        const mgdl = convertBgToMgdl(numericValue).toFixed(1);
        setMgdlValue(`${mgdl} mg/dL`);
      } else {
        setError("Invalid number detected in voice input");
      }
    } else {
      setError("Could not detect a number in your voice input");
    }
  };

  return (
    <div className="bepo-card mb-6">
      <div className="flex items-center mb-3">
        <BloodGlucoseIcon />
        <h3 className="ml-2 text-lg font-medium text-primary">Blood Glucose</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bg-input" className="block text-sm font-medium text-primary/80 mb-1">
            Current BG (mmol/L)
          </Label>
          <div className="flex items-center">
            <Input
              type="number"
              id="bg-input"
              placeholder="Enter BG in mmol/L"
              value={inputValue}
              onChange={handleInputChange}
              min="0"
              step="0.1"
              className="w-full bepo-input"
            />
            <VoiceInput 
              onResult={handleVoiceInput} 
              placeholder="blood glucose" 
              fieldType="bg" 
            />
          </div>
          {error && <p className="mt-1 text-sm text-red-600 animate-pulse">{error}</p>}
        </div>
        <div>
          <Label className="block text-sm font-medium text-primary/80 mb-1">
            BG in mg/dL
          </Label>
          <div id="bg-mgdl" className="w-full px-3 py-2 rounded-md text-green-600 bg-accent/10 border border-accent/20 font-medium">
            {mgdlValue}
          </div>
        </div>
      </div>
    </div>
  );
}
