import { useState, useEffect } from "react";

// Accurate Calculations Icon
export function CalculationsIcon() {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-12 w-12 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Calculator body */}
        <rect 
          x="5" 
          y="5" 
          width="40" 
          height="40" 
          rx="3" 
          fill="#e7f5ff" 
          stroke="#4a9c5e" 
          strokeWidth="2"
          className={animate ? "animate-pulse" : ""}
        />
        
        {/* Calculator screen */}
        <rect 
          x="10" 
          y="10" 
          width="30" 
          height="10" 
          rx="2" 
          fill="white" 
          stroke="#4a9c5e" 
          strokeWidth="1"
        />
        
        {/* Number showing on screen */}
        <text 
          x="32" 
          y="18" 
          textAnchor="end" 
          fill="#0062cc" 
          fontSize="8"
          fontWeight="bold"
          className={animate ? "animate-pulse" : ""}
        >
          {animate ? "7.2" : "5.6"}
        </text>
        
        {/* Calculator buttons */}
        <rect x="10" y="25" width="6" height="6" rx="1" fill="#4a9c5e" />
        <rect x="22" y="25" width="6" height="6" rx="1" fill="#4a9c5e" />
        <rect x="34" y="25" width="6" height="6" rx="1" fill="#4a9c5e" />
        
        <rect 
          x="10" 
          y="35" 
          width="6" 
          height="6" 
          rx="1" 
          fill={animate ? "#0062cc" : "#4a9c5e"}
          className="transition-colors duration-300"
        />
        <rect x="22" y="35" width="6" height="6" rx="1" fill="#4a9c5e" />
        <rect x="34" y="35" width="6" height="6" rx="1" fill="#4a9c5e" />
      </svg>
    </div>
  );
}

// Easy Tracking Icon
export function TrackingIcon() {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 500);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-12 w-12 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Clipboard background */}
        <rect 
          x="10" 
          y="5" 
          width="30" 
          height="40" 
          rx="2" 
          fill="#fafafa" 
          stroke="#4a9c5e" 
          strokeWidth="2"
        />
        
        {/* Clipboard top */}
        <rect 
          x="18" 
          y="2" 
          width="14" 
          height="6" 
          rx="2" 
          fill="#e6e6e6" 
          stroke="#4a9c5e" 
          strokeWidth="1"
        />
        
        {/* Clipboard lines */}
        <line 
          x1="15" 
          y1="15" 
          x2="35" 
          y2="15" 
          stroke="#adb5bd" 
          strokeWidth="1"
        />
        <line 
          x1="15" 
          y1="22" 
          x2="35" 
          y2="22" 
          stroke="#adb5bd" 
          strokeWidth="1"
        />
        <line 
          x1="15" 
          y1="29" 
          x2="35" 
          y2="29" 
          stroke="#adb5bd" 
          strokeWidth="1"
        />
        <line 
          x1="15" 
          y1="36" 
          x2="35" 
          y2="36" 
          stroke="#adb5bd" 
          strokeWidth="1"
        />
        
        {/* Pencil - animated */}
        <g 
          transform={animate ? "translate(0, -3)" : "translate(0, 0)"}
          className="transition-transform duration-500"
        >
          <path 
            d="M15,29 L25,29 L25,28 L15,28 z" 
            fill="#4a9c5e"
            className={animate ? "opacity-100" : "opacity-0"}
          />
          <path 
            d="M32,25 L32,28 L28,32 L25,32 Z" 
            fill="#ffc107" 
            stroke="#dc3545" 
            strokeWidth="0.5"
          />
          <rect 
            x="32" 
            y="20" 
            width="3" 
            height="5" 
            fill="#6c757d"
          />
        </g>
      </svg>
    </div>
  );
}

// SMS Notification Icon
export function NotifyIcon() {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 800);
    }, 3500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-12 w-12 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Phone */}
        <rect 
          x="10" 
          y="5" 
          width="20" 
          height="40" 
          rx="3" 
          fill="#f8f9fa" 
          stroke="#495057" 
          strokeWidth="1.5"
        />
        
        {/* Phone screen */}
        <rect 
          x="12" 
          y="10" 
          width="16" 
          height="30" 
          rx="1" 
          fill="#e9ecef"
        />
        
        {/* Message bubble */}
        <rect 
          x="15" 
          y={animate ? "15" : "20"} 
          width="12" 
          height="8" 
          rx="2" 
          fill="#4a9c5e"
          className="transition-all duration-800"
          opacity={animate ? "1" : "0"}
        />
        
        {/* Text line in bubble */}
        <line 
          x1="17" 
          y1={animate ? "18" : "23"} 
          x2="24" 
          y2={animate ? "18" : "23"} 
          stroke="white" 
          strokeWidth="1"
          opacity={animate ? "1" : "0"}
          className="transition-all duration-800"
        />
        <line 
          x1="17" 
          y1={animate ? "20" : "25"} 
          x2="22" 
          y2={animate ? "20" : "25"} 
          stroke="white" 
          strokeWidth="1"
          opacity={animate ? "1" : "0"}
          className="transition-all duration-800"
        />
        
        {/* Radio waves */}
        <path 
          d="M32,15 C36,20 36,30 32,35" 
          fill="none" 
          stroke="#4a9c5e" 
          strokeWidth="1.5"
          strokeDasharray={animate ? "0,0" : "2,2"}
          className="transition-all duration-500"
          opacity={animate ? "1" : "0.7"}
        />
        
        <path 
          d="M36,10 C44,20 44,30 36,40" 
          fill="none" 
          stroke="#4a9c5e" 
          strokeWidth="1.5"
          strokeDasharray={animate ? "0,0" : "2,2"}
          className="transition-all duration-500"
          opacity={animate ? "1" : "0.5"}
        />
      </svg>
    </div>
  );
}

