import { useEffect, useState } from "react";

// Animated meal icon with bouncing plate and utensils
export function MealIcon() {
  const [bounce, setBounce] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-8 w-8 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Plate */}
        <ellipse 
          cx="25" 
          cy={bounce ? "28" : "30"} 
          rx="20" 
          ry="10" 
          fill="#f0f0f0" 
          stroke="#d0d0d0" 
          className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`}
        />
        
        {/* Fork */}
        <path 
          d={`M15,${bounce ? "11" : "13"} L15,25 C15,25 18,26 18,22 L18,13 M18,${bounce ? "11" : "13"} L18,13 M21,${bounce ? "11" : "13"} L21,25`} 
          fill="none" 
          stroke="#4a9c5e" 
          strokeWidth="2" 
          strokeLinecap="round" 
          className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`}
        />
        
        {/* Spoon */}
        <path 
          d={`M32,25 L32,${bounce ? "11" : "13"}`} 
          fill="none" 
          stroke="#4a9c5e" 
          strokeWidth="2" 
          strokeLinecap="round" 
          className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`}
        />
        <ellipse 
          cx="32" 
          cy={bounce ? "8" : "10"} 
          rx="3" 
          ry="5" 
          fill="#4a9c5e" 
          className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`}
        />
        
        {/* Food on plate */}
        <circle cx="20" cy={bounce ? "26" : "28"} r="3" fill="#f7a072" className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`} />
        <circle cx="28" cy={bounce ? "27" : "29"} r="4" fill="#8bc04f" className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`} />
        <circle cx="24" cy={bounce ? "23" : "25"} r="2" fill="#f94144" className={`transition-transform duration-300 ${bounce ? "-translate-y-1" : ""}`} />
      </svg>
    </div>
  );
}

// Animated carbs icon with pulsing bread
export function CarbsIcon() {
  const [pulse, setPulse] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-8 w-8 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Bread slice */}
        <path 
          d="M10,15 C10,10 15,5 25,5 C35,5 40,10 40,15 L40,35 C40,40 35,45 25,45 C15,45 10,40 10,35 Z" 
          fill="#f9c784" 
          stroke="#e8b16b" 
          strokeWidth="1" 
          className={`transition-transform duration-500 ${pulse ? "scale-105" : "scale-100"}`}
        />
        
        {/* Bread texture */}
        <circle cx="18" cy="20" r="2" fill="#f7dbb7" className={`transition-opacity duration-500 ${pulse ? "opacity-100" : "opacity-70"}`} />
        <circle cx="28" cy="15" r="1.5" fill="#f7dbb7" className={`transition-opacity duration-500 ${pulse ? "opacity-100" : "opacity-70"}`} />
        <circle cx="23" cy="28" r="2" fill="#f7dbb7" className={`transition-opacity duration-500 ${pulse ? "opacity-100" : "opacity-70"}`} />
        <circle cx="33" cy="24" r="1.5" fill="#f7dbb7" className={`transition-opacity duration-500 ${pulse ? "opacity-100" : "opacity-70"}`} />
        
        {/* Carb text */}
        <text 
          x="25" 
          y="28" 
          textAnchor="middle" 
          fill="#844921" 
          fontWeight="bold" 
          fontSize="10"
          className={`transition-transform duration-500 ${pulse ? "scale-110" : "scale-100"}`}
        >
          CARB
        </text>
      </svg>
    </div>
  );
}

// Animated blood glucose icon with dropping blood
export function BloodGlucoseIcon() {
  const [drip, setDrip] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDrip(true);
      setTimeout(() => setDrip(false), 800);
    }, 3500);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-8 w-8 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Test strip */}
        <rect x="10" y="10" width="30" height="8" rx="2" fill="#f2f2f2" stroke="#d0d0d0" />
        <rect x="13" y="12" width="24" height="4" rx="1" fill="#e6e6e6" />
        
        {/* Meter */}
        <rect x="15" y="18" width="20" height="15" rx="2" fill="#3a86ff" stroke="#0066cc" />
        <rect x="18" y="20" width="14" height="8" rx="1" fill="#ffffff" />
        
        {/* Blood drop */}
        <path 
          d={`M25,${drip ? "45" : "30"} C20,${drip ? "40" : "25"} 30,${drip ? "40" : "25"} 25,${drip ? "45" : "30"} Z`} 
          fill="#e63946" 
          className={`transition-all duration-800 ${drip ? "opacity-100" : "opacity-0"}`}
        />
        
        {/* Reading on meter */}
        <text 
          x="25" 
          y="26" 
          textAnchor="middle" 
          fill="#0066cc" 
          fontWeight="bold" 
          fontSize="6"
          className={`transition-transform duration-300 ${drip ? "scale-110" : "scale-100"}`}
        >
          7.2
        </text>
      </svg>
    </div>
  );
}

