import { useState, useEffect } from 'react';
import { MealType } from '@shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Create icons for each dosage purpose
function FirstMealIcon({ isSelected = false, isAnimated = true }) {
  const [bounce, setBounce] = useState(false);
  
  useEffect(() => {
    if (isAnimated) {
      const interval = setInterval(() => {
        setBounce(true);
        setTimeout(() => setBounce(false), 300);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAnimated]);
  
  return (
    <div className="h-12 w-12 relative mx-auto">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Sun rising */}
        <circle 
          cx="25" 
          cy={bounce ? "17" : "20"} 
          r="10" 
          fill="#FFD23F" 
          stroke="#EFA00B" 
          className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`}
        />
        
        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line 
            key={angle}
            x1="25" 
            y1={bounce ? "7" : "10"} 
            x2="25" 
            y2={bounce ? "3" : "5"} 
            stroke="#FFD23F" 
            strokeWidth="2" 
            transform={`rotate(${angle}, 25, ${bounce ? "17" : "20"})`}
            className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`}
          />
        ))}
        
        {/* Plate with breakfast */}
        <ellipse 
          cx="25" 
          cy="35" 
          rx="15" 
          ry="6" 
          fill="#f0f0f0" 
          stroke={isSelected ? "#4a9c5e" : "#d0d0d0"} 
          strokeWidth={isSelected ? "2" : "1"}
        />
        
        {/* Toast */}
        <rect x="20" y="30" width="10" height="7" rx="1" fill="#F9C784" />
        
        {/* Egg */}
        <circle cx="32" cy="31" r="3" fill="#ffffff" stroke="#f0f0f0" />
        <circle cx="32" cy="31" r="1" fill="#FFC700" />
      </svg>
    </div>
  );
}

