import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface BepoCalculatorLogoProps {
  className?: string;
}

export function BepoCalculatorLogo({ className = '' }: BepoCalculatorLogoProps) {
  const [winking, setWinking] = useState(false);
  
  useEffect(() => {
    // Wink animation every 5 seconds
    const interval = setInterval(() => {
      setWinking(true);
      setTimeout(() => setWinking(false), 300);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={cn('relative w-20 h-20', className)}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* Calculator Body - Updated with gradient fill */}
        <defs>
          <linearGradient id="calculatorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <rect 
          x="10" 
          y="10" 
          width="80" 
          height="80" 
          rx="10" 
          fill="url(#calculatorGradient)" 
          filter="drop-shadow(0px 4px 4px rgba(0, 0, 0, 0.25))"
        />
        
        {/* Calculator Screen */}
        <rect 
          x="20" 
          y="20" 
          width="60" 
          height="18" 
          rx="4" 
          fill="#E0FCE8" 
          filter="drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.15))"
        />
        
        {/* Calculator Buttons */}
        <rect x="20" y="46" width="12" height="10" rx="3" fill="#FDFFB6" />
        <rect x="38" y="46" width="12" height="10" rx="3" fill="#FDFFB6" />
        <rect x="56" y="46" width="12" height="10" rx="3" fill="#FFD166" />
        <rect x="74" y="46" width="12" height="10" rx="3" fill="#06D6A0" />
        
        <rect x="20" y="62" width="12" height="10" rx="3" fill="#FFD166" />
        <rect x="38" y="62" width="12" height="10" rx="3" fill="#FFD166" />
        <rect x="56" y="62" width="12" height="10" rx="3" fill="#FFD166" />
        <rect x="74" y="62" width="12" height="10" rx="3" fill="#06D6A0" />
        
        <rect x="20" y="78" width="12" height="10" rx="3" fill="#FFD166" />
        <rect x="38" y="78" width="12" height="10" rx="3" fill="#FFD166" />
        <rect x="56" y="78" width="12" height="10" rx="3" fill="#FFD166" />
        <rect x="74" y="78" width="12" height="10" rx="3" fill="#06D6A0" />
        
        {/* Cartoon Face Elements */}
        <g className="calculator-face">
          {/* Left Eye */}
          <circle cx="32" cy="28" r="3" fill="#333" />
          
          {/* Right Eye (winking) */}
          {winking ? (
            <path 
              d="M68,28 Q68,25 65,25 Q62,25 62,28" 
              stroke="#333" 
              strokeWidth="2" 
              fill="none"
            />
          ) : (
            <circle cx="65" cy="28" r="3" fill="#333" />
          )}
          
          {/* Smile */}
          <path 
            d="M40,35 Q50,40 60,35" 
            stroke="#333" 
            strokeWidth="2" 
            fill="none"
            className={winking ? 'animate-bounce-small' : ''}
          />
        </g>
        
        {/* Display text */}
        <defs>
          <linearGradient id="bepoTextGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <text x="25" y="32" fontSize="10" fontFamily="monospace" fill="url(#bepoTextGradient)" fontWeight="bold" className="calculator-display">
          BEPO
        </text>
      </svg>
    </div>
  );
}