// Animated insulin icon with syringe
export function InsulinIcon() {
  const [plunge, setPlunge] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setPlunge(true);
      setTimeout(() => setPlunge(false), 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-8 w-8 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Syringe barrel */}
        <rect x="15" y="15" width="20" height="10" rx="2" fill="#d8f3dc" stroke="#95d5b2" />
        
        {/* Syringe plunger */}
        <rect 
          x={plunge ? "20" : "30"} 
          y="18" 
          width="15" 
          height="4" 
          rx="1" 
          fill="#1b4332" 
          className="transition-all duration-500"
        />
        
        {/* Needle */}
        <line x1="15" y1="20" x2="5" y2="20" stroke="#95d5b2" strokeWidth="1" />
        
        {/* Insulin liquid */}
        <rect 
          x="15" 
          y="15" 
          width={plunge ? "5" : "15"} 
          height="10" 
          fill="#a8dadc" 
          fillOpacity="0.7" 
          className="transition-all duration-500"
        />
        
        {/* Units markers */}
        <line x1="20" y1="15" x2="20" y2="25" stroke="white" strokeWidth="0.5" />
        <line x1="25" y1="15" x2="25" y2="25" stroke="white" strokeWidth="0.5" />
        <line x1="30" y1="15" x2="30" y2="25" stroke="white" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

// Animated log/history icon
export function LogIcon() {
  const [flip, setFlip] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setFlip(true);
      setTimeout(() => setFlip(false), 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-8 w-8 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Notebook */}
        <rect 
          x="10" 
          y="5" 
          width="30" 
          height="40" 
          rx="2" 
          fill="#fafafa" 
          stroke="#c0c0c0" 
          className={`transition-all duration-500 ${flip ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"}`}
        />
        <rect 
          x="10" 
          y="5" 
          width="30" 
          height="40" 
          rx="2" 
          fill="#f0f0f0" 
          stroke="#c0c0c0" 
          className={`transition-all duration-500 ${flip ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
        />
        
        {/* Spiral binding */}
        <line x1="10" y1="5" x2="10" y2="45" stroke="#0077b6" strokeWidth="2" />
        
        {/* Lines on page */}
        <line x1="15" y1="15" x2="35" y2="15" stroke="#e6e6e6" strokeWidth="1" />
        <line x1="15" y1="20" x2="35" y2="20" stroke="#e6e6e6" strokeWidth="1" />
        <line x1="15" y1="25" x2="35" y2="25" stroke="#e6e6e6" strokeWidth="1" />
        <line x1="15" y1="30" x2="35" y2="30" stroke="#e6e6e6" strokeWidth="1" />
        <line x1="15" y1="35" x2="35" y2="35" stroke="#e6e6e6" strokeWidth="1" />
        
        {/* Text entries */}
        <line x1="15" y1="15" x2="25" y2="15" stroke="#52b788" strokeWidth="2" className={`transition-opacity duration-500 ${flip ? "opacity-0" : "opacity-100"}`} />
        <line x1="15" y1="20" x2="30" y2="20" stroke="#52b788" strokeWidth="2" className={`transition-opacity duration-500 ${flip ? "opacity-0" : "opacity-100"}`} />
        <line x1="15" y1="25" x2="28" y2="25" stroke="#52b788" strokeWidth="2" className={`transition-opacity duration-500 ${flip ? "opacity-0" : "opacity-100"}`} />
        
        <line x1="15" y1="15" x2="28" y2="15" stroke="#52b788" strokeWidth="2" className={`transition-opacity duration-500 ${flip ? "opacity-100" : "opacity-0"}`} />
        <line x1="15" y1="20" x2="25" y2="20" stroke="#52b788" strokeWidth="2" className={`transition-opacity duration-500 ${flip ? "opacity-100" : "opacity-0"}`} />
        <line x1="15" y1="25" x2="32" y2="25" stroke="#52b788" strokeWidth="2" className={`transition-opacity duration-500 ${flip ? "opacity-100" : "opacity-0"}`} />
      </svg>
    </div>
  );
}