function OtherMealIcon({ isSelected = false, isAnimated = true }) {
  const [rotate, setRotate] = useState(false);
  
  useEffect(() => {
    if (isAnimated) {
      const interval = setInterval(() => {
        setRotate(true);
        setTimeout(() => setRotate(false), 500);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAnimated]);
  
  return (
    <div className="h-12 w-12 relative mx-auto">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Plate */}
        <ellipse 
          cx="25" 
          cy="32" 
          rx="15" 
          ry="6" 
          fill="#f0f0f0" 
          stroke={isSelected ? "#4a9c5e" : "#d0d0d0"} 
          strokeWidth={isSelected ? "2" : "1"}
        />
        
        {/* Fork */}
        <path 
          d={`M15,13 L15,25 C15,25 18,26 18,22 L18,13 M18,11 L18,13 M21,11 L21,25`} 
          fill="none" 
          stroke="#6E7582" 
          strokeWidth="2" 
          strokeLinecap="round" 
          className={`origin-center transition-transform duration-500 ${rotate ? 'rotate-12' : ''}`}
        />
        
        {/* Food on plate */}
        <circle cx="20" cy="30" r="3" fill="#f7a072" />
        <circle cx="28" cy="32" r="4" fill="#8bc04f" />
        <rect x="23" y="27" width="8" height="5" rx="1" fill="#F05454" />
        <circle cx="32" cy="29" r="2" fill="#8bc04f" />
      </svg>
    </div>
  );
}

function BedtimeIcon({ isSelected = false, isAnimated = true }) {
  const [glow, setGlow] = useState(false);
  
  useEffect(() => {
    if (isAnimated) {
      const interval = setInterval(() => {
        setGlow(true);
        setTimeout(() => setGlow(false), 800);
      }, 3500);
      return () => clearInterval(interval);
    }
  }, [isAnimated]);
  
  return (
    <div className="h-12 w-12 relative mx-auto">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Moon */}
        <path 
          d="M25,10 C17,10 15,17 15,25 C15,33 21,40 30,40 C35,40 38,38 40,36 C35,36 25,33 25,20 C25,15 28,12 30,10 C28,10 27,10 25,10 Z" 
          fill={glow ? "#FBBF24" : "#D3CEA3"} 
          stroke={isSelected ? "#4a9c5e" : "#9CA3AF"} 
          strokeWidth={isSelected ? "2" : "1"}
          className="transition-colors duration-800"
        />
        
        {/* Stars */}
        <circle 
          cx="10" 
          cy="15" 
          r="1.5" 
          fill="white" 
          className={`transition-opacity duration-800 ${glow ? 'opacity-100' : 'opacity-50'}`}
        />
        <circle 
          cx="40" 
          cy="12" 
          r="1" 
          fill="white" 
          className={`transition-opacity duration-800 ${glow ? 'opacity-100' : 'opacity-50'}`}
        />
        <circle 
          cx="35" 
          cy="22" 
          r="1.5" 
          fill="white" 
          className={`transition-opacity duration-800 ${glow ? 'opacity-100' : 'opacity-50'}`}
        />
        <circle 
          cx="15" 
          cy="30" 
          r="1" 
          fill="white" 
          className={`transition-opacity duration-800 ${glow ? 'opacity-100' : 'opacity-50'}`}
        />
      </svg>
    </div>
  );
}

function LongActingIcon({ isSelected = false, isAnimated = true }) {
  const [pulse, setPulse] = useState(false);
  
  useEffect(() => {
    if (isAnimated) {
      const interval = setInterval(() => {
        setPulse(true);
        setTimeout(() => setPulse(false), 700);
      }, 4500);
      return () => clearInterval(interval);
    }
  }, [isAnimated]);
  
  return (
    <div className="h-12 w-12 relative mx-auto">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Clock face */}
        <circle 
          cx="25" 
          cy="25" 
          r="15" 
          fill="#F0F0F0" 
          stroke={isSelected ? "#4a9c5e" : "#9CA3AF"} 
          strokeWidth={isSelected ? "2" : "1"}
        />
        
        {/* 24hr text */}
        <text 
          x="25" 
          y="15" 
          fontSize="5" 
          textAnchor="middle" 
          fill="#374151"
          fontWeight="bold"
        >
          24hr
        </text>
        
        {/* Hour hand */}
        <line 
          x1="25" 
          y1="25" 
          x2="25" 
          y2="18" 
          stroke="#4B5563" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          className={pulse ? 'animate-spin-slow' : ''}
          style={{ transformOrigin: '25px 25px', transform: 'rotate(210deg)' }}
        />
        
        {/* Minute hand */}
        <line 
          x1="25" 
          y1="25" 
          x2="25" 
          y2="15" 
          stroke="#4B5563" 
          strokeWidth="1" 
          strokeLinecap="round" 
          className={pulse ? 'animate-spin-very-slow' : ''}
          style={{ transformOrigin: '25px 25px', transform: 'rotate(60deg)' }}
        />
        
        {/* Center dot */}
        <circle 
          cx="25" 
          cy="25" 
          r="1.5" 
          fill={pulse ? "#EF4444" : "#4B5563"} 
          className="transition-colors duration-700"
        />
        
        {/* Hour markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
          <line 
            key={angle}
            x1="25" 
            y1="13" 
            x2="25" 
            y2="15" 
            stroke="#9CA3AF" 
            strokeWidth="1" 
            transform={`rotate(${angle}, 25, 25)`}
          />
        ))}
        
        {/* Small pill/capsule at bottom */}
        <rect 
          x="20" 
          y="32" 
          width="10" 
          height="4" 
          rx="2" 
          fill={pulse ? "#93C5FD" : "#BFDBFE"} 
          className="transition-colors duration-500"
        />
      </svg>
    </div>
  );
}

interface DosagePurposeSelectorProps {
  value: MealType | '';
  onChange: (value: MealType) => void;
}

export function DosagePurposeSelector({ value, onChange }: DosagePurposeSelectorProps) {
  const dosageOptions = [
    { id: 'first', label: 'First Meal', icon: FirstMealIcon },
    { id: 'other', label: 'Other Meal', icon: OtherMealIcon },
    { id: 'bedtime', label: 'Bedtime', icon: BedtimeIcon },
    { id: 'longActing', label: 'Long Acting 24hr', icon: LongActingIcon },
  ];

  return (
    <div className="bepo-card">
      <Label className="text-base font-medium text-primary mb-4 block">Dosage Purpose</Label>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {dosageOptions.map((option) => {
          const isSelected = value === option.id;
          const Icon = option.icon;
          
          return (
            <Card 
              key={option.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:scale-105",
                isSelected ? "border-primary bg-primary/5 shadow-md" : "border-border bg-background hover:border-primary/50"
              )}
              onClick={() => onChange(option.id as MealType)}
            >
              <CardContent className="p-3">
                <Icon isSelected={isSelected} />
                <p className={cn(
                  "text-center mt-2 font-medium",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}>
                  {option.label}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