// Voice Input Icon
export function VoiceInputIcon() {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 700);
    }, 4500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-12 w-12 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Microphone base */}
        <rect 
          x="20" 
          y="15" 
          width="10" 
          height="20" 
          rx="5" 
          fill={animate ? "#ff6b6b" : "#adb5bd"}
          className="transition-colors duration-300"
          stroke="#343a40"
          strokeWidth="1"
        />
        
        {/* Microphone top */}
        <rect 
          x="20" 
          y="10" 
          width="10" 
          height="5" 
          rx="2.5" 
          fill={animate ? "#ff6b6b" : "#adb5bd"}
          className="transition-colors duration-300"
          stroke="#343a40"
          strokeWidth="1"
        />
        
        {/* Mic stand */}
        <path 
          d="M25,35 L25,40 L15,40 L15,42 L35,42 L35,40 L25,40"
          fill="none"
          stroke="#343a40"
          strokeWidth="1.5"
        />
        
        {/* Sound waves */}
        <path 
          d="M35,25 C38,20 38,30 35,25" 
          fill="none" 
          stroke={animate ? "#ff6b6b" : "#adb5bd"}
          className="transition-colors duration-300"
          strokeWidth="1.5"
          opacity={animate ? "1" : "0"}
        />
        
        <path 
          d="M40,25 C45,15 45,35 40,25" 
          fill="none" 
          stroke={animate ? "#ff6b6b" : "#adb5bd"}
          className="transition-colors duration-300"
          strokeWidth="1.5"
          opacity={animate ? "0.8" : "0"}
        />
        
        <path 
          d="M15,25 C12,20 12,30 15,25" 
          fill="none" 
          stroke={animate ? "#ff6b6b" : "#adb5bd"}
          className="transition-colors duration-300"
          strokeWidth="1.5"
          opacity={animate ? "1" : "0"}
        />
        
        <path 
          d="M10,25 C5,15 5,35 10,25" 
          fill="none" 
          stroke={animate ? "#ff6b6b" : "#adb5bd"}
          className="transition-colors duration-300"
          strokeWidth="1.5"
          opacity={animate ? "0.8" : "0"}
        />
      </svg>
    </div>
  );
}

// Meal Presets Icon
export function MealPresetsIcon() {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="h-12 w-12 relative">
      <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        {/* Plate */}
        <circle 
          cx="25" 
          cy="25" 
          r="20" 
          fill="#f8f9fa" 
          stroke="#343a40" 
          strokeWidth="1"
        />
        
        <circle 
          cx="25" 
          cy="25" 
          r="15" 
          fill="#f8f9fa" 
          stroke="#adb5bd" 
          strokeDasharray="2,2" 
          strokeWidth="1"
        />
        
        {/* Food items - animated to appear/disappear */}
        <g className="transition-opacity duration-500" opacity={animate ? "1" : "0.7"}>
          <circle 
            cx="20" 
            cy="20" 
            r="5" 
            fill="#ffc107" 
            stroke="#e67700" 
            strokeWidth="0.5"
          />
          <circle 
            cx="30" 
            cy="16" 
            r="3" 
            fill="#82c91e" 
            stroke="#5c940d" 
            strokeWidth="0.5"
          />
          <circle 
            cx="32" 
            cy="26" 
            r="4" 
            fill="#fa5252" 
            stroke="#c92a2a" 
            strokeWidth="0.5"
          />
          <circle 
            cx="18" 
            cy="30" 
            r="3.5" 
            fill="#be4bdb" 
            stroke="#862e9c" 
            strokeWidth="0.5"
          />
        </g>
        
        {/* Star indicating preset - appears during animation */}
        <path 
          d="M25,5 L27,10 L32,10 L28,13 L30,18 L25,15 L20,18 L22,13 L18,10 L23,10 Z" 
          fill="#ffd43b"
          stroke="#f08c00"
          strokeWidth="0.5"
          className="transition-opacity duration-500"
          opacity={animate ? "1" : "0"}
        />
      </svg>
    </div>
  );
}