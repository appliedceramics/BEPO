import { useState, useEffect } from 'react';

interface BepoCalculatorLogoProps {
  className?: string;
}

export function BepoCalculatorLogo({ className = '' }: BepoCalculatorLogoProps) {
  // State for winking animation
  const [isWinking, setIsWinking] = useState(false);
  
  // Winking animation every few seconds
  useEffect(() => {
    const winkInterval = setInterval(() => {
      setIsWinking(true);
      setTimeout(() => setIsWinking(false), 300);
    }, 3000);
    
    return () => clearInterval(winkInterval);
  }, []);
  
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
        {/* Calculator body */}
        <rect x="20" y="10" width="80" height="60" rx="8" fill="#6EE7B7" stroke="#065F46" strokeWidth="2" />
        
        {/* Calculator display */}
        <rect x="30" y="20" width="60" height="15" rx="3" fill="#ECFDF5" stroke="#059669" strokeWidth="1" />
        
        {/* Display content */}
        <text x="35" y="31" fontFamily="monospace" fontSize="10" fill="#065F46">BEPO</text>
        
        {/* Calculator face */}
        <g transform="translate(40, 45)">
          {/* Left eye */}
          <circle cx="10" cy="0" r="5" fill="white" stroke="#065F46" strokeWidth="1" />
          <circle cx="10" cy="0" r="2" fill="#065F46" />
          
          {/* Right eye - winking */}
          {isWinking ? (
            <path d="M30,0 Q40,3 50,0" stroke="#065F46" strokeWidth="2" fill="none" />
          ) : (
            <>
              <circle cx="40" cy="0" r="5" fill="white" stroke="#065F46" strokeWidth="1" />
              <circle cx="40" cy="0" r="2" fill="#065F46" />
            </>
          )}
          
          {/* Smile - slightly raised on winking side */}
          <path 
            d={isWinking ? "M15,15 Q30,25 45,15" : "M15,15 Q30,22 45,15"} 
            stroke="#065F46" 
            strokeWidth="2" 
            fill="none" 
          />
        </g>
        
        {/* Calculator buttons */}
        <circle cx="35" cy="50" r="5" fill="#F0FDFA" stroke="#065F46" strokeWidth="1" />
        <circle cx="55" cy="50" r="5" fill="#F0FDFA" stroke="#065F46" strokeWidth="1" />
        <circle cx="75" cy="50" r="5" fill="#F0FDFA" stroke="#065F46" strokeWidth="1" />
        
        <circle cx="35" cy="65" r="5" fill="#F0FDFA" stroke="#065F46" strokeWidth="1" />
        <circle cx="55" cy="65" r="5" fill="#F0FDFA" stroke="#065F46" strokeWidth="1" />
        <circle cx="75" cy="65" r="5" fill="#F0FDFA" stroke="#065F46" strokeWidth="1" />
      </svg>
    </div>
  );
}
