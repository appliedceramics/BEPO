import { useEffect, useState } from "react";

export function BepoLogo() {
  const [blink, setBlink] = useState(false);
  
  // Blinking animation for the character's eyes
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }, 3000);
    
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="w-20 h-20 md:w-24 md:h-24 relative">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* Hair */}
        <path 
          d="M20,40 C20,20 40,15 50,15 C60,15 80,20 80,40 L80,45 C80,45 75,42 70,42 L70,38 C70,38 65,32 50,32 C35,32 30,38 30,38 L30,42 C25,42 20,45 20,45 Z" 
          fill="#8B4513" 
          stroke="#6B3E26" 
          strokeWidth="1"
        />
        
        {/* Face */}
        <circle 
          cx="50" 
          cy="50" 
          r="30" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        
        {/* Eyes */}
        <ellipse 
          cx="40" 
          cy="45" 
          rx="3" 
          ry={blink ? "0.5" : "4"} 
          fill="#5E4B3E" 
          stroke="#3A2E27" 
          strokeWidth="1"
        />
        <ellipse 
          cx="60" 
          cy="45" 
          rx="3" 
          ry={blink ? "0.5" : "4"} 
          fill="#5E4B3E" 
          stroke="#3A2E27" 
          strokeWidth="1"
        />
        
        {/* Eyebrows */}
        <path 
          d="M36,38 C38,36 42,36 44,38" 
          fill="none" 
          stroke="#8B4513" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        <path 
          d="M56,38 C58,36 62,36 64,38" 
          fill="none" 
          stroke="#8B4513" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Nose */}
        <path 
          d="M50,50 C52,52 52,54 50,56 C48,54 48,52 50,50" 
          fill="#FFDABD" 
          stroke="#E8C39E" 
          strokeWidth="0.5"
        />
        
        {/* Mouth */}
        <path 
          d="M40,65 C45,70 55,70 60,65" 
          fill="none" 
          stroke="#E26A6A" 
          strokeWidth="1.5" 
          strokeLinecap="round"
        />
        
        {/* Ears */}
        <ellipse 
          cx="20" 
          cy="50" 
          rx="5" 
          ry="10" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        <ellipse 
          cx="80" 
          cy="50" 
          rx="5" 
          ry="10" 
          fill="#FFE0BD" 
          stroke="#E8C39E" 
          strokeWidth="1"
        />
        
        {/* Hair over ears */}
        <path 
          d="M20,40 C20,40 22,45 20,50" 
          fill="none" 
          stroke="#8B4513" 
          strokeWidth="2"
        />
        <path 
          d="M80,40 C80,40 78,45 80,50" 
          fill="none" 
          stroke="#8B4513" 
          strokeWidth="2"
        />
      </svg>
      
      {/* Add animated waves effect around the logo */}
      <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-green-200 opacity-50"></div>
      <div className="absolute inset-0 -z-20 animate-pulse delay-300 rounded-full bg-blue-200 opacity-30"></div>
    </div>
  );
}